from django.core.management.base import BaseCommand
from django.utils import timezone
from app.games.models import GameInvitation

class Command(BaseCommand):
    help = 'Expire game invitations that have passed their expiry date'

    def handle(self, *args, **kwargs):
        expired_invitations = GameInvitation.objects.filter(expires_at__lt=timezone.now(), status='pending')
        if expired_invitations.exists():
            print('Expiring the following invitations:')
            for invitation in expired_invitations:
                print(f'- Invitation ID {invitation.id}, Sender: {invitation.sender}, Receiver: {invitation.receiver}')
                invitation.status = 'expired'
                invitation.save()
        else:
            print('No invitations to expire.')
        print(self.style.SUCCESS('Successfully expired invitations'))
