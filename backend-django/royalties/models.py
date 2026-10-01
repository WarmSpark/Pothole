import uuid
from django.db import models
from django.utils import timezone

class RoyaltyLog(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4)
    movie_id = models.CharField(max_length=36, null=True, blank=True)
    user_id = models.CharField(max_length=36, null=True, blank=True)
    studio_id = models.CharField(max_length=36, null=True, blank=True)
    seconds_watched = models.IntegerField(default=10)
    accrued_amount = models.FloatField(default=0.000416)
    playback_resolution = models.CharField(max_length=20, default='1080p')
    user_country = models.CharField(max_length=10, default='IN')
    ip_address = models.CharField(max_length=50, null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'royalty_logs'
        managed = False

    def __str__(self):
        return f"Log {self.id}: {self.seconds_watched}s on movie {self.movie_id}"
