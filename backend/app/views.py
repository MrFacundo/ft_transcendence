from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
import os

class ProtectedMediaView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Restrict access to authenticated users

    def get(self, request, path=None):
        # Prevent directory traversal attacks
        safe_path = os.path.normpath(os.path.join(settings.MEDIA_ROOT, path))
        
        # Ensure the file is still within MEDIA_ROOT
        if not safe_path.startswith(os.path.abspath(settings.MEDIA_ROOT)):
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        if not os.path.exists(safe_path):
            raise Http404("File not found")

        try:
            with open(safe_path, 'rb') as file:
                response = FileResponse(file)
                return response
        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
