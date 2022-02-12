import os
from datetime import datetime

from django.apps import AppConfig
import yfinance as yf
from django.http import HttpRequest

from api.views import is_holiday, con, convert_ticker_name, train_for_ticker, forecast_for_ticker
from server.settings import BASE_DIR, DEBUG

models_directory = os.path.join(BASE_DIR, 'api/models/')
print(models_directory)


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        run_once = os.environ.get('CMDLINERUNNER_RUN_ONCE')
        if run_once is not None:
            return
        os.environ['CMDLINERUNNER_RUN_ONCE'] = 'True'

        # Code that runs only once

        if DEBUG:
            print('DEVELOPMENT MODE')
        else:
            print('PRODUCTION MODE')
        today = datetime.now().date().strftime('%Y-%m-%d')
        print('Today : ', today)
        if is_holiday(today):
            print('Hola! Today is a Holiday')
        else:
            print('Stock Market is Open Today!')

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
        if len(data) == 0 and len(models_available) > 0:
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
                cursor.execute(
                    f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
                con.commit()
                trained = train_for_ticker(ticker)
                forecasted = False
                if trained:
                    forecasted = forecast_for_ticker(ticker, force=1)
                if trained is True and forecasted is True:
                    print(f'SERVER FROM START: INITIAL {ticker} LOADED')
                else:
                    message = 'Fatal Server Error!'
                    print(message)
                    exit(-1)
        elif len(data) == 0 and len(models_available) == 0:
            print('NO DATA FOUND\nSERVER BOOTING WITH INITIAL DATA')
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
            cursor.execute(
                f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
            con.commit()
            trained = train_for_ticker(ticker)
            forecasted = False
            if trained:
                forecasted = forecast_for_ticker(ticker, force=1)
            if trained is True and forecasted is True:
                print(f'SERVER FROM START: INITIAL {ticker} LOADED')
            else:
                message = 'Fatal Server Error!'
                print(message)
                exit(-1)
        elif len(data) < len(models_available):
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
                cursor.execute(
                    f'''create table {company_name}(DATE varchar(30), ACTUAL decimal(10, 4), PRED decimal(10, 4) );''')
                con.commit()
                trained = train_for_ticker(ticker)
                forecasted = False
                if trained:
                    forecasted = forecast_for_ticker(ticker, force=1)
                if trained is True and forecasted is True:
                    print(f'SERVER FROM START: INITIAL {ticker} LOADED')
                else:
                    message = 'Fatal Server Error!'
                    print(message)
                    exit(-1)
        else:
            command = 'SELECT * FROM companies;'
            cursor.execute(command)
            data = cursor.fetchall()

            for i in data:
                companies.append(i[0].upper())

            print(f'''.{'-' * 33}.''')
            print('|Companies\t\t| STATUS  |')
            print(f'''|{'-' * 33}|''')
            for company in companies:
                forecast_for_ticker(company)
            print(f''':{'-' * 33}:''')
