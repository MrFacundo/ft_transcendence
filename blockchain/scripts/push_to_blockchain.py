import os
import time
import psycopg2
import json
import argparse
from web3 import Web3

# PostgreSQL database configurations
DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
GANACHE_URL = os.getenv("GANACHE_URL")

# Read contract address from JSON file
with open('/usr/src/app/deployedAddress.json') as f:
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
    },
	{
        "constant": True,
        "inputs": [],
        "name": "getMaxPostgresId",
        "outputs": [
            {"name": "", "type": "uint256"}
        ],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    }
]

# Connect to Ganache
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

def get_max_postgres_id_from_blockchain():
    return contract.functions.getMaxPostgresId().call()

def get_max_postgres_id_from_db():
    try:
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
        cur = conn.cursor()

        cur.execute("SELECT MAX(id) FROM games_ponggame")
        max_id = cur.fetchone()[0]
        
        cur.close()
        conn.close()

        return max_id if max_id is not None else 0
    except psycopg2.OperationalError:
        print("Database is not available. Retrying in 5 seconds...")
        time.sleep(3)
        return 0


# Function to get recently completed games from PostgreSQL
def monitor_game(last_checked_id):
    while True:
        try:
            conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
            cur = conn.cursor()

            cur.execute(f"""
                SELECT id, date_played, score_player1, score_player2, status, player1_id, player2_id, winner_id, tournament_id
                FROM games_ponggame
                WHERE (status = 'interrupted' OR status = 'completed') 
                AND registered_on_blockchain = FALSE
                AND id > {last_checked_id}
                ORDER BY id ASC
            """)

            games = cur.fetchall()
            
            if games:
                last_checked_id = games[-1][0]
            
            cur.close()
            conn.close()
            
            return [{"id": j[0], " j[1], "date_played": j[2], "score_player1": j[3], "score_player2": j[4], " j[5], "status": j[6], "player1_id": j[7], "player2_id": j[8], "winner_id": j[9], "tournament_id": j[10]} for j in games]
        except psycopg2.OperationalError:
            print("Database is not available. Retrying in 5 seconds...")
            time.sleep(3)


def get_all_new_games():
    last_blockchain_id = get_max_postgres_id_from_blockchain()
    while True:
        try:
            conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
            cur = conn.cursor()

            cur.execute(f"""
                SELECT id, date_played, score_player1, score_player2, status, player1_id, player2_id, winner_id, tournament_id
                FROM games_ponggame
                WHERE (status = 'interrupted' OR status = 'completed') 
                AND registered_on_blockchain = FALSE
                AND id > {last_blockchain_id}
                ORDER BY id ASC
            """)
            
            games = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return [{"id": j[0], " j[1], "date_played": j[2], "score_player1": j[3], "score_player2": j[4], " j[5], "status": j[6], "player1_id": j[7], "player2_id": j[8], "winner_id": j[9], "tournament_id": j[10]} for j in games]
        except psycopg2.OperationalError:
            print("Database is not available. Retrying in 5 seconds...")
            time.sleep(3)


# Function to mark a game as registered in PostgreSQL
def mark_game_registered(game_id):
    while True:
        try:
            conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
            cur = conn.cursor()

            cur.execute("UPDATE games_ponggame SET registered_on_blockchain = TRUE WHERE id = %s", (game_id,))
            
            conn.commit()
            cur.close()
            conn.close()
            break
        except psycopg2.OperationalError:
            print("Database is not available. Retrying in 5 seconds...")
            time.sleep(3)

# Function to register a game on the blockchain
def register_game_on_blockchain(game):
    tx_hash = contract.functions.addGame(
        game['id'],
        game[',
        int(game['date_played'].timestamp()),
        game['score_player1'],
        game['score_player2'],
        int(game['.timestamp()) if game[' else 0,
        game['status'],
        game['player1_id'],
        game['player2_id'],
        game['winner_id'] if game['winner_id'] else 0,
        game['tournament_id'] if game['tournament_id'] else 0
    ).transact({'from': web3.eth.accounts[0]})
    web3.eth.wait_for_transaction_receipt(tx_hash)


# Main function to monitor games and register on the blockchain
def monitor_games():
    last_checked_id = get_max_postgres_id_from_db()
    while True:
        if os.path.exists('/usr/src/app/stop_monitor.flag'):
            print("Stopping monitor_games loop...")
            os.remove('/usr/src/app/stop_monitor.flag')
            break
        new_game = monitor_game(last_checked_id)
        
        for game in new_game:
            print(f"Registering game {game['id']} on the blockchain...")
            register_game_on_blockchain(game)
            mark_game_registered(game['id'])

        time.sleep(3)

def all_new_games():
    new_game = get_all_new_games()
    for game in new_game:
        print(f"Registering game {game['id']} on the blockchain...")
        register_game_on_blockchain(game)
        mark_game_registered(game['id'])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monitor and register games on the blockchain")
    parser.add_argument("--startMonitor", action="store_true", help="Start continuous monitoring of new games")
    parser.add_argument("--stopMonitor", action="store_true", help="Stop monitor new games")
    parser.add_argument("--allNewGames", action="store_true", help="Save all Games")
    
    args = parser.parse_args()

    if args.startMonitor:
        monitor_games()
        
    if args.stopMonitor:
        with open('/usr/src/app/stop_monitor.flag', 'w') as f:
            f.write('stop')
        print("Signal to stop monitor_games loop has been sent.")

    if args.allNewGames:
        all_new_games()