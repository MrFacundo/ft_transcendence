from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import re_path, path
from app.games.consumers import GameInvitationConsumer, GameConsumer
from app.users.consumers import FriendInvitationConsumer, UserOnlineStatusConsumer
from app.tournaments.consumers import TournamentConsumer
from app.tournaments.consumers import OpenTournamentsConsumer

# URLs that handle the WebSocket connection are placed here.
websocket_urlpatterns=[
    path('ws/online-status/', UserOnlineStatusConsumer.as_asgi()),
    path('ws/open-tournaments/', OpenTournamentsConsumer.as_asgi()),
    path("ws/<str:game_id>/", GameConsumer.as_asgi()),
    path('ws/game-invitation/<str:room_name>/', GameInvitationConsumer.as_asgi()),
    path('ws/friend-invitation/<str:room_name>/', FriendInvitationConsumer.as_asgi()),
    path('ws/tournament/<str:tournament_id>/', TournamentConsumer.as_asgi()),
]

