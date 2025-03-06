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

- Users can be created using the 'make users' management command in the backend container.
- Users can also be created manually through the Django Admin interface. Superuser needs to be created first with the `createsuperuser` management command.
- Users can also be created through the frontend interface.
	- Using an email and password. (requires the email credentials to be set in the `.env` file).
	- Using the 42 OAuth2 login (requires the 42 OAuth2 credentials to be setin the `.env` file).

## Modulo Blockchain
This project implements a blockchain module to record and retrieve Pong tournament results, using a smart contract on the local Ethereum Ganache network for testing. The development and deployment of the smart contract are managed by the Truffle framework, which facilitates the creation, testing, and migration of smart contracts.

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
  
#### list_all_games.py:
* Retrieves all game records stored in the smart contract.
  
#### get_game_by_player.py:
* Retrieves game records for a specific player, filtering by player ID.
  
#### get_game_by_tournament.py:
* Retrieves game records for a specific tournament, filtering by tournament ID.


#### Data Example
gameId  id      channelGroupName        datePlayed            scorePlayer1  scorePlayer2  matchDate             status          player1Id       player2Id       winnerId        tournamentId
1       1       1_2                     2025-03-03 13:25:14   0             0             2025-03-03 13:25:14   interrupted     2               3               0               0
2       2       2_3                     2025-03-03 13:25:38   0             0             2025-03-03 13:25:38   interrupted     3               2               0               0


### Blockchain Test Procedure
#### Environment Setup:
* Compile and migrate the contracts: make
#### System Interaction:
* Access the website and play some games and tournaments.
#### Data Persistence Test (Blockchain):
* Stop the PostgreSQL database: docker stop transcendence_db
* Run the blockchain query commands to check previous game records:
- make lag (list all games)
- make dbp <player id> (list games by player ID)
- make dbt <tournament id> (list games by tournament ID)
* Expected Result: The game records created before the database shutdown should be returned.
#### New Data Registration Test:
* Restart PostgreSQL: docker start transcendence_db
* Play new games on the website.
* Run the blockchain query commands again to check for new records:
- make lag (list all games)
- make dbp <player id> (list games by player ID)
- make dbt <tournament id> (list games by tournament ID)
* Expected Result: The new games played after the database reactivation should be included in the query results.
