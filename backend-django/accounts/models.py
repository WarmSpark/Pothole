import uuid
from django.db import models
from django.utils import timezone

class User(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4)
    email = models.CharField(max_length=255, unique=True)
    hashed_password = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    role = models.CharField(max_length=50, default='viewer') # 'viewer', 'studio', 'admin'
    subscription_tier = models.CharField(max_length=50, default='standard')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'users'
        managed = False

    def __str__(self):
        return f"{self.email} ({self.role})"
