
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from user.models import Friendship

User = get_user_model()

# Lists all users who have verified their email
class UserListView(ListAPIView):
	queryset = User.objects.filter(email_is_verified=True)
	serializer_class = UserSerializer

class FriendRequestView(APIView):
    """
    Sends a friend request to the user with the given ID. Checks if the user is not sending a friend request to themselves, and if a friendship already exists.
    """
    def post(self, request, friend_id):
        friend = get_object_or_404(User, id=friend_id)
        
        if friend.id == request.user.id:
            return Response(
                {"message": "Requester and friend cannot be the same user"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        existing_friendship = Friendship.objects.filter(
            (Q(user=request.user, friend=friend) | 
             Q(user=friend, friend=request.user))
        ).first()
        
        if existing_friendship:
            return Response(
                {"message": "Invitation already sent"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        Friendship.objects.create(
            user=request.user,
            friend=friend,
            status='pending'
        )
        
        return Response(
            {"message": f"Friend request sent to {friend.username}"},
            status=status.HTTP_201_CREATED
        )

class FriendAcceptView(APIView):
        
    def post(self, request, friend_id):
        friend = get_object_or_404(User, id=friend_id)
        
        friendship = Friendship.objects.filter(
            user=friend, friend=request.user, status='pending'
        ).first()
        
        if not friendship:
            return Response(
                {"message": "No pending friend request found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friendship.status = 'accepted'
        friendship.save()
        
        return Response(
            {"message": f"{friend.username} is now your friend"},
            status=status.HTTP_200_OK
        )
        

class FriendInvitableUsersListView(ListAPIView):
    """
    Lists all users except the current user, their friends, and users who have sent a friend request to the current user.
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user

        friends = Friendship.objects.filter(
            Q(user=user, status='accepted') | Q(friend=user, status='accepted')
        ).values_list('user_id', 'friend_id')

        pending_received = Friendship.objects.filter(
            friend=user, status='pending'
        ).values_list('user_id', flat=True)

        pending_sent = Friendship.objects.filter(
            user=user, status='pending'
        ).values_list('friend_id', flat=True)

        return User.objects.exclude(
            id__in=[user.id] +
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
            friend=user, status='pending'
        ).values_list('user_id', flat=True)
        return User.objects.filter(id__in=pending_received)
    
class FriendsListView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        friends = Friendship.objects.filter(
            Q(user_id=user_id, status='accepted') | Q(friend_id=user_id, status='accepted')
        ).values_list('user_id', 'friend_id')
        friend_ids = [uid for pair in friends for uid in pair if uid != int(user_id)]
        return User.objects.filter(id__in=friend_ids)