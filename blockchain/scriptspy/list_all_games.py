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


FOUNDRY_URL = os.getenv("FOUNDRY_URL", "http://localhost:8545")
FOUNDRY_PRIVATE_KEY = os.getenv("FOUNDRY_PRIVATE_KEY")

web3 = Web3(Web3.HTTPProvider(FOUNDRY_URL))
account = web3.eth.account.from_key(FOUNDRY_PRIVATE_KEY)


with open('/usr/src/app/deployedAddress.json') as f:
    data = json.load(f)
CONTRACT_ADDRESS = data['address']
    
# Smart contract ABI
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
        "inputs": [
            {"name": "_gameId", "type": "uint256"}
        ],
        "name": "getGame",
        "outputs": [
            {"name": "gameId", "type": "uint256"},
            {"name": "id", "type": "uint256"},
            {"name": "datePlayed", "type": "uint256"},
            {"name": "scorePlayer1", "type": "uint256"},
            {"name": "scorePlayer2", "type": "uint256"},
            {"name": "status", "type": "string"},
            {"name": "player1Id", "type": "uint256"},
            {"name": "player2Id", "type": "uint256"},
            {"name": "winnerId", "type": "uint256"},
            {"name": "tournamentId", "type": "uint256"}
        ],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "getGameCount",
        "outputs": [
            {"name": "", "type": "uint256"}
        ],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    }
]


contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Function to convert list of games to DataFrame
def convert_to_dataframe(games):
    df = pd.DataFrame(games)
    return df.reset_index(drop=True)

# Function to list games registered on the blockchain
def list_blockchain_games():
    game_count = contract.functions.getGameCount().call()
    games = []
    for game_id in range(1, game_count + 1):
        game = contract.functions.getGame(game_id).call()
        games.append({
            "gameId": game[0],
            "id": game[1],
            "datePlayed": pd.to_datetime(game[2], unit='s'),
            "scorePlayer1": game[3],
            "scorePlayer2": game[4],
            "status": game[5],
            "player1Id": game[6],
            "player2Id": game[7],
            "winnerId": game[8],
            "tournamentId": game[9]
        })
    df = convert_to_dataframe(games)
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="List games registered on the blockchain")
    parser.add_argument("--lg", action="store_true", help="List games registered on the blockchain")
    
    args = parser.parse_args()
    if args.lg:
        db = list_blockchain_games()
        print(db.to_string(index=False))