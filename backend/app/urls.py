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
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.shortcuts import redirect

schema_view = get_schema_view(
    openapi.Info(
        title="Transcendence API",
        default_version='v1',
        description="API documentation",
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('api/', lambda request: redirect('schema-swagger-ui', permanent=False)),
    path('api/swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # Admin
    path('api/admin/', admin.site.urls),

    # App URLs
    path('api/', include('app.users.urls')),
    path('api/', include('app.auth.urls')),
    path('api/', include('app.games.urls')),
    path('api/', include('app.tournaments.urls')),

    path('api/silk/', include('silk.urls', namespace='silk')),
    path('api/ht/', include('health_check.urls')),
]

if not settings.DEBUG:
    urlpatterns += static('/api' + settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif settings.PRODUCTION:
    urlpatterns += [path('media/<path:path>', ProtectedMediaView.as_view())]