import uuid
import json
from django.db import models
from django.utils import timezone

class SafeJSONField(models.JSONField):
    """Handles PostgreSQL JSON columns where psycopg2 already deserializes the object."""
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        if isinstance(value, (dict, list)):
            return value
        try:
            return json.loads(value)
        except Exception:
            return value

class Movie(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    genres = SafeJSONField(default=list)
    release_year = models.IntegerField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=120)
    rating = models.CharField(max_length=10, default='PG-13')
    imdb_score = models.FloatField(null=True, blank=True)
    imdb_id = models.CharField(max_length=50, null=True, blank=True)
    director = models.CharField(max_length=255, null=True, blank=True)
    cast = SafeJSONField(default=list)
    tags = SafeJSONField(default=list)
    stream_type = models.CharField(max_length=20, default='full') # 'full' | 'trailer'
    trailer_youtube_id = models.CharField(max_length=50, null=True, blank=True)
    poster_url = models.CharField(max_length=1024, null=True, blank=True)
    backdrop_url = models.CharField(max_length=1024, null=True, blank=True)
    video_url = models.CharField(max_length=1024, null=True, blank=True)
    hls_manifest_url = models.CharField(max_length=1024, null=True, blank=True)
    studio_id = models.CharField(max_length=36, null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'movies'
        managed = False

    def __str__(self):
        return f"{self.title} ({self.release_year})"

class Contract(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4)
    movie_id = models.CharField(max_length=36)
    studio_id = models.CharField(max_length=36)
    allowed_countries = SafeJSONField(default=list)
    royalty_rate_per_hour = models.FloatField(default=0.15)
    status = models.CharField(max_length=20, default='active')
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'contracts'
        managed = False

    def __str__(self):
        return f"Contract for Movie {self.movie_id}"
