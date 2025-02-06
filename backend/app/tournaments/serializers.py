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