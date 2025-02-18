from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from app.games.models import GameInvitation, PongGame
from .serializers import GameInvitationSerializer, PongGameSerializer, MatchHistorySerializer
from django.db import transaction
from django.db import models
from app.users.models import Friendship
from django.db.models import Q
from django.utils import timezone

User = get_user_model()

class CreateGameInvitationView(APIView):
    """
    Sends a game request to the user with the given ID. Checks if the user is not sending a request to themselves, and if a request already exists.
    """
    def post(self, request, user_id):
        with transaction.atomic():
            receiver = get_object_or_404(User, id=user_id)
            sender = request.user

            if receiver == sender:
                return Response(
                    {"message": "You cannot invite yourself."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            is_friend = Friendship.objects.filter(
                (Q(sender=sender, receiver=receiver) | 
                Q(sender=receiver, receiver=sender)),
                status="accepted"
            ).exists()

            if not is_friend:
                return Response(
                    {"message": "You can only invite friends to a game."},
                    status=status.HTTP_400_BAD_REQUEST)

            existing_invitation = GameInvitation.objects.select_for_update().filter(
                sender=sender, 
                receiver=receiver, 
                status="pending",
                expires_at__gt=timezone.now()
            ).first()

            if existing_invitation:
                return Response(
                    {"message": "An invitation has already been sent."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            invitation = GameInvitation.objects.create(sender=sender, receiver=receiver)

            channel_layer = get_channel_layer()
            print("Invitation sent. Sending message to", f"game_invitation_{receiver.id}")
            async_to_sync(channel_layer.group_send)(
                f"game_invitation_{receiver.id}",
                {
                    "type": "game_invited",
                    "invitation": GameInvitationSerializer(invitation).data
                }
            )

            return Response(
                {"message": "Invitation sent successfully.", "invitation_id": invitation.id},
                status=status.HTTP_201_CREATED
            )

class AcceptGameInvitationView(APIView):
    def post(self, request, invitation_id):
        with transaction.atomic():
            invitation = GameInvitation.objects.select_for_update().get(id=invitation_id)
           
            if invitation.receiver != request.user:
                return Response(
                    {"message": "You are not authorized to accept this invitation."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if invitation.status != "pending":
                return Response(
                    {"message": "Invitation has expired."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            invitation.status = "accepted"

            game = PongGame.objects.create(player1=invitation.sender, player2=invitation.receiver)
            invitation.game = game
            invitation.save()

            channel_layer = get_channel_layer()
            print("Invitation accepted. Sending message to", f"game_invitation_{invitation.sender.id}")
            async_to_sync(channel_layer.group_send)(
                f"game_invitation_{invitation.sender.id}",
                {
                    "type": "game_accepted",
                    "game_url": f"/game/{game.id}"
                }
            )

            return Response(
                {"type": "game_accepted", "message": "Invitation accepted.", "game_url": f"/game/{game.id}"},
                status=status.HTTP_200_OK
            )

class PongGameDetailView(RetrieveAPIView):
    serializer_class = PongGameSerializer
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        return PongGame.objects.filter(models.Q(player1=user) | models.Q(player2=user))

class MatchHistoryListView(ListAPIView):
    serializer_class = MatchHistorySerializer

    def get_queryset(self):
        user_id = self.kwargs.get('id')
        return PongGame.objects.filter(player1_id=user_id, status="completed") | PongGame.objects.filter(player2_id=user_id, status="completed")
