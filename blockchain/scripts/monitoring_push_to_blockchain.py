import time
import psycopg2
import json
import argparse
from web3 import Web3

# PostgreSQL database configurations
# de .env
POSTGRES_DB=transcendence
POSTGRES_USER=db_user
POSTGRES_PASSWORD=db_password
POSTGRES_HOST=db

# DB_NAME = "transcendence"
# DB_USER = "db_user"
# DB_PASSWORD = "db_password"
# DB_HOST = "transcendence_db"


# Ganache Configurations"
GANACHE_URL = "http://blockchain_ganache:8545"

# Read contract address from JSON file
with open('/usr/src/deployedAddress.json') as f:
    data = json.load(f)
    CONTRACT_ADDRESS = data['address']
    
# Smart contract ABI
CONTRACT_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "_id", "type": "uint256"},
            {"name": "_channelGroupName", "type": "string"},
            {"name": "_datePlayed", "type": "uint256"},
            {"name": "_scorePlayer1", "type": "uint256"},
            {"name": "_scorePlayer2", "type": "uint256"},
            {"name": "_matchDate", "type": "uint256"},
            {"name": "_status", "type": "string"},
            {"name": "_player1Id", "type": "uint256"},
            {"name": "_player2Id", "type": "uint256"},
            {"name": "_winnerId", "type": "uint256"},
            {"name": "_tournamentId", "type": "uint256"}
        ],
        "name": "addGame",
        "outputs": [],
        "payable": False,
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

# Connect to Ganache
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Function to get recently completed games from PostgreSQL
def get_new_game():
    while True:
        try:
            conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
            cur = conn.cursor()

            cur.execute("""
                SELECT id, channel_group_name, date_played, score_player1, score_player2, match_date, status, player1_id, player2_id, winner_id, tournament_id
                FROM games_ponggame
                WHERE (status = 'interrupted' OR status = 'completed' ) AND registrado_blockchain = FALSE
            """)
            
            games = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return [{"id": j[0], "channel_group_name": j[1], "date_played": j[2], "score_player1": j[3], "score_player2": j[4], "match_date": j[5], "status": j[6], "player1_id": j[7], "player2_id": j[8], "winner_id": j[9], "tournament_id": j[10]} for j in games]
        except psycopg2.OperationalError:
            print("Database is not available. Retrying in 5 seconds...")
            time.sleep(5)

# Function to mark a game as registered in PostgreSQL
def mark_game_registered(game_id):
    while True:
        try:
            conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
            cur = conn.cursor()

            cur.execute("UPDATE games_ponggame SET registrado_blockchain = TRUE WHERE id = %s", (game_id,))
            
            conn.commit()
            cur.close()
            conn.close()
            break
        except psycopg2.OperationalError:
            print("Database is not available. Retrying in 5 seconds...")
            time.sleep(5)

# Function to register a game on the blockchain
def register_game_on_blockchain(game):
    tx_hash = contract.functions.addGame(
        game['id'],
        game['channel_group_name'],
        int(game['date_played'].timestamp()),
        game['score_player1'],
        game['score_player2'],
        int(game['match_date'].timestamp()) if game['match_date'] else 0,
        game['status'],
        game['player1_id'],
        game['player2_id'],
        game['winner_id'] if game['winner_id'] else 0,
        game['tournament_id'] if game['tournament_id'] else 0
    ).transact({'from': web3.eth.accounts[0]})
    web3.eth.wait_for_transaction_receipt(tx_hash)

# Main function to monitor games and register on the blockchain
def monitor_games():
    while True:
        new_game = get_new_game()

        for game in new_game:
            print(f"Registering game {game['id']} on the blockchain...")
            register_game_on_blockchain(game)
            mark_game_registered(game['id'])

        time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monitor and register games on the blockchain")
    parser.add_argument("--monitor", action="store_true", help="Start continuous monitoring of new games")
    
    args = parser.parse_args()

    if args.monitor:
        monitor_games()