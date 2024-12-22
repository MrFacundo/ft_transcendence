from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import CustomUser, GameStats, Friendship

admin.site.register(CustomUser)
admin.site.register(GameStats)
admin.site.register(Friendship)
