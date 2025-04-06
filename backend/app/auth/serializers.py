import os
import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import  APIException
from app.games.models import GameInvitation, PongGame
from django.db.models import Q
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()

class EmailNotVerifiedException(APIException):
    status_code = 401
    default_detail = "Email is not verified."
    default_code = "email_not_verified"
    
class LoginSerializer(serializers.Serializer):
    email_or_username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_email_or_username(self, value):
        user = User.objects.filter(
            Q(email__iexact=value) | Q(username__iexact=value)
        ).first()

        if not user:
            raise AuthenticationFailed('Invalid credentials.')

        return user

    def validate(self, attrs):
        user = attrs.get('email_or_username')

        if not user.check_password(attrs.get('password')):
            raise AuthenticationFailed('Invalid credentials.')

        if not user.email_is_verified and not user.is_superuser:
            raise EmailNotVerifiedException()

        attrs['user'] = user
        return attrs