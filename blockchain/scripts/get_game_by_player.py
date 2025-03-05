import os
import json
import pandas as pd
from web3 import Web3

# Ganache Configurations

GANACHE_URL = os.getenv("GANACHE_URL")

# Read contract address from JSON file
# Read contract address from JSON file
with open('/usr/src/app/deployedAddress.json') as f:
    data = json.load(f)
    CONTRACT_ADDRESS = data['address']
    
# Smart contract ABI
CONTRACT_ABI = [
    {
        "constant": True,
        "inputs": [
            {"name": "_playerId", "type": "uint256"}
        ],
        "name": "getGamesByPlayer",
        "outputs": [
            {
                "components": [
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

# Function to get games by player and convert to DataFrame
def get_games_by_player(player_id):
    try:
        print(f"Chamando getGamesByPlayer for player_id: {player_id}")
        games = contract.functions.getGamesByPlayer(player_id).call()
        print(f"Games obtained: {games}")
        games_list = [{
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
        } for game in games]
        return pd.DataFrame(games_list)
    except Exception as e:
        print(f"Error getting games by player: {e}")
        return pd.DataFrame()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Interacting with games on the Blockchain")
    parser.add_argument("--games_by_player", type=int, help="List all games in which a player participated by player ID")
    
    args = parser.parse_args()

    if args.games_by_player:
        db = get_games_by_player(args.games_by_player)
        print(db.to_string(index=False))