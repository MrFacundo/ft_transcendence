import os
import psycopg2
from psycopg2.extras import RealDictCursor

DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")

def list_all_games():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT id, date_played, score_player1, score_player2, status,
                   player1_id, player2_id, winner_id, tournament_id
            FROM games_ponggame
            ORDER BY id ASC
        """)
        games = cur.fetchall()

        print("📋 Game List:")
        for game in games:
            print(f"ID: {game['id']}, Date: {game['date_played']}, "
                  f"Score: {game['score_player1']} x {game['score_player2']}, "
                  f"Status: {game['status']}, Player 1: {game['player1_id']}, "
                  f"Player 2: {game['player2_id']}, Winner: {game['winner_id']}, "
                  f"Tournament: {game['tournament_id']}")

        cur.close()
        conn.close()

    except psycopg2.OperationalError as e:
        print(f"❌ Error connecting to database: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    list_all_games()