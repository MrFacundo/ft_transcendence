from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from app.tournaments.models import Tournament

User = settings.AUTH_USER_MODEL

class PongGame(models.Model):
    GAME_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('interrupted', 'Interrupted')
    ]

    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player1_games', null=True)
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player2_games', null=True)
    channel_group_name = models.CharField(max_length=100, default='')
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='won_games', default=None, null=True)
    date_played = models.DateTimeField(auto_now_add=True)
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    match_date = models.DateTimeField(null=True, blank=True)
    registered_on_blockchain = models.BooleanField(default=False) 
    status = models.CharField(
        max_length=20, 
        choices=GAME_STATUS_CHOICES, 
        default='not_started'
    )
    tournament = models.ForeignKey(Tournament, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        player1_username = self.player1.username if self.player1 else "N/A"
        player2_username = self.player2.username if self.player2 else "N/A"
        return f"Game between {player1_username} and {player2_username}"
    
def default_expires_at():
    return timezone.now() + timedelta(minutes=10)

class GameInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired')
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_game_invitations')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_game_invitations')
    game = models.ForeignKey('games.PongGame', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expires_at)

    def __str__(self):
        return f"Game invitation from {self.sender.username} to {self.receiver.username}"