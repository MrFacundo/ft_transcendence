"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from app.views import ProtectedMediaView


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    path('api/', include('app.users.urls')),
    path('api/', include('app.auth.urls')),
    path('api/', include('app.games.urls')),

    # Profiling (Django Silk)
    path('silk/', include('silk.urls', namespace='silk')),
]

# Handle media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif settings.PRODUCTION:
    urlpatterns += [path('media/<path:path>', ProtectedMediaView.as_view())]
