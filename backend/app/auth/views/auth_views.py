from django.contrib.auth import get_user_model
from django.core.signing import Signer, BadSignature

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .services import generate_jwt_response

from app.auth.serializers import LoginSerializer
from app.auth.views.two_factor_auth_views import TwoFactorAuthView
from app.auth.tokens import OTPToken

User = get_user_model()
signer = Signer()


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
                self.send_otp_email(user, self.generate_otp(user))
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