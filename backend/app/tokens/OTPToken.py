from datetime import timedelta
from rest_framework_simplejwt.tokens import Token

class OTPToken(Token):
    token_type = 'otp'
    lifetime = timedelta(minutes=5)
