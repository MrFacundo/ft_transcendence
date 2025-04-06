from django.db.models import Q
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db import transaction

from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.exceptions import  APIException
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .serializers import UserSerializer
from app.games.serializers import UserOnlineStatusSerializer, FriendSerializer, UserListSerializer, FriendshipInvitationSerializer
from app.users.models import Friendship, UserOnlineStatus
from app.auth.services import send_verification_email
import logging
logger = logging.getLogger(__name__)
 
User = get_user_model()

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj == request.user

class UserDetailView(CreateAPIView, RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer

    def get_object(self): # check permissions
        user_id = self.kwargs.get('pk')
        if user_id:
            obj = get_object_or_404(User, pk=user_id)
            self.check_object_permissions(self.request, obj)
            return obj
        return self.request.user

    def perform_create(self, serializer): # send verification email
        user = serializer.save()
        logger.info(f"User with ID {user.id} registered successfully")
        self._handle_verification_email(user, is_creation=True)

    def perform_update(self, serializer): # send verification email
        user = serializer.save()
        if serializer.validated_data.get('new_email'):
            self._handle_verification_email(user)

    def _handle_verification_email(self, user, is_creation=False):
        try:
            send_verification_email(user)
        except Exception as e:
            logger.error(f"Verification email failed: {str(e)}")
            if is_creation:
                user.delete()
            raise APIException(f"Failed to send verification email. User was not {('created' if is_creation else 'updated')}.")

    def get_permissions(self):  # set permissions
        if self.request.method == 'POST':
            return [AllowAny()]
        if self.request.method == 'GET' and 'pk' in self.kwargs:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

class UserListView(ListAPIView):
    """
    Lists all users, along with Friendship data related to the current user.
    """
    queryset = User.objects.filter(email_is_verified=True)
    serializer_class = UserListSerializer

class FriendRequestView(APIView):
    """
    Sends a friend request to the user with the given ID. Checks if the user is not sending a request to themselves, and if a request already exists.
    """
    def post(self, request, friend_id):
        with transaction.atomic():
            receiver = get_object_or_404(User, id=friend_id)
            
            if receiver.id == request.user.id:
                return Response(
                    {"message": "Requester and receiver cannot be the same user"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            existing_friendship = Friendship.objects.filter(
                (Q(sender=request.user, receiver=receiver) | 
                Q(sender=receiver, receiver=request.user))
            ).first()
            
            if existing_friendship:
                return Response(
                    {"message": "Invitation already sent"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            friendship = Friendship.objects.create(
                sender=request.user,
                receiver=receiver,
                status='pending'
            )
            
            channel_layer = get_channel_layer()
            print("Friend request sent. Sending message to", f"friend_invitation_{receiver.id}")
            async_to_sync(channel_layer.group_send)(
                f"friend_invitation_{receiver.id}",
                {
                    "type": "friend_invited",
                    "friendship": FriendshipInvitationSerializer(friendship).data
                }
            )

            return Response(
                {"message": f"Friend request sent to {receiver.username}"},
                status=status.HTTP_201_CREATED
            )

class FriendAcceptView(APIView):
    def post(self, request, friend_id):
        with transaction.atomic():
            friendship = Friendship.objects.select_for_update().filter(
                sender=friend_id,
                receiver=request.user,
                status='pending'
            ).first()
            
            if not friendship:
                return Response(
                    {"message": "No pending friend request found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            friendship.status = 'accepted'
            friendship.save()
            
            channel_layer = get_channel_layer()
            print("Friend request accepted. Sending message to", f"friend_invitation_{friendship.sender.id}")
            async_to_sync(channel_layer.group_send)(
                f"friend_invitation_{friendship.sender.id}",
                {
                    "type": "friend_accepted",
                    "friendship": FriendshipInvitationSerializer(friendship).data
                }
            )
            return Response(
                {"message": f"{friendship.sender.username} is now your friend"},
                status=status.HTTP_200_OK
            )

class OnlineUserListView(ListAPIView):
    """
    Lists online users
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        online_users = User.objects.filter(online_status__is_online=True)
        return online_users
    
class OnlineStatusListView(ListAPIView):
    """
    Lists all user online statuses
    """
    serializer_class = UserOnlineStatusSerializer

    def get_queryset(self):
        return UserOnlineStatus.objects.all()
    
class FriendsListView(ListAPIView):
    """
    Lists all current user friends, along with their Game Invitation data related to the current user.
    """
    serializer_class = FriendSerializer

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        friends = Friendship.objects.filter(
            Q(sender_id=user_id, status='accepted') | Q(receiver_id=user_id, status='accepted')
        ).values_list('sender_id', 'receiver_id')
        friend_ids = [uid for pair in friends for uid in pair if uid != int(user_id)]
        return User.objects.filter(id__in=friend_ids)
