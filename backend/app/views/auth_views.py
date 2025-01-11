import logging

from django.contrib.auth import get_user_model
from django.core.signing import Signer, BadSignature
from django.shortcuts import get_object_or_404

from rest_framework.exceptions import APIException
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.generics import RetrieveUpdateDestroyAPIView, CreateAPIView
from rest_framework import status

from .serializers import LoginSerializer, UserSerializer
from .services import send_verification_email, generate_jwt_response

from app.views.two_factor_auth_views import TwoFactorAuthView
from app.tokens.OTPToken import OTPToken

User = get_user_model()
signer = Signer()
logger = logging.getLogger(__name__)

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj == request.user

class LoginView(TwoFactorAuthView):
    """"
    Returns a JWT or, if 2FA is enabled, a OTP token. 
    If 2FA method is "email", aditionally generates and sends a OTP. 
    """
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        if user.two_factor_method != 'none':
            otp_token = str(OTPToken.for_user(user))
            if user.two_factor_method == 'email':
                self.generate_otp(user)
                # TODO: Send OTP via email
            return Response({
                'two_factor_required': True,
                'otp_token': otp_token,
            })
        
        return generate_jwt_response(user)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            user_id = signer.unsign(token)
            user = User.objects.get(pk=user_id)
            
            if user.new_email: # User is updating email
                user.email = user.new_email
                user.email_is_verified = True
                user.new_email = None
                user.new_email_is_verified = False
                user.save()
                return Response({'message': 'Email verified and updated successfully.'}, status=status.HTTP_200_OK)
            elif not user.email_is_verified: # User is verifying email for the first time
                user.email_is_verified = True
                user.save()
                return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'Email already verified.'}, status=status.HTTP_200_OK)
        except (BadSignature, User.DoesNotExist):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)

class UserDetailView(CreateAPIView, RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer

    def get_object(self): # check permissions
        user_id = self.kwargs.get('pk')
        if user_id:
            obj = get_object_or_404(User, pk=user_id)
            self.check_object_permissions(self.request, obj)
            return obj
        return self.request.user

    def perform_create(self, serializer): # send verification email
        user = serializer.save()
        logger.info(f"User with ID {user.id} registered successfully")
        self._handle_verification_email(user, is_creation=True)

    def perform_update(self, serializer): # send verification email
        user = serializer.save()
        if serializer.validated_data.get('new_email'):
            self._handle_verification_email(user)

    def _handle_verification_email(self, user, is_creation=False):
        try:
            send_verification_email(user)
        except Exception as e:
            logger.error(f"Verification email failed: {str(e)}")
            if is_creation:
                user.delete()
            raise APIException(f"Failed to send verification email. User was not {('created' if is_creation else 'updated')}.")

    def get_permissions(self):  # set permissions
        if self.request.method == 'POST':
            return [AllowAny()]
        if self.request.method == 'GET' and 'pk' in self.kwargs:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]