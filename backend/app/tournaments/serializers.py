from rest_framework import serializers
from app.tournaments.models import Tournament
from django.contrib.auth import get_user_model
from app.users.models import GameStats
from app.games.serializers import GameStatsSerializer

User = get_user_model()

class ParticipantSerializer(serializers.ModelSerializer):
    game_stats = GameStatsSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_oauth', 'avatar_upload', 'game_stats']

class TournamentSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        fields = '__all__'

    def validate(self, data):
        user = self.context['request'].user
        ongoing_tournaments = Tournament.objects.filter(participants=user, end_date__isnull=True).distinct()
        if ongoing_tournaments.exists():
            raise serializers.ValidationError("You are already a participant in an ongoing tournament.")
        return data