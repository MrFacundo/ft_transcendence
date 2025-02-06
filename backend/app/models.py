from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class PongGame(models.Model):
    GAME_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('interrupted', 'Interrupted')
    ]

    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player1_games', null=False)
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player2_games', default=None, null=True)
    channel_group_name = models.CharField(max_length=100, default='')
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='won_games', default=None, null=True)
    date_played = models.DateTimeField(auto_now_add=True)
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    match_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=GAME_STATUS_CHOICES, 
        default='not_started'
    )

    def __str__(self):
        return f"Game between {self.player1.username} and {self.player2.username}"

class Tournament(models.Model):
    name = models.CharField(max_length=100)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    participants = models.ManyToManyField(User, related_name='tournaments')
    games = models.ManyToManyField(PongGame, related_name='tournaments', blank=True)

    def __str__(self):
        return self.name
    
class GameInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_game_invitations')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_game_invitations')
    game = models.ForeignKey('PongGame', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Game invitation from {self.sender.username} to {self.receiver.username}"