from django.urls import re_path
from .views import (
    movies_collection, movie_detail, movie_recommendations,
    stream_movie, omdb_search, claim_movie, studio_portfolio, claimed_status_map,
    watch_history, recommendations_for_me,
)

urlpatterns = [
    re_path(r'^claim/?$', claim_movie, name='claim_movie'),
    re_path(r'^my-portfolio/?$', studio_portfolio, name='studio_portfolio'),
    re_path(r'^claimed-status/?$', claimed_status_map, name='claimed_status_map'),
    re_path(r'^search/omdb/?$', omdb_search, name='omdb_search'),
    re_path(r'^watch-history/?$', watch_history, name='watch_history'),
    re_path(r'^recommendations/for-me/?$', recommendations_for_me, name='recommendations_for_me'),
    re_path(r'^(?P<movie_id>[^/]+)/recommendations/?$', movie_recommendations, name='movie_recommendations'),
    re_path(r'^(?P<movie_id>[^/]+)/stream/?$', stream_movie, name='stream_movie'),
    re_path(r'^(?P<movie_id>[^/]+)/?$', movie_detail, name='movie_detail'),
    re_path(r'^/?$', movies_collection, name='movies_collection'),
]
