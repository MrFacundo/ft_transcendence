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

