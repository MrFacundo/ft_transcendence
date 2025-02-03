from django.urls import path

from app.authentication.views.auth_views import UserDetailView

from app.users.views import (
    UserListView,
    FriendRequestView,
    FriendAcceptView,
    FriendsListView,
    OnlineUserListView,
    OnlineStatusListView,
)

urlpatterns = [
    # Users and Friends
    path('user', UserDetailView.as_view(), name='user-detail'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('online-users/', OnlineUserListView.as_view(), name='online-users'),
    path('user/<int:pk>', UserDetailView.as_view(), name='user-detail-pk'),
    path('friend-request/<int:friend_id>', FriendRequestView.as_view(), name='friend-request'),
    path('friend-accept/<int:friend_id>', FriendAcceptView.as_view(), name='friend-accept'),
    path('friends/<int:user_id>/', FriendsListView.as_view(), name='friends-list'),
    path('online-status/', OnlineStatusListView.as_view(), name='online-status'),
]
