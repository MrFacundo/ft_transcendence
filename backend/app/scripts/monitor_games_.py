import time
import psycopg2
import json
import argparse
import pandas as pd
from web3 import Web3

# Configurações do banco de dados PostgreSQL
DB_NAME = "transcendence"
DB_USER = "db_user"
DB_PASSWORD = "db_password"
DB_HOST = "transcendence_db"

# Configurações do Ganache
GANACHE_URL = "http://blockchain_ganache:8545"

# Ler o endereço do contrato a partir do arquivo JSON
with open('/usr/src/app/shared/deployedAddress.json') as f:
    data = json.load(f)
    CONTRACT_ADDRESS = data['address']
    
CONTRACT_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "_channelGroupName", "type": "string"},
            {"name": "_datePlayed", "type": "uint256"},
            {"name": "_scorePlayer1", "type": "uint256"},
            {"name": "_score_player2", "type": "uint256"},
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

# Função para obter jogos recém-concluídos do PostgreSQL
def get_novos_jogos():
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, channel_group_name, date_played, score_player1, score_player2, match_date, status, player1_id, player2_id, winner_id, tournament_id
        FROM games_ponggame
        WHERE registrado_blockchain = FALSE
    """)
    
    jogos = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return [{"id": j[0], "channel_group_name": j[1], "date_played": j[2], "score_player1": j[3], "score_player2": j[4], "match_date": j[5], "status": j[6], "player1_id": j[7], "player2_id": j[8], "winner_id": j[9], "tournament_id": j[10]} for j in jogos]

# Função para marcar um jogo como registrado no PostgreSQL
def marcar_jogo_registrado(jogo_id):
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
    cur = conn.cursor()

    cur.execute("UPDATE games_ponggame SET registrado_blockchain = TRUE WHERE id = %s", (jogo_id,))
    
    conn.commit()
    cur.close()
    conn.close()

# Função para registrar um jogo na blockchain
def registrar_jogo_na_blockchain(jogo):
    tx_hash = contract.functions.addGame(
        jogo['channel_group_name'],
        int(jogo['date_played'].timestamp()),
        jogo['score_player1'],
        jogo['score_player2'],
        int(jogo['match_date'].timestamp()) if jogo['match_date'] else 0,
        jogo['status'],
        jogo['player1_id'],
        jogo['player2_id'],
        jogo['winner_id'] if jogo['winner_id'] else 0,
        jogo['tournament_id'] if jogo['tournament_id'] else 0
    ).transact({'from': web3.eth.accounts[0]})
    web3.eth.wait_for_transaction_receipt(tx_hash)

# Função para listar jogos cadastrados na blockchain
def listar_jogos_blockchain():
    game_count = contract.functions.getGameCount().call()
    jogos = []
    for game_id in range(1, game_count + 1):
        jogo = contract.functions.getGame(game_id).call()
        jogos.append({
            "gameId": jogo[0],
            "channelGroupName": jogo[1],
            "datePlayed": jogo[2],
            "scorePlayer1": jogo[3],
            "scorePlayer2": jogo[4],
            "matchDate": jogo[5],
            "status": jogo[6],
            "player1Id": jogo[7],
            "player2Id": jogo[8],
            "winnerId": jogo[9],
            "tournamentId": jogo[10]
        })
        df = convert_to_dataframe(jogos)
    return df

# Função principal para monitorar jogos e registrar na blockchain
def monitorar_jogos():
    while True:
        novos_jogos = get_novos_jogos()

        for jogo in novos_jogos:
            print(f"Registrando jogo {jogo['id']} na blockchain...")
            registrar_jogo_na_blockchain(jogo)
            marcar_jogo_registrado(jogo['id'])

        time.sleep(10)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Interagir com jogos no PostgreSQL e na Blockchain")
    
    parser.add_argument("--get_novos_jogos", action="store_true", help="Buscar jogos não registrados no PostgreSQL")
    parser.add_argument("--registrar_jogo", type=int, help="Registrar um jogo específico na blockchain pelo ID")
    parser.add_argument("--monitorar", action="store_true", help="Iniciar o monitoramento contínuo de novos jogos")
    parser.add_argument("--listar_jogos_blockchain", action="store_true", help="Listar jogos cadastrados na blockchain")
    
    args = parser.parse_args()

    if args.get_novos_jogos:
        jogos = get_novos_jogos()
        print(jogos)

    elif args.registrar_jogo:
        jogos = get_novos_jogos()
        jogo = next((j for j in jogos if j["id"] == args.registrar_jogo), None)
        if jogo:
            registrar_jogo_na_blockchain(jogo)
            marcar_jogo_registrado(jogo["id"])
            print(f"Jogo {args.registrar_jogo} registrado na blockchain.")
        else:
            print(f"Jogo {args.registrar_jogo} não encontrado ou já registrado.")

    elif args.monitorar:
        monitorar_jogos()

    elif args.listar_jogos_blockchain:
        jogos = listar_jogos_blockchain()
        print(jogos)