from django.urls import path

# Tournament-related views
from app.tournaments.views import TournamentCreateView, TournamentJoinView, TournamentListView, CurrentTournamentView

urlpatterns = [
    path('tournament/', TournamentCreateView.as_view(), name='tournament-detail'),
    path('tournament/<int:pk>/', TournamentJoinView.as_view(), name='tournament-detail'),
    path('tournaments/', TournamentListView.as_view(), name='tournament-list'),
    path('tournament/current/', CurrentTournamentView.as_view(), name='current-tournament'),
]
