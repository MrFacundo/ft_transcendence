from rest_framework import serializers
from django.conf import settings
import os
from .models import Friendship
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.core.validators import MaxLengthValidator
from .services import UserValidationService

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
    password = serializers.CharField(
        write_only=True, 
        validators=[validate_password, MaxLengthValidator(20)]
    )
    new_password = serializers.CharField(
        write_only=True, 
        required=False, 
        validators=[validate_password, MaxLengthValidator(20)]
    )
    game_stats = serializers.SerializerMethodField()
    friendship_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'avatar_oauth', 
            'avatar_upload', 'two_factor_method', 'new_email', 
            'new_password', 'date_joined', 'game_stats', 'friendship_status'
        ]
        read_only_fields = ['avatar_oauth', 'date_joined', 'game_stats']

    def validate(self, attrs):
        if not self.instance:
            UserValidationService.validate_creation_fields(attrs)
        else:
            UserValidationService.validate_update_fields(attrs)
        return attrs

    def validate_email(self, value):
        return UserValidationService.validate_email_uniqueness(value, self.instance)

    def validate_avatar_upload(self, value):
        return UserValidationService.validate_avatar_size(value)

    def validate_two_factor_method(self, value):
        return UserValidationService.validate_two_factor_method(value)

    def get_game_stats(self, obj):
        from app.games.serializers import GameStatsSerializer
        return GameStatsSerializer(obj.game_stats).data if obj.game_stats else None

    def get_friendship_status(self, obj):
        request = self.context.get('request', None)
        if not request or not request.user.is_authenticated:
            return None
        user_id = self.context.get('view').kwargs.get('pk')
        if not user_id or int(user_id) == request.user.id:
            return None
        friendship = Friendship.objects.filter(
            (Q(sender=request.user) & Q(receiver=obj)) |
            (Q(sender=obj) & Q(receiver=request.user))
        ).first()

        return friendship.status if friendship else None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        new_password = validated_data.pop('new_password', None)
        if new_password:
            instance.set_password(new_password)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return self.add_avatar_upload_path(representation, instance)