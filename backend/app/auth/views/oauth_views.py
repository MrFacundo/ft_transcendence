import logging
import requests
import secrets

from django.conf import settings
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from ..services import get_or_create_user_from_oauth, DuplicateUserDataError

logger = logging.getLogger(__name__)

class OAuth42View(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        state = secrets.token_urlsafe(16)
        request.session['oauth_state'] = state
        auth_url = (
            f"https://api.intra.42.fr/oauth/authorize?"
            f"client_id={settings.OAUTH_42_CLIENT_ID}&"
            f"redirect_uri={settings.OAUTH_42_REDIRECT_URI}&"
            f"response_type=code&state={state}"
        )
        return redirect(auth_url)

class OAuth42CallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Validate state to prevent CSRF
            if request.GET.get('state') != request.session.get('oauth_state'):
                raise ValueError("Invalid OAuth state")
            
            # Get authorization code
            code = request.GET.get('code')
            if not code:
                raise ValueError("No authorization code")
            
            # Exchange code for token
            token_response = requests.post("https://api.intra.42.fr/oauth/token", data={
                'grant_type': 'authorization_code',
                'client_id': settings.OAUTH_42_CLIENT_ID,
                'client_secret': settings.OAUTH_42_CLIENT_SECRET,
                'code': code,
                'redirect_uri': settings.OAUTH_42_REDIRECT_URI,
            }).json()
            if 'error' in token_response:
                raise ValueError(token_response['error'])
            # Fetch user info
            user_info = requests.get("https://api.intra.42.fr/v2/me", 
                headers={'Authorization': f'Bearer {token_response["access_token"]}'}
            ).json()
            # Create user and response
            tokens = get_or_create_user_from_oauth(user_info)
            response = redirect(f"{settings.FRONTEND_URL}/oauth-result")
            response.set_cookie(
                'access_token', str(tokens.access_token), httponly=False)
            response.set_cookie(
                'refresh_token', str(tokens), httponly=False)
            return response

        except DuplicateUserDataError as e:
            logger.error(f"OAuth Error: {e}")
            return redirect(f"{settings.FRONTEND_URL}/oauth-result?error=duplicate_data")   
        
        except Exception as e:
            logger.error(f"OAuth Error: {e}")
            return redirect(f"{settings.FRONTEND_URL}/oauth-result?error=unknown")