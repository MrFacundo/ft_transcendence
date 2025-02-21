from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('games', '0004_alter_ponggame_player1_alter_ponggame_player2.py'),  # Ajuste conforme necessário
    ]

    operations = [
        migrations.RunSQL(
            """
            CREATE MATERIALIZED VIEW mv_completed_games_with_usernames AS
            SELECT 
                g.id AS game_id,
                g.channel_group_name,
                g.date_played,
                g.score_player1,
                g.score_player2,
                g.match_date,
                g.status,
                g.tournament_id,
                g.winner_id,
                w.username AS winner_username,
                g.player1_id,
                p1.username AS player1_username,
                g.player2_id,
                p2.username AS player2_username
            FROM games_ponggame g
            LEFT JOIN users_customuser p1 ON g.player1_id = p1.id
            LEFT JOIN users_customuser p2 ON g.player2_id = p2.id
            LEFT JOIN users_customuser w ON g.winner_id = w.id
            WHERE g.status = 'completed';
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS mv_completed_games_with_usernames;"
        ),
    ]
