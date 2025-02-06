from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.base_user import BaseUserManager
from django.core.validators import RegexValidator, MinLengthValidator, EmailValidator, FileExtensionValidator
import pyotp

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        if not username:
            raise ValueError(_('The Username field must be set'))

        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, username, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, username, password, **extra_fields)

class CustomUser(AbstractUser):
    TWO_FACTOR_CHOICES = [
        ('none', 'None'),
        ('email', 'Email'),
        ('authenticator', 'Authenticator')
    ]
    username = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            MinLengthValidator(4, message='Username must be at least 4 characters long.'),
            RegexValidator(
                regex=r'^[\w.@+-]+$', 
                message=_('Enter a valid username.')
            )
        ]
    )
    email = models.EmailField(
        _('email address'), 
        max_length=255, 
        unique=True, 
        validators=[EmailValidator]
    )
    email_is_verified = models.BooleanField(default=True)
    new_email = models.EmailField(
        _('pending email address'), 
        max_length=255, 
        blank=True, 
        null=True, 
        validators=[EmailValidator]
    )
    new_email_is_verified = models.BooleanField(default=False)
    avatar_oauth = models.URLField(blank=True, null=True)
    avatar_upload = models.ImageField(
        upload_to='avatars/', 
        blank=True, 
        null=True, 
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])]
    )
    two_factor_method = models.CharField(max_length=13, choices=TWO_FACTOR_CHOICES, default='none')
    validation_secret = models.CharField(max_length=32, null=True, blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if self.email_is_verified:
            self.email = self.email.lower()
        super().save(*args, **kwargs)

    def generate_totp(self):
        """Generate a Time-Based One-Time Password object using the validation secret"""
        if not self.validation_secret:
            self.validation_secret = pyotp.random_base32()
            self.save()
        return pyotp.TOTP(self.validation_secret, interval=300)

class GameStats(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='game_stats'
    )
    total_matches = models.PositiveIntegerField(default=0)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"GameStats for {self.user.username}"

class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ]
    
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='friendships_initiated'
    )
    friend = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='friendships_received'
    )
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending'
    )

    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"