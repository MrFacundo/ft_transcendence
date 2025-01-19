
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, FriendshipInvitationSerializer
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from user.models import Friendship
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

# Lists all users who have verified their email
class UserListView(ListAPIView):
	queryset = User.objects.filter(email_is_verified=True)
	serializer_class = UserSerializer

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

class FriendInvitableUsersListView(ListAPIView):
    """
    Lists all users except the current user, their friends, and users who have sent a friend request to the current user.
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        sender = self.request.user

        friends = Friendship.objects.filter(
            Q(sender=sender, status='accepted') | Q(receiver=sender, status='accepted')
        ).values_list('sender_id', 'receiver_id')

        pending_received = Friendship.objects.filter(
            receiver=sender, status='pending'
        ).values_list('sender_id', flat=True)

        pending_sent = Friendship.objects.filter(
            sender=sender, status='pending'
        ).values_list('receiver_id', flat=True)

        return User.objects.exclude(
            id__in=[sender.id] +
            list(set([uid for pair in friends for uid in pair])) +
            list(pending_received)
        ).union(User.objects.filter(id__in=pending_sent))
    
class FriendRequestUsersListView(ListAPIView):
    """
    Lists all users who have sent a friend request to the current user (not yet accepted)
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        pending_received = Friendship.objects.filter(
            receiver=user, status='pending'
        ).values_list('sender_id', flat=True)
        return User.objects.filter(id__in=pending_received)
    
class FriendsListView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        friends = Friendship.objects.filter(
            Q(sender_id=user_id, status='accepted') | Q(receiver_id=user_id, status='accepted')
        ).values_list('sender_id', 'receiver_id')
        friend_ids = [uid for pair in friends for uid in pair if uid != int(user_id)]
        return User.objects.filter(id__in=friend_ids)
    
class OnlineUserListView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        online_users = User.objects.filter(online_status__is_online=True)
        return online_users