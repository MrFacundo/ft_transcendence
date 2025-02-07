from django.core.management.base import BaseCommand
from django.utils import timezone
from app.tournaments.models import Tournament

class Command(BaseCommand):
    help = 'Expire tournaments after one hour of being created'

    def handle(self, *args, **kwargs):
        expired_tournaments = Tournament.objects.filter(start_date__lt=timezone.now() - timezone.timedelta(hours=1), end_date=None)
        if expired_tournaments.exists():
            print('Expiring the following tournaments:')
            for tournament in expired_tournaments:
                print(f'- Tournament ID {tournament.id}, Name: {tournament.name}')
                tournament.end_date = timezone.now()
                tournament.save()
        else:
            print('No tournaments to expire.')