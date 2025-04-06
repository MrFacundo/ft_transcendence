from django.core.management.base import BaseCommand
from app.users.models import CustomUser
from faker import Faker
import random
from django.core.files.base import ContentFile
from io import BytesIO
import cairosvg
import py_avataaars as pa
import random

class Command(BaseCommand):
    help = "Create 10 users"

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
                password="pass",
                email_is_verified=True
            )

            self.stdout.write(self.style.NOTICE(f"User {username} created. Generating avatar..."))

            avatar = pa.PyAvataaar(
                style=random.choice(list(pa.AvatarStyle)),
                skin_color=random.choice(list(pa.SkinColor)),
                hair_color=random.choice(list(pa.HairColor)),
                facial_hair_type=random.choice(list(pa.FacialHairType)),
                facial_hair_color=random.choice(list(pa.HairColor)),
                top_type=random.choice(list(pa.TopType)),
                hat_color=random.choice(list(pa.Color)),
                mouth_type=random.choice(list(pa.MouthType)),
                eye_type=random.choice(list(pa.EyesType)),
                eyebrow_type=random.choice(list(pa.EyebrowType)),
                nose_type=random.choice(list(pa.NoseType)),
                accessories_type=random.choice(list(pa.AccessoriesType)),
                clothe_type=random.choice(list(pa.ClotheType)),
                clothe_color=random.choice(list(pa.Color)),
                clothe_graphic_type=random.choice(list(pa.ClotheGraphicType)),
            )

            svg_str = avatar.render_svg()
            svg_io = BytesIO(svg_str.encode("utf-8"))
            svg_io.seek(0)
            png_io = BytesIO()
            cairosvg.svg2png(bytestring=svg_io.read(), write_to=png_io)
            png_io.seek(0)

            image_name = f"{username}.png"
            user.avatar_upload.save(image_name, ContentFile(png_io.read()), save=True)

            self.stdout.write(self.style.SUCCESS(f"User created: {username}, Password: pass"))

        self.stdout.write(self.style.SUCCESS("User creation process completed."))