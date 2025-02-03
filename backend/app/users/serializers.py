from rest_framework import serializers
from django.conf import settings
import os
from rest_framework.exceptions import ValidationError, APIException
from .models import CustomUser, GameStats, Friendship
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

User = get_user_model()

class AvatarUploadMixin:
    def add_avatar_upload_path(self, representation, instance):
        if instance.avatar_upload:
            representation['avatar_upload'] = os.path.relpath(
                instance.avatar_upload.path,
                settings.MEDIA_ROOT
            )
        return representation

class UserSerializer(serializers.ModelSerializer, AvatarUploadMixin):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    game_stats = serializers.SerializerMethodField()
    friendship_status = serializers.SerializerMethodField()

    # FIXME: This is a workaround to avoid circular import
    def get_game_stats(self, obj):
        from app.games.serializers import GameStatsSerializer
        return GameStatsSerializer(obj.game_stats).data if obj.game_stats else None


    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'avatar_oauth', 'avatar_upload', 'two_factor_method', 'new_email', 'new_password', 'date_joined', 'game_stats', 'friendship_status']
        read_only_fields = ['id', 'avatar_oauth', 'date_joined', 'game_stats']

    def get_friendship_status(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            friendship = Friendship.objects.filter(
                (Q(sender=request.user) & Q(receiver=obj)) | 
                (Q(sender=obj) & Q(sender=request.user))
            ).first()
            if friendship:
                return friendship.status
        return None
    
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
        return self.add_avatar_upload_path(representation, instance)