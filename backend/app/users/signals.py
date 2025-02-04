from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, GameStats

@receiver(post_save, sender=CustomUser)
def create_game_stats(sender, instance, created, **kwargs):
    if created:
        GameStats.objects.create(user=instance)
