"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from app.views.media_views import ProtectedMediaView
from rest_framework_simplejwt.views import TokenRefreshView

# Authentication views
from app.views.auth_views import (
    LoginView,
    UserDetailView,
    VerifyEmailView,
)

from app.views.oauth_views import (
    OAuth42View,
    OAuth42CallbackView,
)


from app.views.two_factor_auth_views import (
    VerifyOTPView,
    AuthenticatorSetupView,
    VerifyAuthenticatorSetupView,
)

# User and friend views
from app.views.user_views import (
    UserListView,
    FriendRequestView,
    FriendAcceptView,
    FriendsListView,
    OnlineUserListView,
    OnlineStatusListView,
)

# Game-related views
from app.views.game_views import (
    CreateGameInvitationView,
    AcceptGameInvitationView,
    PongGameDetailView,
    MatchHistoryListView,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Root
    # path('api/', include("app.urls")),

    # Profiling (Django Silk)
    path('silk/', include('silk.urls', namespace='silk')),

    # Auth
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),

    # OAuth
    path('api/oauth/42', OAuth42View.as_view(), name='oauth_42'),
    path('api/oauth/42/callback/', OAuth42CallbackView.as_view(), name='oauth_42_callback'),

    # Two-Factor Authentication
    path('api/2fa/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('api/2fa/setup/', AuthenticatorSetupView.as_view(), name='authenticator_setup'),
    path('api/2fa/verify-setup/', VerifyAuthenticatorSetupView.as_view(), name='verify_authenticator_setup'),

    # Users and Friends
    path('api/user', UserDetailView.as_view(), name='user-detail'),
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/online-users/', OnlineUserListView.as_view(), name='online-users'),
    path('api/user/<int:pk>', UserDetailView.as_view(), name='user-detail-pk'),
    path('api/friend-request/<int:friend_id>', FriendRequestView.as_view(), name='friend-request'),
    path('api/friend-accept/<int:friend_id>', FriendAcceptView.as_view(), name='friend-accept'),
    path('api/friends/<int:user_id>/', FriendsListView.as_view(), name='friends-list'),
    path('api/online-status/', OnlineStatusListView.as_view(), name='online-status'),

    # Game Invitations
    path('api/game-invitation/<int:user_id>/', CreateGameInvitationView.as_view(), name='game-invitation'),
    path('api/game-invitation/<int:invitation_id>/accept/', AcceptGameInvitationView.as_view(), name='accept-game-invitation'),

    # Game
    path('api/games/<int:id>/', PongGameDetailView.as_view(), name='pong-game-detail'),

    # Match History
    path('api/match-history/<int:id>/', MatchHistoryListView.as_view(), name='match-history'),
]

# Handle media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif settings.PRODUCTION:
    urlpatterns += [path('media/<path:path>', ProtectedMediaView.as_view())]
