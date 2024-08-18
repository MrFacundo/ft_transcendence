import logging
import requests
import secrets

from django.conf import settings
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib import messages
from django.contrib.messages import get_messages
from django.http import JsonResponse

from .services import get_or_create_user_from_oauth

logger = logging.getLogger(__name__)

class OAuth42View(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        state = secrets.token_urlsafe(16)
        request.session['oauth_state'] = state
        auth_url = f"https://api.intra.42.fr/oauth/authorize?client_id={settings.OAUTH_42_CLIENT_ID}&redirect_uri={settings.OAUTH_42_REDIRECT_URI}&response_type=code&state={state}"
        return redirect(auth_url)


class OAuth42CallbackView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        try:
            self.validate_state(request)
            code = self.get_code(request)
            access_token = self.exchange_code_for_token(code)
            user_info = self.fetch_user_info(access_token)
            return self.handle_successful_login(user_info)
        except requests.RequestException as e:
            return self.log_and_redirect(f"A network error occurred: {str(e)}")
        except Exception as e:
            return self.log_and_redirect(f"An unexpected error occurred: {str(e)}")

    def validate_state(self, request):
        if request.GET.get('state') != request.session.get('oauth_state'):
            raise ValueError("Invalid OAuth state parameter detected.")

    def get_code(self, request):
        code = request.GET.get('code')
        if not code:
            raise ValueError("OAuth callback without code.")
        return code

    def exchange_code_for_token(self, code):
        response = requests.post("https://api.intra.42.fr/oauth/token", data={
            'grant_type': 'authorization_code',
            'client_id': settings.OAUTH_42_CLIENT_ID,
            'client_secret': settings.OAUTH_42_CLIENT_SECRET,
            'code': code,
            'redirect_uri': settings.OAUTH_42_REDIRECT_URI,
        })
        response.raise_for_status()
        return response.json().get('access_token')

    def fetch_user_info(self, access_token):
        response = requests.get("https://api.intra.42.fr/v2/me", headers={
            'Authorization': f'Bearer {access_token}'
        })
        response.raise_for_status()
        return response.json()

    def handle_successful_login(self, user_info):
        token = get_or_create_user_from_oauth(user_info)
        frontend_redirect_url = (f"{settings.FRONTEND_URL}/oauth-result")

        response = redirect(frontend_redirect_url)
        response.set_cookie('token', token, httponly=False, secure=False, samesite='Lax')
        return response

    def log_and_redirect(self, message):
        logger.error(message)
        return redirect(f"{settings.FRONTEND_URL}/oauth-result?error=true")