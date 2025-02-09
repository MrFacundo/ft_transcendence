from rest_framework import serializers
from app.tournaments.models import Tournament
from django.contrib.auth import get_user_model
from app.users.models import GameStats
from app.games.serializers import GameStatsSerializer, PongGameSerializer
from app.users.serializers import AvatarUploadMixin

User = get_user_model()

class ParticipantSerializer(serializers.ModelSerializer, AvatarUploadMixin):
    game_stats = GameStatsSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_oauth', 'avatar_upload', 'game_stats']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return self.add_avatar_upload_path(representation, instance)

class TournamentSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    semifinal_1_game1 = PongGameSerializer(read_only=True)
    semifinal_1_game2 = PongGameSerializer(read_only=True)

    class Meta:
        model = Tournament
        fields = '__all__'

    def validate(self, data):
        user = self.context['request'].user
        ongoing_tournaments = Tournament.objects.filter(participants=user, end_date__isnull=True).distinct()
        if ongoing_tournaments.exists():
            raise serializers.ValidationError("You are already a participant in an ongoing tournament.")
        return data