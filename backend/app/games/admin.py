from django.contrib import admin
from app.games.models import PongGame, Tournament, GameInvitation

# Register your models here.
admin.site.register(PongGame)
admin.site.register(Tournament)
admin.site.register(GameInvitation)
