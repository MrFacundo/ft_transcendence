from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import re_path, path
from app.games.consumers import GameInvitationConsumer, GameConsumer, FriendInvitationConsumer, UserOnlineStatusConsumer

# URLs that handle the WebSocket connection are placed here.
websocket_urlpatterns=[
    path('ws/online-status/', UserOnlineStatusConsumer.as_asgi()),
    path("ws/<str:game_id>/", GameConsumer.as_asgi()),
    path('ws/game-invitation/<str:room_name>/', GameInvitationConsumer.as_asgi()),
    path('ws/friend-invitation/<str:room_name>/', FriendInvitationConsumer.as_asgi()),
]

