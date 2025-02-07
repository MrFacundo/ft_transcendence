import logging

from rest_framework import serializers
from app.users.serializers import UserSerializer
from app.tournaments.models import Tournament

logger = logging.getLogger(__name__)

class TournamentSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        fields = '__all__'

    def validate(self, data):
        user = self.context['request'].user
        ongoing_tournaments = Tournament.objects.filter(participants=user, end_date__isnull=True).distinct()
        if ongoing_tournaments.exists():
            raise serializers.ValidationError("You are already a participant in an ongoing tournament.")
        return data