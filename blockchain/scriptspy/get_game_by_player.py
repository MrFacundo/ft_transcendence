import os
import json
import pandas as pd
from web3 import Web3


FOUNDRY_URL = os.getenv("FOUNDRY_URL",)
FOUNDRY_PRIVATE_KEY = os.getenv("FOUNDRY_PRIVATE_KEY")

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


web3 = Web3(Web3.HTTPProvider(FOUNDRY_URL))
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

def get_games_by_player(player_id):
    try:
        games = contract.functions.getGamesByPlayer(player_id).call()
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