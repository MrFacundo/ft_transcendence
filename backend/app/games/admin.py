from django.contrib import admin
from app.games.models import PongGame, GameInvitation

# Register your models here.
admin.site.register(PongGame)
admin.site.register(GameInvitation)
