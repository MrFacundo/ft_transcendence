import logging

from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.signing import Signer
from django.core.mail import send_mail
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from django.db import IntegrityError

logger = logging.getLogger(__name__)
User = get_user_model()
signer = Signer()


class DuplicateUserDataError(Exception):
    pass

def get_or_create_user_from_oauth(user_info):
    try:
        user, created = User.objects.get_or_create(
            oauth_uid=str(user_info['id']),
            defaults={
                'username': user_info['login'],
                'email': user_info['email'].lower(),
                'avatar_oauth': user_info['image']['versions']['medium'],
                'email_is_verified': True,
            }
        )
    except IntegrityError as e:
        if ('duplicate key value violates unique constraint "users_customuser_email_key"' in str(e) or
            'duplicate key value violates unique constraint "users_customuser_new_email_key"' in str(e) or
            'duplicate key value violates unique constraint "users_customuser_username_key"' in str(e)):
            raise DuplicateUserDataError("Duplicate user data")
        else:
            raise e
    
    if not created:
        user.avatar_oauth = user_info['image']['versions']['medium']
        user.save()
    
    return RefreshToken.for_user(user)

def send_verification_email(user):
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={signer.sign(user.pk)}"
    send_mail(
        'Verify your email',
        f'Click the link to verify your email: {verification_url}',
        settings.DEFAULT_FROM_EMAIL,
        [user.new_email or user.email],
    )
    logger.info(f"Verification email sent to user ID {user.id}")
        
def generate_jwt_response(user):
    """
    Generate a JWT response for the user. If no refresh token is provided, a new one is created.
    """
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    return Response({
        "refresh": str(refresh),
        "access": str(access)
    }, status=status.HTTP_200_OK)