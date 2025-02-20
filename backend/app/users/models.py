from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator, MinLengthValidator, EmailValidator, FileExtensionValidator
import pyotp

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
    oauth_uid = models.CharField(max_length=255, blank=True, null=True)
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

    def __str__(self):
        return self.username

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

    def get_current_tournament(self):
        return self.tournaments.filter(end_date__isnull=True).first()
        
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
    sender = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='friendships_initiated'
    )
    receiver = models.ForeignKey(
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
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"

class UserOnlineStatus(models.Model):
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='online_status'
    )
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} is {'online' if self.is_online else 'offline'}"