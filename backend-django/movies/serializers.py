from rest_framework import serializers
from .models import Movie, Contract

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'description', 'genres', 'release_year',
            'duration_minutes', 'rating', 'imdb_score', 'imdb_id',
            'director', 'cast', 'tags', 'stream_type', 'trailer_youtube_id',
            'poster_url', 'backdrop_url', 'video_url', 'studio_id', 'created_at'
        ]

class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = '__all__'
