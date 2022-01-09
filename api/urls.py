from django.urls import path
from .views import get_all_companies, insert_into_companies, select_all_from_table, subscribe, unsubscribe

urlpatterns = [
    path('stock-request/<str:ticker>', insert_into_companies),
    path('stock-data/<str:ticker>/', select_all_from_table),
    path('allcompanies/', get_all_companies),
    path('subscribe', subscribe),
    path('unsubscribe', unsubscribe),
]