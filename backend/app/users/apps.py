from django.apps import AppConfig

class UserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app.users'  # Ensure this matches the actual path

    def ready(self):
        from app.users import signals
