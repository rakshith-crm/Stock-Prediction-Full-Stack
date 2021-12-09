from django.http import JsonResponse, HttpRequest
from rest_framework.decorators import api_view
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import tensorflow as tf
import numpy as np
import psycopg2
import urllib.parse as urlparse
from server.settings import DATABASE_URL, DEBUG

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



@api_view(['GET'])
def insert_into_companies(request, company_name):

    ticker = company_name.upper()
    company_name = company_name.upper().replace('.ns', '').replace('.NS', '').replace('.Ns', '').replace('.nS', '')
    cursor = con.cursor()
    command = f'''select * from companies where company_name='{company_name}';'''
    cursor.execute(command)
    data = cursor.fetchall()
    if(len(data)==0):
        print(f'New Company {company_name}')
        stock = yf.Ticker(ticker).info['regularMarketPrice'] 
        if stock==None:
            message = 'Stock Does not Exist. Invalid Ticker'
            return JsonResponse({'status':'false','message':message}, status=500)
        command = f'''insert into companies values('{company_name}');'''
        con.commit()
        cursor.execute(command)
        cursor.execute(f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
        con.commit()
        trained = train_for_ticker(ticker)
        forecasted=False
        if trained:
            forecasted = forecast_for_ticker(ticker)
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
def select_all_from_table(request, tablename):
    if tablename == ' ':
        print('Tablename is Empty(Space), Sending Default table')
        tablename = 'TATASTEEL.NS'

    tablename = tablename.replace('.ns', '').replace('.NS', '')
    cursor = con.cursor()
    cursor.execute(f'''select * from {tablename} order by date;''')
    data = cursor.fetchall()[-100:]
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
    zoom = zoom + final[-20:]
    json_response = {"data" : final, "zoom" : zoom}
    return JsonResponse(json_response, safe=False)

def insert_value(company_name, tuple):
    company_name = company_name.replace('.ns', '').replace('.NS', '').replace('.Ns', '').replace('.nS', '')
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
    checking = ticker.replace('.ns', '').replace('.NS', '').replace('.Ns', '').replace('.nS', '')
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
    print(stock_price)

    batch_size = 12
    shuffler = 1000

    dataset = windowed_dataset(series[:365], window_size, batch_size, shuffler)
    print(dataset)

    model = tf.keras.models.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=[window_size]),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dense(1000, activation='relu'),
        tf.keras.layers.Dense(1000, activation='relu'),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(1),
        # tf.keras.layers.Lambda(lambda x : x+1000.0)
    ])
    lr = 1e-8
    epochs = 500

    model.compile(loss='mse', optimizer=tf.keras.optimizers.SGD(learning_rate=lr, momentum=0.9))
    model.fit(dataset, epochs=epochs)

    model.save('./models/'+checking+'_model.h5')

    forecast = []

    for time in range(len(series)-window_size):
        forecast.append(model.predict(series[time:time+window_size][np.newaxis]))

    results = np.array(forecast)[:, 0, 0]
    # plt.plot(series[window_size:])
    # plt.plot(results)
    # plt.figure(figsize=(24, 12))
    # plt.show()
    today = datetime.now().date().strftime('%Y-%m-%d')
    model = tf.keras.models.load_model('./models/'+checking+'_model.h5')
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

def forecast_for_ticker(ticker):
    try:
        ticker = ticker.upper()
        checking = ticker.replace('.ns', '').replace('.NS', '').replace('.Ns', '').replace('.nS', '')
        next_week_date = (datetime.now().date()+timedelta(7)).strftime('%Y-%m-%d')
        cursor = con.cursor()
        command = f'''select * from {checking} where date='{next_week_date}' ;'''
        # print(command)
        cursor.execute(command)
        data = cursor.fetchall()
        if(len(data)>0):
            print(f'|%-14s |  True   |'%checking)
            return False
        else:
            print(f'|%-14s |  False  |'%checking)
        model = tf.keras.models.load_model('./models/'+checking+'_model.h5')
        today = datetime.now().date().strftime('%Y-%m-%d')
        stock_price = yf.Ticker(ticker).history(start='2021-01-01', end=today).Close
        if len(stock_price)==0:
            stock_price = yf.Ticker(checking).history(start='2021-01-01', end=today).Close
        series = np.array(stock_price)
        dates = np.array([time.strftime('%Y-%m-%d') for time in stock_price.index])

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

        days = 7
        new_forecast = series.copy()
        new_pred = []
        for iter in range(days):
            val = model.predict(np.expand_dims(new_forecast[-window_size:], axis=0))[0][0]
            new_forecast = np.append(new_forecast, [val], axis=0)
            new_pred.append(val)
        # train_data = windowed_dataset(series[-12:], window_size=window_size, batch_size=1, shuffler=2)
        # dict_ = {'DATE' : dates[-1], ticker.upper() : series[-1], 'PRED' : np.NaN}
        # dict_2 = {'DATE' : today, ticker.upper() : np.NaN, 'PRED' : today_pred}
        # dict_3 = {'DATE' : next_week_date.strftime('%Y-%m-%d'), ticker.upper() : np.NaN, 'PRED' : new_pred[-1]}
        insert_value(ticker, (dates[-1], series[-1], None))
        insert_value(ticker, (today, None, today_pred))
        insert_value(ticker, (next_week_date, None, new_pred[-1]))
    except:
        return False    
    return True

@api_view(['GET'])
def get_all_companies(request):
    cursor = con.cursor()
    command = 'SELECT * FROM companies;'
    cursor.execute(command)
    data = cursor.fetchall()
    companies = []
    for i in data:
        companies.append(i[0].upper()+'.NS')
    json_responce = {'data' : companies};
    return JsonResponse(json_responce, safe=False)


cursor = con.cursor()
try:
    command = 'SELECT * FROM companies;'
    cursor.execute(command)
    data = cursor.fetchall()
except:
    command = 'create table companies(company_name varchar(30));'
    data = []
companies = []
if(len(data)==0):
    
    print('Major Server Error')
    request = HttpRequest()
    request.method = 'GET'
    ticker = 'TATASTEEL.NS'
    company_name = ticker.replace('.ns', '').replace('.NS', '')
    command = f'''insert into companies values('{company_name}');'''
    con.commit()
    cursor.execute(command)
    cursor.execute(f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
    con.commit()
    trained = train_for_ticker(ticker)
    forecasted=False
    if trained:
        forecasted = forecast_for_ticker(ticker)
    if (trained==True and forecasted==True):
        print(f'SERVER FROM START: INITIAL {ticker} LOADED')
    else:
        message = 'Fatal Server Error!'
        exit(-1)
    command = command = 'SELECT * FROM companies;'
    cursor.execute(command)
    data = cursor.fetchall()

for i in data:
    companies.append(i[0].upper()+'.NS')

print(f'''.{'-'*25}.''')
print('|Companies\t| STATUS  |')
print(f'''|{'-'*25}|''')
for company in companies:
    forecast_for_ticker(company)
print(f''':{'-'*25}:''')

