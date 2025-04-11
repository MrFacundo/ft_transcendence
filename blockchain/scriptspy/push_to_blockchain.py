import os
import time
import psycopg2
import json
import argparse
import pandas as pd
from web3 import Web3

# PostgreSQL database configurations
DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")


FOUNDRY_URL = os.getenv("FOUNDRY_URL",)
FOUNDRY_PRIVATE_KEY = os.getenv("FOUNDRY_PRIVATE_KEY")


web3 = Web3(Web3.HTTPProvider(FOUNDRY_URL))
account = web3.eth.account.from_key(FOUNDRY_PRIVATE_KEY)


with open('/usr/src/app/deployedAddress.json') as f:
    data = json.load(f)
CONTRACT_ADDRESS = data['address']

CONTRACT_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "_id", "type": "uint256"},
            {"name": "_datePlayed", "type": "uint256"},
            {"name": "_scorePlayer1", "type": "uint256"},
            {"name": "_scorePlayer2", "type": "uint256"},
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
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    }
]

contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
print(f"📝 Submitting game for registration on the blockchain..")

def estimate_games_with_gas():
    try:

        balance_wei = web3.eth.get_balance(account.address)
        balance_eth = web3.from_wei(balance_wei, 'ether')
        print(f"💰 Current account balance: {balance_eth} ETH")


        latest_block = web3.eth.get_block('latest')
        base_fee = latest_block.get('baseFeePerGas', 0)
        max_priority_fee = web3.to_wei(2, 'gwei')
        max_fee = base_fee + max_priority_fee

        gas_limit = 500000
        cost_per_game = gas_limit * max_fee
        cost_per_game_eth = web3.from_wei(cost_per_game, 'ether')

        games_possible = balance_wei // cost_per_game
        print(f"🔢 Estimated cost per game: {cost_per_game_eth} ETH")
        print(f"🎮 Games that can be registered with current balance: {games_possible}")

        return {
            "balance_eth": balance_eth,
            "cost_per_game_eth": cost_per_game_eth,
            "games_possible": games_possible
        }
    except Exception as e:
        print(f"❌ Error estimating games based on balance: {e}")
        return None
    

def reset_balance(address: str, amount_wei: int = 2**64 - 1):
    """Reset the account balance using Anvil's RPC method"""
    hex_value = hex(amount_wei)
    payload = {
        "jsonrpc": "2.0",
        "method": "anvil_setBalance",
        "params": [address, hex_value],
        "id": 1
    }
    response = web3.provider.make_request(payload['method'], payload['params'])
    print("📤 Sending transaction to addGame...")
    print(f"✅ Balance reset to {address}: {hex_value}")
    
    return response


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

def monitor_game(last_checked_id):
    while True:
        try:
            conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
            cur = conn.cursor()
            cur.execute("""
                SELECT id, date_played, score_player1, score_player2, status,
                       player1_id, player2_id, winner_id, tournament_id
                FROM games_ponggame
                WHERE (status = 'interrupted' OR status = 'completed')
                  AND registered_on_blockchain = FALSE
                  AND id > %s
                ORDER BY id ASC
            """, (last_checked_id,))
            games = cur.fetchall()
            cur.close()
            conn.close()
            if games:
                last_checked_id = games[-1][0]
            return [{"id": g[0], "date_played": g[1], "score_player1": g[2], "score_player2": g[3],
                     "status": g[4], "player1_id": g[5], "player2_id": g[6],
                     "winner_id": g[7], "tournament_id": g[8]} for g in games]
        except psycopg2.OperationalError:
            print("Database is not available. Retrying in 5 seconds...")
            time.sleep(3)

def get_all_new_games():
    last_blockchain_id = get_max_postgres_id_from_blockchain()
    try:
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, date_played, score_player1, score_player2, status,
                   player1_id, player2_id, winner_id, tournament_id
            FROM games_ponggame
            WHERE (status = 'interrupted' OR status = 'completed')
              AND registered_on_blockchain = FALSE
              AND id > %s
            ORDER BY id ASC
        """, (last_blockchain_id,))
        games = cur.fetchall()
        print(f"📥 {len(games)} games found in the bank to register.")
        cur.close()
        conn.close()
        return [{"id": g[0], "date_played": g[1], "score_player1": g[2], "score_player2": g[3],
                 "status": g[4], "player1_id": g[5], "player2_id": g[6],
                 "winner_id": g[7], "tournament_id": g[8]} for g in games]
    except psycopg2.OperationalError:
        print("Database is not available. Retrying in 5 seconds...")
        time.sleep(3)
        return []

def mark_game_registered(game_id):
    try:
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
        cur = conn.cursor()
        cur.execute("UPDATE games_ponggame SET registered_on_blockchain = TRUE WHERE id = %s", (game_id,))
        conn.commit()
        cur.close()
        conn.close()
        print(f"📌 Game {game_id} marked as registered in the bank.")

    except psycopg2.OperationalError:
        print("Database is not available. Retrying in 5 seconds...")
        time.sleep(3)

def register_game_on_blockchain(game):
    
    try:
        nonce = web3.eth.get_transaction_count(account.address)

        latest_block = web3.eth.get_block('latest')
        base_fee = latest_block.get('baseFeePerGas', 0)

        max_priority_fee = web3.to_wei(2, 'gwei')
        max_fee = base_fee + max_priority_fee
        tx = contract.functions.addGame(
            game['id'],
            int(game['date_played'].timestamp()),
            game['score_player1'],
            game['score_player2'],
            game['status'],
            game['player1_id'],
            game['player2_id'],
            game['winner_id'] or 0,
            game['tournament_id'] or 0
        ).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'maxFeePerGas': max_fee,
            'maxPriorityFeePerGas': max_priority_fee
        })
        signed_tx = account.sign_transaction(tx)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"✅ Transaction confirmed: {receipt.transactionHash.hex()}")
    except Exception as e:
        print(f"❌ Error registering game on blockchain: {e}")


def monitor_games():
    last_checked_id = get_max_postgres_id_from_db()
    while True:
        if os.path.exists('/usr/src/app/stop_monitor.flag'):
            print("🛑 Stop flag detected. Exiting monitor...")
            os.remove('/usr/src/app/stop_monitor.flag')
            break
        new_game = monitor_game(last_checked_id)
        for game in new_game:
            print(f"📝 Registering game {game['id']} on blockchain...")
            register_game_on_blockchain(game)
            mark_game_registered(game['id'])
        time.sleep(3)

def all_new_games():
    games = get_all_new_games()
    print(f"📥 {len(games)} games found in the bank to register.")
    for game in games:
        print(f"📝 Registering game {game['id']} on blockchain...")
        register_game_on_blockchain(game)
        mark_game_registered(game['id'])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monitor and register games on the blockchain")
    parser.add_argument("--startMonitor", action="store_true", help="Start continuous monitoring of new games")
    parser.add_argument("--stopMonitor", action="store_true", help="Stop monitor new games")
    parser.add_argument("--allNewGames", action="store_true", help="Save all Games")
    parser.add_argument("--estimateGas", action="store_true", help="Estimate games that can be registered with current gas balance")

    args = parser.parse_args()

    if args.startMonitor:
        reset_balance(account.address)
        print(f"📝 Start of pong monitoring...")
        monitor_games()
        

    if args.stopMonitor:
        with open('/usr/src/app/stop_monitor.flag', 'w') as f:
            f.write('stop')
        print("✅ Stop sign created.")

    if args.allNewGames:
        all_new_games()
        
    if args.estimateGas:
        estimate_games_with_gas()