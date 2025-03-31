import os
import json
import pandas as pd
from web3 import Web3

GANACHE_URL = os.getenv("GANACHE_URL")

# Read contract address from JSON file
with open('/usr/src/app/deployedAddress.json') as f:
    data = json.load(f)
    CONTRACT_ADDRESS = data['address']
    
# Smart contract ABI
CONTRACT_ABI = [
    {
        "constant": True,
        "inputs": [
            {"name": "_tournamentId", "type": "uint256"}
        ],
        "name": "getGamesByTournament",
        "outputs": [
            {
                "components": [
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
                "name": "",
                "type": "tuple[]"
            }
        ],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    }
]

# Connect to Ganache
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Function to list tournaments registered on the blockchain
def get_games_by_tournament(tournament_id):
    try:
        games = contract.functions.getGamesByTournament(tournament_id).call()
        games_list = [{
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
        } for game in games]
        return pd.DataFrame(games_list)
    except Exception as e:
        print(f"Error getting games by tournament: {e}")
        return pd.DataFrame()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="List games of a specific tournament on the blockchain")
    parser.add_argument("--games_by_tournament", type=int, help="List all games of a specific tournament by tournament ID")
    
    args = parser.parse_args()

    if args.games_by_tournament:
        db = get_games_by_tournament(args.games_by_tournament)
        print(db.to_string(index=False))