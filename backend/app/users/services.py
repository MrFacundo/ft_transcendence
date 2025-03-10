from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class UserValidationService:
    """Centralized service for user-related validations."""

    @staticmethod
    def validate_creation_fields(attrs):
        allowed_fields = ['username', 'email', 'password']
        invalid_fields = [field for field in attrs if field not in allowed_fields]
        
        if invalid_fields:
            raise ValidationError(
                f"Fields {', '.join(invalid_fields)} are not allowed during user creation."
            )
        return attrs

    @staticmethod
    def validate_update_fields(attrs):
        blocked_direct_update_fields = ['password', 'email']
        invalid_fields = [field for field in attrs if field in blocked_direct_update_fields]
        
        if invalid_fields:
            raise ValidationError(
                f"Field {', '.join(invalid_fields)} cannot be updated."
            )
        return attrs

    @staticmethod
    def validate_email_uniqueness(value, instance=None):
        if User.objects.filter(Q(email=value) | Q(new_email=value)).exclude(pk=instance.pk if instance else None).exists():
            raise ValidationError("This email is already registered to another account.")
        return value

    @staticmethod
    def validate_avatar_size(value):
        if value.size > 5 * 1024 * 1024:
            raise ValidationError("File too large. Size should not exceed 5 MB.")
        return value

    @staticmethod
    def validate_two_factor_method(value):
        if value == 'authenticator':
            raise ValidationError("Field can not be updated.")
        return value