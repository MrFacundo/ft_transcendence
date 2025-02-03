from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# Authentication views
from app.auth.views.auth_views import (
    LoginView,
    UserDetailView,
    VerifyEmailView,
)


from app.auth.views.oauth_views import (
    OAuth42View,
    OAuth42CallbackView,
)

from app.auth.views.two_factor_auth_views import (
    VerifyOTPView,
    AuthenticatorSetupView,
    VerifyAuthenticatorSetupView,
)


urlpatterns = [
    # Auth
    path('token/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),

    # OAuth
    path('oauth/42', OAuth42View.as_view(), name='oauth_42'),
    path('oauth/42/callback/', OAuth42CallbackView.as_view(), name='oauth_42_callback'),

    # Two-Factor Authentication
    path('2fa/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('2fa/setup/', AuthenticatorSetupView.as_view(), name='authenticator_setup'),
    path('2fa/verify-setup/', VerifyAuthenticatorSetupView.as_view(), name='verify_authenticator_setup'),

]
