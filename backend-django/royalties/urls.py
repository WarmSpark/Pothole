from django.urls import re_path
from .views import record_heartbeat, studio_accounting_summary

urlpatterns = [
    re_path(r'^heartbeat/?$', record_heartbeat, name='record_heartbeat'),
    re_path(r'^studio/?$', studio_accounting_summary, name='studio_accounting_summary'),
]
