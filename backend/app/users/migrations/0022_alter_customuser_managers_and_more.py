# Generated by Django 4.2.14 on 2025-01-19 01:43

import django.contrib.auth.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0021_customuser_oauth_uid'),
    ]

    operations = [
        migrations.AlterModelManagers(
            name='customuser',
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.RenameField(
            model_name='friendship',
            old_name='friend',
            new_name='receiver',
        ),
        migrations.RenameField(
            model_name='friendship',
            old_name='user',
            new_name='sender',
        ),
    ]
