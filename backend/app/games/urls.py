from django.urls import path

# Game-related views
from app.games.views import (
    CreateGameInvitationView,
    AcceptGameInvitationView,
    PongGameDetailView,
    MatchHistoryListView,
)

urlpatterns = [
    # Game Invitations
    path('game-invitation/<int:user_id>/', CreateGameInvitationView.as_view(), name='game-invitation'),
    path('game-invitation/<int:invitation_id>/accept/', AcceptGameInvitationView.as_view(), name='accept-game-invitation'),

    # Game
    path('games/<int:id>/', PongGameDetailView.as_view(), name='pong-game-detail'),

    # Match History
    path('match-history/<int:id>/', MatchHistoryListView.as_view(), name='match-history'),

]
		