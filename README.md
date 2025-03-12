# ft_transcendence

## Prerequisites

- Ensure ports 8080 and 8000 are free on your machine.
- Docker and Docker Compose should be installed.

### Setup

Copy the example environment from `.env.example` to `.env`. If needed, update credentials such as email client and 42's OAuth2.

### Available Commands

The following commands are available in the Makefile:

`up`, `down`, `build`, `clean`

Perform the respective Docker Compose commands.

`backend`, `frontend`, `db`, `cache`, `blockchain`, `waf`

Runs the respective service in interactive mode.

`create_users`

Creates a set of users on the database, using the Django management command.

`blockchain_startmonitor`

Starts monitoring games that have been completed or interrupted in the PostgreSQL database and saves them to the blockchain.

`blockchain_stopmonitor`

Stops the game monitoring process, preventing new games from being automatically recorded in the blockchain.

`blockchain_listallgames`

Lists all games that have been recorded in the blockchain.

`blockchain_gamesbyplayers <player_id>`

Retrieves all games in which a specific player has participated, using their player ID.

`blockchain_gamesbytournament <tournament_id>`

Retrieves all games associated with a specific tournament, using the tournament ID.

### Accessing the Application

- Frontend: http://localhost:8080
- Django Admin: http://localhost:8000/admin/
- Silk Profiling: http://localhost:8000/silk/
