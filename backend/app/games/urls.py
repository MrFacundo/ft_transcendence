from django.urls import path

# Game-related views
from app.games.views import (
    CreateGameInvitationView,
    AcceptGameInvitationView,
    PongGameDetailView,
    MatchHistoryListView,
    game_data_view,
	get_total_game_count,  # Adicionar import
)

urlpatterns = [
    # Game Invitations
    path('game-invitation/<int:user_id>/', CreateGameInvitationView.as_view(), name='game-invitation'),
    path('game-invitation/<int:invitation_id>/accept/', AcceptGameInvitationView.as_view(), name='accept-game-invitation'),

    # Game
    path('games/<int:id>/', PongGameDetailView.as_view(), name='pong-game-detail'),

    # Match History
    path('match-history/<int:id>/', MatchHistoryListView.as_view(), name='match-history'),
    
    # Dados da blockchain
    path('game/<int:game_id>/', game_data_view, name='game_data'),

	# Contador total de jogos
    path('games/count/', get_total_game_count, name='total-games'),
]
		