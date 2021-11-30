from django.apps import AppConfig
from server.settings import BASE_DIR
from .views import forecast_for_ticker, get_all_companies, insert_value
from datetime import datetime, timedelta, date
import tensorflow as tf
import numpy as np
import yfinance as yf
import os
import psycopg2
models_directory = os.path.join(BASE_DIR, 'api/models/')
print(models_directory)
class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'