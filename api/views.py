from django.http import JsonResponse, HttpRequest
from numpy.core.numeric import full
from rest_framework.decorators import api_view
from tensorflow.python.autograph.impl.api import convert
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import tensorflow as tf
import numpy as np
import json
import re  
import psycopg2
import urllib.parse as urlparse
import io
from server.settings import DATABASE_URL, DEBUG, EMAIL_ADDR, PASSWORD
import os
import smtplib, ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.base import MIMEBase
from email.encoders import encode_base64
import matplotlib.pyplot as plt
import hashlib

window_size = 100

if(DEBUG):
    con = psycopg2.connect(
    database='STOCKS',
    user = 'postgres',
    password='arra1902',
    host='127.0.0.1',
    port=5432
)
else:
    result = urlparse.urlparse(DATABASE_URL)
    username = result.username
    password = result.password
    database = result.path[1:]
    hostname = result.hostname
    port = result.port
    con = psycopg2.connect(
    database = database,
    user = username,
    password = password,
    host = hostname,
    port = port
)

cursor = con.cursor()

predict_till = 50
get_last = 400 # days
rewrite_last = 10

def hash_function(ticker):
    return str(int(hashlib.sha256(ticker.encode('utf-8')).hexdigest(), 16) % 10**8)

def convert_ticker_name(ticker):
    punctuation = """!\"#$%&'()*+-/:;<=>?@[\\]^_`{|}~"""
    edited = ''
    for letter in ticker:
        if letter not in punctuation:
            edited += letter
    edited = edited.upper().replace('.NS', '')+'_'+hash_function(ticker)
    return edited

def request_static_stock_mail(ticker):
    port = 465  # For SSL
    smtp_server = "smtp.gmail.com"
    sender_email = EMAIL_ADDR # Enter your address
    receiver_email = "rakshithcrm@gmail.com"  # Enter receiver address
    msg = MIMEMultipart('alternative')
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = f'Stock Request - {ticker}'
    password = PASSWORD
    html = """\
    <html>
    <head></head>
    <body>
        <p>Hi Rakshith!<br>
        Stock Requested - <br> Server requesting static model for Stock Ticker
        </p>
        <br>
        With Regards <br>
        Stock Prediction Server :)
    </body>
    </html>
    """
    part = MIMEText(html, 'html')
    msg.attach(part)
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())

def check_valid_email(email):
    regex = '^[a-z0-9]+[\._]?[a-z0-9]+[@]\w+[.]\w{2,3}$'  
    if(re.search(regex,email)):   
        return True
    return False

def subscription_confirmation_mail(companies, email_id, count_of_stocks):
    port = 465  # For SSL
    smtp_server = "smtp.gmail.com"
    sender_email = EMAIL_ADDR
    receiver_email = email_id  # Enter receiver address
    msg = MIMEMultipart('alternative')
    msg['From'] = sender_email
    msg['To'] = receiver_email
    if(count_of_stocks=='SINGLE'):
        msg['Subject'] = f'Subscription Confirmation - {companies}'
    else:
        msg['Subject'] = f'Subscription Confirmation - All Stocks'
    password = PASSWORD
    html = """\
    <html>
    <head></head>
    <body>
        <p>Hi Subscriber!<br>
        You have successfully subscribed to the stock. 
        You will be receiving daily email about the chosen stock's prediction. 
        You could track your stock with ease. 
        You no longer need to visit the site everyday. 
        :D
        </p>
        <br>
        With Regards <br>
        Stock Prediction Server :)
    </body>
    </html>
    """
    part = MIMEText(html, 'html')
    msg.attach(part)
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())

@api_view(['POST'])
def subscribe(request):
    body = json.loads(request.body)
    companies = body['stocks']
    email = body['email'].lower()
    if(len(companies)==0):
        message = "No Stocks Selected. Please select atleast one stock to subscribe too! :D"
        response = JsonResponse({'status':'invalid','message':message}, status=400) 
        return response

    print(f'''{email}, Subscribing to {companies}''')
    if not check_valid_email(email):
        message = "Invalid Email! Please Enter a valid email."
        response = JsonResponse({'status':'invalid','message':message}, status=400) 
        return response
    cursor = con.cursor()
    message = ''
    for company in companies:
        command = f'''SELECT * FROM SUBSCRIBERS WHERE ticker='{company}' and email='{email}' '''
        cursor.execute(command)
        data = cursor.fetchall()
        if(len(data)==0):
            command = f'''INSERT INTO SUBSCRIBERS VALUES('{email}', '{company.upper()}')'''
            cursor.execute(command)
    con.commit()
    message = f'Subscribed to {companies} :D'
    subscription_confirmation_mail(companies, email, 'SINGLE')
    response = JsonResponse({'status':'true','message':message}, status=200)
    return response

@api_view(['DELETE'])
def unsubscribe(request):
    body = json.loads(request.body)
    companies = body['stocks']
    email = body['email'].lower()
    if(len(companies)==0):
        message = "No Stocks Selected. Please select atleast one stock to unsubscribe too! :D"
        response = JsonResponse({'status':'invalid','message':message}, status=400) 
        return response
    print(f'''{email}, Unsubscribing to {companies}''')
    if not check_valid_email(email):
        message = "Invalid Email! Please Enter a valid email."
        response = JsonResponse({'status':'invalid','message':message}, status=400) 
        return response
    cursor = con.cursor()
    for company in companies:
        command = f'''DELETE FROM SUBSCRIBERS WHERE ticker='{company}' and email='{email}' '''
        cursor.execute(command)
    con.commit()
    message = f'Unsubscribed to {companies} :('
    response = JsonResponse({'status':'true','message':message}, status=200)
    return response

@api_view(['GET'])
def insert_into_companies(request, ticker):
    ticker = ticker.upper()
    company_name = convert_ticker_name(ticker)
    command = f'''select * from companies where company_name='{ticker}';'''
    cursor = con.cursor()
    cursor.execute(command)
    data = cursor.fetchall()
    if(len(data)==0):
        print(f'Checking ticker {ticker}')
        stock = yf.Ticker(ticker)
        exists = stock.info['regularMarketPrice']
        if exists==None:
                message = 'Stock Does not Exist. Invalid Ticker :('
                return JsonResponse({'status':'false','message':message}, status=500)
        if DEBUG==False:
            request_static_stock_mail(ticker)
            message = 'Admin Intimated. Please Check Back In One Hour'
            return JsonResponse({'status':'true','message':message}, status=200)
        print(stock.info)
        try:
            fullname = stock.info['longName']
        except:
            fullname = stock.info['shortName']
        command = f'''insert into companies values('{ticker}', '{fullname}');'''
        cursor.execute(command)
        cursor.execute(f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
        con.commit()
        trained = train_for_ticker(ticker)
        forecasted=False
        if trained:
            forecasted = forecast_for_ticker(ticker, force=1)
        if (trained==True and forecasted==True):
            message = 'Request, Succesfully processed. Reload Page'
            return JsonResponse({'status':'true','message':message}, status=200)
        else:
            message = 'Unexpected Server Error!'
            return JsonResponse({'status':'false','message':message}, status=500)
    else:
        message = 'Company Already Exists'
        forecast_for_ticker(ticker)
        return JsonResponse({'status':'false','message':message}, status=500)

@api_view(['GET'])
def select_all_from_table(request, ticker):
    if ticker == ' ':
        print('Tablename is Empty(Space), Sending Default table')
        cursor = con.cursor()
        command = 'SELECT * FROM companies order by company_name;'
        cursor.execute(command)
        data = cursor.fetchall()
        ticker = data[0][0]
    ticker = ticker.upper()
    tablename = convert_ticker_name(ticker)
    print(f"Tablename is {tablename}")
    cursor = con.cursor()
    cursor.execute(f'''select * from {tablename} order by date;''')
    data = cursor.fetchall()[-get_last:]
    final = []
    final.append([{'type': 'string', 'label' : 'Date'}, 'Actual', 'Pred'])
    for i in range(len(data)):
        f = []
        f.append(data[i][0])
        if(data[i][1]==None):
            f.append(None)
        else:
            f.append(float(data[i][1]))
        if(data[i][2]==None):
            f.append(None)
        else:
            f.append(float(data[i][2]))
        final.append(f)
    zoom = []
    zoom.append([{'type': 'string', 'label' : 'Date'}, 'Actual', 'Pred'])
    zoom = zoom + final[-2*predict_till:]
    command = f'''select full_name from companies where company_name='{ticker}' '''
    cursor.execute(command)
    fullname = cursor.fetchall()[0][0]
    json_response = {
        "company_name" : fullname,
        "data" : final,
        "zoom" : zoom, 
        "main_title" : f'PAST {get_last} DAYS + {predict_till} DAYS ',
        "sub_title" : f'PAST {predict_till} DAYS + {predict_till} DAYS ',
        }
    return JsonResponse(json_response, safe=False)

@api_view(['GET'])
def get_all_companies(request):
    cursor = con.cursor()
    command = 'SELECT * FROM companies order by company_name;'
    cursor.execute(command)
    data = cursor.fetchall()
    companies = []
    for i in data:
        companies.append(i[0].upper())
    json_responce = {'data' : companies};
    return JsonResponse(json_responce, safe=False)

def insert_value(ticker, tuple):
    company_name = convert_ticker_name(ticker)
    cursor = con.cursor()
    date, actual, pred = tuple
    if pred is None:
        pred = 'NULL'
    if actual is None:
        actual = 'NULL'
    command = f'''select DATE from {company_name} where DATE='{date}';'''
    cursor.execute(command);
    data = cursor.fetchall()
    if(len(data)==0):
        print('New Date')
        cursor.execute(f'''insert into {company_name} values('{date}', {actual}, {pred});''')
    else:
        print('Date Exists')
        if actual!='NULL':
            cursor.execute(f'''update {company_name} set actual={actual} where date='{date}' ;''')
        if pred!='NULL':
            cursor.execute(f'''update {company_name} set pred={pred} where date='{date}' ;''')

    con.commit()

def group_insert(ticker, data):
    company_name = convert_ticker_name(ticker)
    cursor = con.cursor()
    for tuple in data:
        date, actual, pred = tuple
        if pred is None:
            pred = 'NULL'
        if actual is None:
            actual = 'NULL'
        command = f'''select DATE from {company_name} where DATE='{date}';'''
        cursor.execute(command);
        data = cursor.fetchall()
        if(len(data)==0):
            print('New Date')
            cursor.execute(f'''insert into {company_name} values('{date}', {actual}, {pred});''')
        else:
            print('Date Exists')
            if actual!='NULL':
                cursor.execute(f'''update {company_name} set actual={actual} where date='{date}' ;''')
            if pred!='NULL':
                cursor.execute(f'''update {company_name} set pred={pred} where date='{date}' ;''')
    con.commit()

def is_company(tablename):
    tablename = tablename.replace('.ns', '').replace('.NS', '').replace('.Ns', '').replace('.nS', '')
    cursor = con.cursor()
    cursor.execute(f'''select * from companies where company_name='{tablename}' ;''')
    data = cursor.fetchall()
    if len(data)==0:
        return False
    return True

def get_data_of_stocks(ticker):
    df = pd.read_csv('./output/'+ticker.upper()+'.csv')
    actual_orig = list(df[ticker.upper()][-30:])
    dates = list(df['DATE'][-30:])
    pred_orig = list(df['PRED'][-30:])
    actual = []
    pred = []
    for i in actual_orig:
        if i is np.NaN:
            actual.append(0)
        else:
            actual.append(i)
    for i in pred_orig:
        if i is np.NaN:
            pred.append(0)
        else:
            pred.append(i)
    json_responce = {'dates' : dates, 'actual' : actual, 'pred' : pred}
    return json_responce

@tf.autograph.experimental.do_not_convert
def windowed_dataset(series, window_size, batch_size, shuffler):
    dataset = tf.data.Dataset.from_tensor_slices(series)
    dataset = dataset.window(size=window_size+1, shift=1, drop_remainder=True)
    dataset = dataset.flat_map(lambda window : window.batch(window_size+1))
    dataset = dataset.map(lambda window : (window[:-1], window[-1]))
    if shuffler!=None:
        dataset = dataset.shuffle(shuffler)
    dataset = dataset.batch(batch_size).prefetch(1)
    return dataset

def train_for_ticker(ticker):
    ticker = ticker.upper()
    checking = convert_ticker_name(ticker)
    print('Ticker : ', ticker)
    today = datetime.now().date().strftime('%Y-%m-%d')
    try:
        stock_price = yf.Ticker(ticker).history(start='2020-01-01', end=today).Close
    except:
        print('Stock Not Found')
        return False
    series = np.array(stock_price)
    series = series[~np.isnan(series)]

    dates = np.array([time.strftime('%Y-%m-%d') for time in stock_price.index])
    average_stock_price = sum(series) / len(series)
    print('Average Price = ', average_stock_price)

    batch_size = 12
    shuffler = 1000

    dataset = windowed_dataset(series[:365], window_size, batch_size, shuffler)
    print(dataset)
    try:
        model = tf.keras.models.load_model('./models/'+ticker+'_model.h5')
    except:
        model = tf.keras.models.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=[window_size]),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dense(1000, activation='relu'),
            tf.keras.layers.Dense(1000, activation='relu'),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dense(1)
        ])
        if average_stock_price < 3000:
            lr = 1e-8
        elif average_stock_price >= 3000 and average_stock_price < 8000:
            lr = 1e-9
        elif average_stock_price >= 8000 and average_stock_price < 16000:
            lr = 1e-10
        elif average_stock_price >= 16000 and average_stock_price < 24000:
            lr = 1e-11
        elif average_stock_price >= 24000 and average_stock_price < 30000:
            lr = 1e-12
        else:
            lr = 1e-13
        epochs = 500

        model.compile(loss='mse', optimizer=tf.keras.optimizers.SGD(learning_rate=lr, momentum=0.9))
        model.fit(dataset, epochs=epochs)

        model.save('./models/'+ticker+'_model.h5')

    forecast = []

    for time in range(len(series)-window_size):
        forecast.append(model.predict(series[time:time+window_size][np.newaxis]))

    results = np.array(forecast)[:, 0, 0]
    # plt.plot(series[window_size:])
    # plt.plot(results)
    # plt.figure(figsize=(24, 12))
    # plt.show()
    today = datetime.now().date().strftime('%Y-%m-%d')
    model = tf.keras.models.load_model('./models/'+ticker+'_model.h5')
    # stock_price = yf.Ticker(ticker).history(start='2021-01-01', end=today).Close
    # print(stock_price)
    # dates = np.array([time.strftime('%Y-%m-%d') for time in stock_price.index])
    # series = np.array(stock_price)
        # series = series[~np.isnan(series)]

    # dates = np.array([time.strftime('%Y-%m-%d') for time in stock_price.index])
    # window_size=10
    forecast = []

    for time in range(len(series)-window_size):
        forecast.append(model.predict(series[time:time+window_size][np.newaxis]))

    results = np.array(forecast)[:, 0, 0]

    no_pred = []
    for i in range(window_size):
        # No predictions
        # dict_ = {'DATE' : dates[i], ticker.upper() : series[i], 'PRED' : np.NaN}
        insert_value(ticker, (dates[i], series[i], None))
        # no_pred.append(dict_)

    have_pred = []
    for i in range(len(results)):
        dict_ = {'DATE' : dates[i+window_size], ticker.upper() : series[i+window_size], 'PRED' : results[i]}
        insert_value(ticker, (dates[i+window_size], series[i+window_size], results[i]))
        # have_pred.append(dict_)

    return True
    # append_to_csv(no_pred+have_pred)
# utility function to send email to subscribers
def subscriber_email(ticker, image_path):
    port = 465  # For SSL
    smtp_server = "smtp.gmail.com"
    sender_email = "pettaparaak003@gmail.com"  # Enter your address
    cursor = con.cursor()
    command = f'''SELECT EMAIL FROM SUBSCRIBERS WHERE ticker='{ticker}' '''
    cursor.execute(command)
    data = cursor.fetchall()
    print(ticker)
    receiver_email = ["rakshithcrm@gmail.com"]  # Enter receiver address
    for email in data:
        if email[0] not in receiver_email:
            receiver_email.append(email[0])
    print(receiver_email)
    msg = MIMEMultipart('alternative')
    msg['From'] = sender_email
    msg['Subject'] = f'{ticker} :  PREDICTION FOR TODAY({datetime.today().strftime("%Y-%m-%d")})'
    password = "wvbyqfnwbzxrhpqz"
    html = """\
    <html>
    <head></head>
    <body>
        <p>Hi Subscriber!<br>
        Thanks for subscribing to us
        </p>
        <br>
        With Regards <br>
        Rakshith C.R.M <br>
        Stock Prediction Server :)
        <br><br>
        Please find our attached prediction below! Have a great day!
    </body>
    </html>
    """
    img = open(image_path, 'rb')
    msgImage = MIMEImage(img.read())
    img.close()
    part = MIMEText(html, 'html')
    msg.attach(part)
    msgImage.add_header('Content-Disposition', "attachment; filename= %s" % ticker)
    msg.attach(msgImage)
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
# utility function to get latest 50 and next 50 stock data and send update to subscribers
def daily_quick_peek(ticker):
    tablename = convert_ticker_name(ticker)
    cursor = con.cursor()
    cursor.execute(f'''select * from {tablename} order by date;''')
    data = cursor.fetchall()[-8*predict_till:]
    dates = []
    actual = []
    pred = []
    for row in data:
        dates.append(row[0])
        actual.append(row[1])
        pred.append(row[2])
    fig = plt.figure()
    plt.plot([1],[1])
    plt.clf()
    plt.title(f'''{tablename.upper()} : DATE : {datetime.today().strftime('%Y-%m-%d')}''')
    plt.plot(dates, actual, label="actual")
    plt.plot(dates, pred, label="pred")
    plt.legend()
    buf = io.BytesIO()
    plt.savefig(buf, format = 'png')
    buf.seek(0)
    ## Mailing the plot to the users
    port = 465  # For SSL
    smtp_server = "smtp.gmail.com"
    sender_email = EMAIL_ADDR
    cursor = con.cursor()
    command = f'''SELECT EMAIL FROM SUBSCRIBERS WHERE ticker='{ticker}' '''
    cursor.execute(command)
    data = cursor.fetchall()
    print(ticker)
    receiver_email = ["rakshithcrm@gmail.com"]  # Enter receiver address
    for email in data:
        if email[0] not in receiver_email:
            receiver_email.append(email[0])
    print(receiver_email)
    msg = MIMEMultipart('alternative')
    msg['From'] = sender_email
    msg['Subject'] = f'{ticker} :  PREDICTION FOR TODAY({datetime.today().strftime("%Y-%m-%d")})'
    password = PASSWORD
    html = """\
    <html>
    <head></head>
    <body>
        <p>Hi Subscriber!<br>
        Thanks for subscribing to us
        </p>
        <br>
        With Regards <br>
        Rakshith C.R.M <br>
        Stock Prediction Server :)
        <br><br>
        Please find our attached prediction below! Have a great day!
    </body>
    </html>
    """
    html_part = MIMEText(html, 'html')
    msg.attach(html_part)
    image_part = MIMEBase('application', "octet-stream")
    image_part.set_payload(buf.read())
    encode_base64(image_part)
    image_part.add_header('Content-Disposition', 'attachment; filename="%s"' % f'{ticker.upper()}.png')
    msg.attach(image_part)
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())

def forecast_for_ticker(ticker, force=0):
    try:
        ticker = ticker.upper()
        checking = convert_ticker_name(ticker)
        today = datetime.now().date().strftime('%Y-%m-%d')
        next_week_date = (datetime.now().date()+timedelta(predict_till-1)).strftime('%Y-%m-%d')
        cursor = con.cursor()
        command = f'''select * from {checking} where date='{next_week_date}' ;'''
        # print(command)
        cursor.execute(command)
        data = cursor.fetchall()
        if(len(data)>0):
            print(f'|%-22s |  True   |'%checking)
            return False
        else:
            print(f'|%-22s |  False  |'%checking)
            if is_holiday(today) and force==0:
                return False
        model = tf.keras.models.load_model('./models/'+ticker+'_model.h5')
        stock_price = yf.Ticker(ticker).history(start='2021-01-01', end=today).Close
        series = np.array(stock_price)
        dates = np.array([time.strftime('%Y-%m-%d') for time in stock_price.index])
        # Check Past Actual values are set
        rewrite_last_group_data = []
        for i in range(rewrite_last):
            # print(f'{ticker}, ({dates[-2-i]}, {series[-2-i]}, None)')
            rewrite_last_group_data.append((dates[-2-i], series[-2-i], None))
        group_insert(ticker, rewrite_last_group_data)
        # data = windowed_dataset(series[-8:], window_size, batch_size, None)

        print('''Yesterday's Stock Value \t: ''', series[-1], ' - ', dates[-1])
        last_window_days = np.expand_dims(series[-window_size:], axis=0)
        for_todays_pred = np.expand_dims(series[-window_size-1:-1], axis=0)
        yesterday_pred = model.predict(for_todays_pred)[0][0]
        today_pred = model.predict(last_window_days)[0][0]

        print(f'''Our Prediction of Yesterday's \t:  {yesterday_pred} - {dates[-1]}''')
        print(f'''Prediction for the Today's day \t:  {today_pred} - {today}''')
        print(today_pred - yesterday_pred)
        if (today_pred - yesterday_pred)>0:
            print('Stock Price Increasing')
        else:
            print('Stock Price Decreasing')
        # Insert yesterday's actual price and today's prediction
        insert_value(ticker, (dates[-1], series[-1], None))
        if not is_holiday(today):
            insert_value(ticker, (today, None, today_pred))

        days = predict_till
        new_forecast = series.copy()
        new_pred = []
        group_insert_data = []
        for iter in range(days):
            val = model.predict(np.expand_dims(new_forecast[-window_size:], axis=0))[0][0]
            new_forecast = np.append(new_forecast, [val], axis=0)
            new_pred.append(val)
            if iter>0:
                iter_date = (datetime.now().date()+timedelta(iter)).strftime('%Y-%m-%d')
                if not is_holiday(iter_date):
                    group_insert_data.append((iter_date, None, val))
        print('Group Inserting Data')
        group_insert(ticker, group_insert_data)
        print('Group Data Inserted')
        if force==0:
            daily_quick_peek(ticker)
    except:
        return False    
    return True

def is_holiday(date):
    format = '%Y-%m-%d'
    inp_date = datetime.strptime(date, format)
    weekday = inp_date.weekday()
    if weekday==5 or weekday==6:
        return True
    return False

today = datetime.now().date().strftime('%Y-%m-%d')
print('Today : ', today)
if is_holiday(today):
    print('Hola! Today is a Holiday')

cursor = con.cursor()
try:
    command = 'SELECT * FROM companies;'
    try:
        cursor.execute(command)
    except:
        cursor.close()
        cursor = con.cursor()
        command = 'CREATE TABLE COMPANIES(company_name varchar(50) primary key, full_name varchar(50));'
        cursor.execute(command)
        con.commit()

    data = cursor.fetchall()
except:
    command = 'create table companies(company_name varchar(30));'
    cursor.execute(command)
    con.commit()
    data = []
companies = []

models_available = os.listdir('./models')
if(len(data)==0 and len(models_available)>0):
    print('Pretrained models exists...\n---------------------------')
    for ticker in models_available:
        ticker = ticker.replace('_model.h5', '')
        try:
            fullname = yf.Ticker(ticker).info['longName']
        except:
            fullname = yf.Ticker(ticker).info['shortName']
        company_name = convert_ticker_name(ticker)
        command = f'''insert into companies values('{ticker}', '{fullname}');'''
        con.commit()
        cursor.execute(command)
        cursor.execute(f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
        con.commit()
        trained = train_for_ticker(ticker)
        forecasted=False
        if trained:
            forecasted = forecast_for_ticker(ticker, force=1)
        if (trained==True and forecasted==True):
            print(f'SERVER FROM START: INITIAL {ticker} LOADED')
        else:
            message = 'Fatal Server Error!'
            exit(-1)
elif(len(data)==0 and len(models_available)==0):
    print('Major Server Error')
    request = HttpRequest()
    request.method = 'GET'
    ticker = 'TATASTEEL.NS'
    try:
        fullname = yf.Ticker(ticker).info['longName']
    except:
        fullname = yf.Ticker(ticker).info['shortName']
    company_name = convert_ticker_name(ticker)
    command = f'''insert into companies values('{ticker}', '{fullname}');'''
    con.commit()
    cursor.execute(command)
    cursor.execute(f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
    con.commit()
    trained = train_for_ticker(ticker)
    forecasted=False
    if trained:
        forecasted = forecast_for_ticker(ticker, force=1)
    if (trained==True and forecasted==True):
        print(f'SERVER FROM START: INITIAL {ticker} LOADED')
    else:
        message = 'Fatal Server Error!'
        exit(-1)
elif(len(data)<len(models_available)):
    print('New models detected...')
    new_models = []
    all_ticker = []
    for company in data:
        all_ticker.append(company[0])
    for ticker in models_available:
        ticker = ticker.replace('_model.h5', '')
        if ticker not in all_ticker:
            new_models.append(ticker)
    for ticker in new_models:
        try:
            fullname = yf.Ticker(ticker).info['longName']
        except:
            fullname = yf.Ticker(ticker).info['shortName']
        company_name = convert_ticker_name(ticker)
        command = f'''insert into companies values('{ticker}', '{fullname}');'''
        con.commit()
        cursor.execute(command)
        cursor.execute(f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
        con.commit()
        trained = train_for_ticker(ticker)
        forecasted=False
        if trained:
            forecasted = forecast_for_ticker(ticker, force=1)
        if (trained==True and forecasted==True):
            print(f'SERVER FROM START: INITIAL {ticker} LOADED')
        else:
            message = 'Fatal Server Error!'
            exit(-1)  
else:
    command = command = 'SELECT * FROM companies;'
    cursor.execute(command)
    data = cursor.fetchall()

    for i in data:
        companies.append(i[0].upper())

    print(f'''.{'-'*33}.''')
    print('|Companies\t\t| STATUS  |')
    print(f'''|{'-'*33}|''')
    for company in companies:
        forecast_for_ticker(company)
    print(f''':{'-'*33}:''')

