import json
import argparse
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

# Conectar ao Ganache
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Função para converter lista de jogos em DataFrame
def convert_to_dataframe(jogos):
    df = pd.DataFrame(jogos)
    return df.reset_index(drop=True)

# Função para listar jogos cadastrados na blockchain
def listar_jogos_blockchain():
    game_count = contract.functions.getGameCount().call()
    jogos = []
    for game_id in range(1, game_count + 1):
        jogo = contract.functions.getGame(game_id).call()
        jogos.append({
            "gameId": jogo[0],
            "id": jogo[1],
            "channelGroupName": jogo[2],
            "datePlayed": pd.to_datetime(jogo[3], unit='s'),
            "scorePlayer1": jogo[4],
            "scorePlayer2": jogo[5],
            "matchDate": pd.to_datetime(jogo[6], unit='s') if jogo[6] != 0 else None,
            "status": jogo[7],
            "player1Id": jogo[8],
            "player2Id": jogo[9],
            "winnerId": jogo[10],
            "tournamentId": jogo[11]
        })
    df = convert_to_dataframe(jogos)
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Listar jogos cadastrados na blockchain")
    parser.add_argument("--listar_jogos_blockchain", action="store_true", help="Listar jogos cadastrados na blockchain")
    
    args = parser.parse_args()

    if args.listar_jogos_blockchain:
        db = listar_jogos_blockchain()
        print(db.to_string(index=False))