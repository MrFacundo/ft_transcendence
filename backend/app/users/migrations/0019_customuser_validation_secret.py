# Generated by Django 4.2.14 on 2024-11-21 14:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0018_customuser_authenticator_enabled_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='validation_secret',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
