import os
import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import ValidationError, APIException
from user.models import GameStats
from app.models import GameInvitation, PongGame
from django.db.models import Q
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()
logger = logging.getLogger(__name__)

class EmailNotVerifiedException(APIException):
    status_code = 401
    default_detail = "Email is not verified."
    default_code = "email_not_verified"

class LoginSerializer(serializers.Serializer):
    email_or_username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email_or_username = attrs.get('email_or_username')
        password = attrs.get('password')

        if not email_or_username or not password:
            raise serializers.ValidationError(
                ('Must include "email_or_username" and "password".'),
                'missing_fields'
            )

        user = User.objects.filter(
            Q(email__iexact=email_or_username) | 
            Q(username__iexact=email_or_username)
        ).first()

        if not user or not user.check_password(password):
            raise AuthenticationFailed()

        if not user.email_is_verified:
            raise EmailNotVerifiedException()

        return {'user': user}

class GameStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameStats
        fields = ['total_matches', 'wins', 'losses']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    game_stats = GameStatsSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'avatar_oauth', 'avatar_upload','two_factor_method', 'new_email', 'new_password', 'date_joined', 'game_stats']
        read_only_fields = ['id', 'avatar_oauth', 'date_joined', 'game_stats']

    def update(self, instance, validated_data):
        new_password = validated_data.pop('new_password', None)
        if new_password:
            instance.set_password(new_password)
        return super().update(instance, validated_data)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def validate_new_email(self, value):
        if User.objects.filter(email=value).exists() or User.objects.filter(new_email=value).exists():
            raise serializers.ValidationError("This email is already registered to another account.")
        return value

    def validate_avatar_upload(self, value):
        if value.size > 5 * 1024 * 1024:
            raise ValidationError("File too large. Size should not exceed 5 MB.")
        return value
    
    def validate_two_factor_method(self, value):
        if value == 'authenticator':
            raise serializers.ValidationError("Authenticator 2FA method can't be set through this view.")
        return value
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.avatar_upload:
            representation['avatar_upload'] = os.path.relpath(
                instance.avatar_upload.path, 
                settings.MEDIA_ROOT
            )
        return representation

class GameInvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = GameInvitation
        fields = ['id', 'sender', 'receiver', 'status', 'game']


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
        return UserSerializer(opponent).data

    def get_result(self, obj):
        user_id = self.context['request'].parser_context['kwargs']['id']
        return 'win' if obj.winner.id == user_id else 'loss'