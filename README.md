# ft_transcendence

## Prerequisites

- Ensure ports 8080 and 8000 are free on your machine.
- Docker and Docker Compose should be installed.

## Setup

1. Copy the example environment variables file:
```sh
   cp .env.example .env
```
2. If needed, update the email and 42's OAuth2 credentials in the `.env` file.


## Running the Project
To start the project, run:

```sh
	docker-compose up --build
```
Check the Makefile for more commands.

## Accessing the Application

- Frontend: http://localhost:8080
- Django Admin: http://localhost:8000/admin/
- Silk Profiling: http://localhost:8000/silk/

## User creation

- Users can be created using the `python manage.py create_users` management command in the backend container.
- Users can also be created manually through the Django Admin interface. Superuser needs to be created first with the `createsuperuser` management command.
- Users can also be created through the frontend interface.
	- Using an email and password. (requires the email credentials to be set in the `.env` file).
	- Using the 42 OAuth2 login (requires the 42 OAuth2 credentials to be setin the `.env` file).

## Modulo Blockchain
This project implements a blockchain module to record and retrieve Pong tournament results, using a smart contract on the local Ethereum Ganache network for testing.

### Smart Contract (Solidity)

The smart contract, developed in Solidity, defines the fields to store game records.
It allows access and retrieval of information recorded on the Ethereum Ganache blockchain.
After deployment, the smart contract address on the Ganache network is saved in a shared folder between the Truffle and backend containers.
This address is used to interact with the contract and perform data recording and retrieval operations.

### Backend (Python)

The app/scripts folder in the backend contains the following Python files:

#### Monitoring_push_to_blockchain.py:
* Monitors the games_ponggame table in PostgreSQL for new records.
* Sends the data to the smart contract on the blockchain.
* Note: Currently, the routine captures records with "interrupted" and "completed" status. In the final version, it should filter only records with "completed" status.
#### list_all_games.py:
* Retrieves all game records stored in the smart contract.
#### get_game_by_player.py:
* Retrieves game records for a specific player, filtering by player ID.
#### get_game_by_tournament.py:
* Retrieves game records for a specific tournament, filtering by tournament ID.

### Aliases (Command Facilitators)

To simplify interaction with the scripts, the following aliases have been created, which can be activated by running the setup_aliases.sh script:

* lag (list all games): Lists all games recorded on the blockchain.
* gbp (game by player) <player_ID>: Lists games for a specific player. Example: gbp 3.
* gbt (game by tournament) <tournament_ID>: Lists games for a specific tournament. Example: gbt 2.
Data Structure (games_ponggame Table)

The games_ponggame table in PostgreSQL has the following fields:
* gameId
* id
* channelGroupName
* datePlayed
* scorePlayer1
* scorePlayer2
* matchDate
* status
* player1Id
* player2Id
* winnerId
* tournamentId

#### Data Example
gameId  id      channelGroupName        datePlayed            scorePlayer1  scorePlayer2  matchDate             status          player1Id       player2Id       winnerId        tournamentId
1       1       1_2                     2025-03-03 13:25:14   0             0             2025-03-03 13:25:14   interrupted     2               3               0               0
2       2       2_3                     2025-03-03 13:25:38   0             0             2025-03-03 13:25:38   interrupted     3               2               0               0