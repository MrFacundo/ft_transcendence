import os
import json
import argparse
import pandas as pd
from web3 import Web3

# Ganache Configurations

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
        "inputs": [
            {"name": "_gameId", "type": "uint256"}
        ],
        "name": "getGame",
        "outputs": [
            {"name": "gameId", "type": "uint256"},
            {"name": "id", "type": "uint256"},
            {"name": "channelGroupName", "type": "string"},
            {"name": "datePlayed", "type": "uint256"},
            {"name": "scorePlayer1", "type": "uint256"},
            {"name": "scorePlayer2", "type": "uint256"},
            {"name": "matchDate", "type": "uint256"},
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

# Connect to Ganache
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))
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
            "channelGroupName": game[2],
            "datePlayed": pd.to_datetime(game[3], unit='s'),
            "scorePlayer1": game[4],
            "scorePlayer2": game[5],
            "matchDate": pd.to_datetime(game[6], unit='s') if game[6] != 0 else None,
            "status": game[7],
            "player1Id": game[8],
            "player2Id": game[9],
            "winnerId": game[10],
            "tournamentId": game[11]
        })
    df = convert_to_dataframe(games)
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="List games registered on the blockchain")
    parser.add_argument("--list_blockchain_games", action="store_true", help="List games registered on the blockchain")
    
    args = parser.parse_args()

    if args.list_blockchain_games:
        db = list_blockchain_games()
        print(db.to_string(index=False))