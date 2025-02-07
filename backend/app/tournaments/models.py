from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Tournament(models.Model):

    PARTICIPANTS_AMOUNT_CHOICES = [
        (4, '4'),
    ]

    name = models.CharField(max_length=100)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    participants_amount = models.IntegerField(choices=PARTICIPANTS_AMOUNT_CHOICES)
    participants = models.ManyToManyField(User, related_name='tournaments')
    semifinal_1_game1 = models.ForeignKey('games.PongGame', related_name='semifinal_1_game1', on_delete=models.CASCADE, null=True)
    semifinal_1_game2 = models.ForeignKey('games.PongGame', related_name='semifinal_1_game2', on_delete=models.CASCADE, null=True)
    semifinal_2_game1 = models.ForeignKey('games.PongGame', related_name='semifinal_2_game1', on_delete=models.CASCADE, null=True)
    semifinal_2_game2 = models.ForeignKey('games.PongGame', related_name='semifinal_2_game2', on_delete=models.CASCADE, null=True)
    final_game = models.ForeignKey('games.PongGame', related_name='final_game', on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name