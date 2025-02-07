from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView, ListAPIView
from django.contrib.auth import get_user_model
from .models import Tournament
from .serializers import TournamentSerializer

User = get_user_model()

class TournamentCreateView(CreateAPIView):
    """
    Create a new tournament.
    """
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer

    def perform_create(self, serializer):
        user = self.request.user
        tournament = serializer.save()
        tournament.participants.add(user)

class TournamentJoinView(RetrieveUpdateAPIView):
    """
    Join an existing tournament.
    """
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer

    def update(self, request, *args, **kwargs):
        user = request.user

        ongoing_tournaments = Tournament.objects.filter(participants=user, end_date__isnull=True).distinct()
        if ongoing_tournaments.exists():
            return Response({"message": "You are already a participant in an ongoing tournament."}, status=status.HTTP_400_BAD_REQUEST)

        tournament = self.get_object()

        if tournament.participants.count() >= tournament.participants_amount:
            return Response({"message": "The tournament is full."}, status=status.HTTP_400_BAD_REQUEST)

        if user not in tournament.participants.all():
            tournament.participants.add(user)
        else:
            return Response({"message": "You are already a participant in this tournament."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(TournamentSerializer(tournament).data, status=status.HTTP_200_OK)

class TournamentListView(ListAPIView):
	"""
	List all tournaments.
	"""
	queryset = Tournament.objects.all()
	serializer_class = TournamentSerializer