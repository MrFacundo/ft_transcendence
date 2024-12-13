import os
import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import ValidationError, APIException
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from user.models import GameStats

User = get_user_model()
logger = logging.getLogger(__name__)

class EmailNotVerifiedException(APIException):
    status_code = 401
    default_detail = "Email is not verified."
    default_code = "email_not_verified"

class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.email_is_verified:
            raise EmailNotVerifiedException()
        data['user'] = self.user
        return data

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