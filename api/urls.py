from django.urls import path
from .views import get_all_companies, insert_into_companies, select_all_from_table

urlpatterns = [
    path('newcompany/<str:company_name>/', insert_into_companies),
    path('stock-data/<str:tablename>/', select_all_from_table),
    path('allcompanies/', get_all_companies)
]