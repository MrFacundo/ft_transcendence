import json
import pandas as pd
from web3 import Web3

# Configurações do Ganache
GANACHE_URL = "http://blockchain_ganache:8545"

# Ler o endereço do contrato a partir do arquivo JSON
with open('/usr/src/app/shared/deployedAddress.json') as f:
    data = json.load(f)
    CONTRACT_ADDRESS = data['address']
    
# ABI do contrato inteligente
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

# Conectar ao Ganache
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Função para obter jogos por torneio e converter para DataFrame
def get_games_by_tournament(tournament_id):
    try:
        print(f"Chamando getGamesByTournament para tournament_id: {tournament_id}")
        games = contract.functions.getGamesByTournament(tournament_id).call()
        print(f"Jogos obtidos: {games}")
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
        print(f"Erro ao obter jogos por torneio: {e}")
        return pd.DataFrame()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Listar jogos de um determinado torneio na blockchain")
    parser.add_argument("--games_by_tournament", type=int, help="Listar todos os jogos de um determinado torneio pelo ID do torneio")
    
    args = parser.parse_args()

    if args.games_by_tournament:
        db = get_games_by_tournament(args.games_by_tournament)
        print(db.to_string(index=False))