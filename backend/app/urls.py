from django.urls import path

from app.views.auth_views import (
    LoginView,
    UserDetailView,
    VerifyEmailView,
)

from app.views.oauth_views import (
    OAuth42View,
    OAuth42CallbackView,
)

from rest_framework_simplejwt.views import TokenRefreshView

from app.views.two_factor_auth_views import (
	VerifyOTPView,
	AuthenticatorSetupView,
	VerifyAuthenticatorSetupView
)

from app.views.user_views import (
	UserListView,
	 FriendRequestView,
	 FriendAcceptView,
	 FriendInvitableUsersListView,
	 FriendRequestUsersListView,
	 FriendsListView
)

from app.views.game_views import (
	CreateGameInvitationView,
	AcceptGameInvitationView,
	SentGameInvitationsListView,
	ReceivedGameInvitationsListView,
	PongGameDetailView,
	MatchHistoryListView
)

urlpatterns = [
	# Auth
    path('token/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('oauth/42', OAuth42View.as_view(), name='oauth_42'),
    path('oauth/42/callback/', OAuth42CallbackView.as_view(), name='oauth_42_callback'),
    path('2fa/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
	path('2fa/setup/', AuthenticatorSetupView.as_view(), name='authenticator_setup'),
    path('2fa/verify-setup/', VerifyAuthenticatorSetupView.as_view(), name='verify_authenticator_setup'),
	# Users and friends
    path('user', UserDetailView.as_view(), name='user-detail'),
	path('users/', UserListView.as_view(), name='user-list'),
	path('user/<int:pk>', UserDetailView.as_view(), name='user-detail-pk'),
	path('friend-request/<int:friend_id>', FriendRequestView.as_view(), name='friend-request'),
	path('friend-accept/<int:friend_id>', FriendAcceptView.as_view(), name='friend-accept'),
	path('friends-invitable/', FriendInvitableUsersListView.as_view(), name='friend-invitable-users'),
	path('friends-requests/', FriendRequestUsersListView.as_view(), name='friend-request-users'),
	path('friends/<int:user_id>/', FriendsListView.as_view(), name='friends-list'),
	# Game invitations
	path('game-invitation/<int:user_id>/', CreateGameInvitationView.as_view(), name='game-invitation'),
	path('game-invitation/<int:invitation_id>/accept/', AcceptGameInvitationView.as_view(), name='accept-game-invitation'),
	path('game-invitations/sent/', SentGameInvitationsListView.as_view(), name='sent-game-invitations'),
	path('game-invitations/received/', ReceivedGameInvitationsListView.as_view(), name='received-game-invitations'),
	# Game
	path('games/<int:id>/', PongGameDetailView.as_view(), name='pong-game-detail'),
	# Match history
	path('match-history/<int:id>/', MatchHistoryListView.as_view(), name='match-history'),
]