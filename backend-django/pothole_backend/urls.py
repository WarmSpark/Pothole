from django.contrib import admin
from django.urls import path, re_path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    re_path(r'^api/auth/', include('accounts.urls')),
    re_path(r'^api/movies/?', include('movies.urls')),
    re_path(r'^api/royalties/', include('royalties.urls')),
]
