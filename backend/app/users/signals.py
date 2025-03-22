from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import GameStats
from django.db.models.signals import pre_delete
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=User)
def create_game_stats(sender, instance, created, **kwargs):
    if created:
        GameStats.objects.create(user=instance)
