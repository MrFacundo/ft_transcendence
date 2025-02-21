import json
from web3 import Web3

# URL do Ganache (ou outro nó Ethereum)
ganache_url = "http://ganache_blockchain:8545"
web3 = Web3(Web3.HTTPProvider(ganache_url))

# Verifique se a conexão foi bem-sucedida
if not web3.is_connected():
    print("Falha ao conectar à rede Ethereum")
    exit()

# Ler o endereço do contrato a partir do arquivo JSON
with open('/usr/src/app/deployedAddress.json') as f:
    data = json.load(f)
    contract_address = data['address']

# ABI do contrato (substitua pela ABI real do contrato)
contract_abi = [
    {
        "constant": True,
        "inputs": [],
        "name": "admin",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [
            {
                "name": "_gameId",
                "type": "uint256"
            }
        ],
        "name": "getGame",
        "outputs": [
            {
                "components": [
                    {
                        "name": "gameId",
                        "type": "uint256"
                    },
                    {
                        "name": "channelGroupName",
                        "type": "string"
                    },
                    {
                        "name": "datePlayed",
                        "type": "uint256"
                    },
                    {
                        "name": "scorePlayer1",
                        "type": "uint256"
                    },
                    {
                        "name": "scorePlayer2",
                        "type": "uint256"
                    },
                    {
                        "name": "matchDate",
                        "type": "uint256"
                    },
                    {
                        "name": "status",
                        "type": "string"
                    },
                    {
                        "name": "player1Id",
                        "type": "uint256"
                    },
                    {
                        "name": "player2Id",
                        "type": "uint256"
                    },
                    {
                        "name": "winnerId",
                        "type": "uint256"
                    },
                    {
                        "name": "tournamentId",
                        "type": "uint256"
                    }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    }
]

# Conecte-se ao contrato
contract = web3.eth.contract(address=contract_address, abi=contract_abi)

# Função para obter os dados do contrato
def get_game_data(game_id):
    game = contract.functions.getGame(game_id).call()
    return {
        "gameId": game[0],
        "channelGroupName": game[1],
        "datePlayed": game[2],
        "scorePlayer1": game[3],
        "scorePlayer2": game[4],
        "matchDate": game[5],
        "status": game[6],
        "player1Id": game[7],
        "player2Id": game[8],
        "winnerId": game[9],
        "tournamentId": game[10]
    }