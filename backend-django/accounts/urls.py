from django.urls import re_path
from .views import register_view, login_view, me_view

urlpatterns = [
    re_path(r'^register/?$', register_view, name='register'),
    re_path(r'^login/?$', login_view, name='login'),
    re_path(r'^me/?$', me_view, name='me'),
]
