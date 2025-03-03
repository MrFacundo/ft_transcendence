import os
import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from rest_framework import serializers
from app.users.models import GameStats, Friendship, UserOnlineStatus
from app.games.models import GameInvitation, PongGame
from django.db.models import Q
from app.users.serializers import UserSerializer, AvatarUploadMixin

User = get_user_model()
logger = logging.getLogger(__name__)

class GameStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameStats
        fields = ['total_matches', 'wins', 'losses']

class PongGameSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    
    class Meta:
        model = PongGame
        fields = '__all__'

class MatchHistorySerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()

    class Meta:
        model = PongGame
        fields = ['opponent', 'result', 'date_played']

    def get_opponent(self, obj):
        user_id = self.context['request'].parser_context['kwargs']['id']
        opponent = obj.player2 if obj.player1.id == user_id else obj.player1
        return {
            'id': opponent.id,
            'username': opponent.username
        }

    def get_result(self, obj):
        user_id = self.context['request'].parser_context['kwargs']['id']
        if obj.winner is None:
            return 'unknown'
        return 'win' if obj.winner.id == user_id else 'loss'
        
class UserOnlineStatusSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserOnlineStatus
        fields = ['user_id', 'username', 'is_online', 'last_seen']

class FriendshipInvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'receiver', 'status']
        
class GameInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameInvitation
        fields = '__all__'

class FriendSerializer(serializers.ModelSerializer, AvatarUploadMixin):
    game_invite = serializers.SerializerMethodField()
    game_stats = GameStatsSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_oauth', 'avatar_upload', 'date_joined', 'game_stats', 'game_invite']

    def get_game_invite(self, friend):
        user = self.context['request'].user

        invitation = GameInvitation.objects.filter(
            Q(sender=user, receiver=friend) | Q(sender=friend, receiver=user),
            status='pending'
        ).order_by('-created_at').first()

        return GameInvitationSerializer(invitation).data if invitation else None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return self.add_avatar_upload_path(representation, instance)


class FriendshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = '__all__'

class UserListSerializer(serializers.ModelSerializer, AvatarUploadMixin):
    friendship = serializers.SerializerMethodField()
    game_stats = GameStatsSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_oauth', 'avatar_upload', 'date_joined', 'game_stats', 'friendship']

    def get_friendship(self, target_user):
        user = self.context['request'].user
        friendship = Friendship.objects.filter(
            Q(sender=user, receiver=target_user) | Q(sender=target_user, receiver=user)
        ).first()
        return FriendshipSerializer(friendship).data if friendship else None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return self.add_avatar_upload_path(representation, instance)
