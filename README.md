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

## Blockchain Module
This project implements a blockchain module to record and retrieve Pong tournament results, using a smart contract on the local Ethereum Ganache network for testing. The development and deployment of the smart contract are managed by the Truffle framework, which facilitates the creation, testing, and migration of smart contracts.

### Smart Contract (Solidity)
The smart contract, developed in Solidity, defines the fields to store game records.
It allows access and retrieval of information recorded on the Ethereum Ganache blockchain.
After deployment, the smart contract address on the Ganache network is saved in a shared folder between the Truffle and backend containers.
This address is used to interact with the contract and perform data recording and retrieval operations.

### Available Commands
The following make commands allow interaction with the blockchain module to monitor, retrieve, and manage game records.

1. Start Game Monitoring
#### make startmonitor
Starts monitoring games that have been completed or interrupted in the PostgreSQL database and saves them to the blockchain.

2. Stop Game Monitoring
#### make stopmonitor
Stops the game monitoring process, preventing new games from being automatically recorded in the blockchain.

3. Retrieve All Registered Games
#### make listallgames
Lists all games that have been recorded in the blockchain.

4. Manually Register New Games
#### make saveallnewgames
Retrieves and registers all new completed or interrupted games in the blockchain without requiring the startmonitor process to be active.

5. Retrieve Games by Player
#### make gamesbyplayers <player_id>
Retrieves all games in which a specific player has participated, using their player ID.

6. Retrieve Games by Tournament
#### make gamesbytournament <tournament_id>
Retrieves all games associated with a specific tournament, using the tournament ID.

#### Prerequisites
Before using these commands, ensure the following:
* Docker and Docker Compose are installed.
* The containers defined in docker-compose.yml are running.
* You have access to a terminal or shell.