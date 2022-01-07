from django.urls import path
from .views import get_all_companies, insert_into_companies, select_all_from_table, subscribe, unsubscribe

urlpatterns = [
    path('stock-request/<str:company_name>', insert_into_companies),
    path('stock-data/<str:tablename>/', select_all_from_table),
    path('allcompanies/', get_all_companies),
    path('subscribe/<str:company_name>', subscribe),
    path('unsubscribe/<str:company_name>', unsubscribe)
]