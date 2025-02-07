from django.core.management.base import BaseCommand
from app.users.models import CustomUser, GameStats
from faker import Faker
import random
import requests
from django.core.files.base import ContentFile
from io import BytesIO
class Command(BaseCommand):
    help = "Create a group of users with associated game stats"

    def handle(self, *args, **kwargs):
        if CustomUser.objects.count() >=10:
            self.stdout.write(self.style.WARNING("Users already exist. Exiting script."))
            return

        fake = Faker()
        number_of_users = 10

        self.stdout.write(self.style.NOTICE("Starting user creation process..."))

        for i in range(number_of_users):
            self.stdout.write(self.style.NOTICE(f"Creating user {i + 1} of {number_of_users}..."))

            username = fake.user_name()
            email = fake.email()

            self.stdout.write(self.style.NOTICE(f"Generated username: {username}, email: {email}"))

            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password="pass"
            )

            self.stdout.write(self.style.NOTICE(f"User {username} created. Downloading avatar..."))

            image_url = fake.image_url()
            response = requests.get(image_url)
            if response.status_code == 200:
                image_name = f"{username}.jpg"
                user.avatar_upload.save(image_name, ContentFile(response.content), save=True)
                self.stdout.write(self.style.NOTICE(f"Avatar for {username} saved as {image_name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Failed to download avatar for {username}"))

            game_stats = user.game_stats

            total_matches = random.randint(30, 60)
            wins = random.randint(0, total_matches)
            losses = total_matches - wins

            game_stats.total_matches = total_matches
            game_stats.wins = wins
            game_stats.losses = losses
            game_stats.save()

            self.stdout.write(self.style.SUCCESS(f"Successfully created user: {username}, Password: pass"))

        self.stdout.write(self.style.SUCCESS("User creation process completed."))