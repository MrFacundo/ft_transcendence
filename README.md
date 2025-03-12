
****<h1 align="center">
	📖 42_Transcendence
</h1>

<h2 align="center">
	42 Lisbon Cursus - Final Project
</h2>

<p align="center">
	<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/MrFacundo/ft_transcendence?color=lightblue" />
	<img alt="GitHub top language" src="https://img.shields.io/github/languages/top/MrFacundo/ft_transcendence?color=blue" />
	<img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/MrFacundo/ft_transcendence?color=green" />
</p>


## Summary

A full-stack web application that allows users to play a multiplayer game of Pong, and participate in tournaments.

## Tools

### Containerization
- Docker, Docker Compose

### Backend
- Django
- PostgreSQL
- Redis

### Frontend
- Webpack
- JavaScript
- HTML
- CSS
- Bootstrap

### Profiling and Documentation
- Silk Profiling
- Redoc
- Swagger
  
### Blockchain
- Truffle
- Ganache
- Solidity

## Subject
[📗️](en.subject.pdf) 

## Features
- Django as backend Framework.
- Standard user management, authentication, users across tournaments.
- Remote authentication using 42's OAuth2.
- Two-Factor Authentication (2FA) and JWT
- Remote (Online) players
- AI opponents
- Blockchain - The score of each game is recorded in a blockchain.
- PostgreSQL as database.
- Bootstrap as a front-end tooltik
- Browser Compatibility: Chrome, Firefox
- 
## Our implementation

#### Frontend:

- Features a Single Page Application (SPA) that uses a class-based system to manage navigation and rendering of pages and components.
- It communicates with the backend using RESTful APIs and WebSockets, allowing for real-time updates.
- App, pages and components have their own state management. State is updated on WebSocket events, API calls, and user interactions.
- Using the Observer pattern, pages and components can subscribe to state changes and re-render when necessary.

#### Backend:

- Django REST Framework was used to build a backend API, providing endpoints for the frontend to interact with.
- Django Channels was used for WebSocket communication, allowing for real-time updates.
- Simple JWT was used for authentication, and a custom OAuth2 backend was implemented to handle 42's OAuth2.

## Setup

### Prerequisites

- Ensure ports 8080 and 8000 are free on your machine.
- Docker and Docker Compose should be installed.
  
Copy the example environment from `.env.example` to `.env`. If needed, update credentials such as email client and 42's OAuth2.

## Running the Application

The following commands are available in the Makefile:

## Running the Application

The following commands are available in the Makefile:

| Command                          | Description                                                                 |
|----------------------------------|-----------------------------------------------------------------------------|
| `up`, `down`, `build`, `clean`   | Perform the respective Docker Compose commands.                             |
| `backend`, `frontend`, `db`, `cache`, `blockchain`, `waf` | Runs the respective service in interactive mode. |
| `create_users`                   | Creates a set of users on the database, using the Django management command. |
| `frontend-build`                 | Builds the frontend using Webpack.                                              |
| `frontend-stop`                  | Stops the frontend container.                                               |
| `frontend-dev`                   | Stops the frontend container and starts it in development mode.             |
| `frontend-prod`                  | Stops the frontend container and starts it in production mode.              |
| `blockchain_startmonitor`        | Starts monitoring games that have been completed or interrupted in the PostgreSQL database and saves them to the blockchain. |
| `blockchain_stopmonitor`         | Stops the game monitoring process, preventing new games from being automatically recorded in the blockchain. |
| `blockchain_listallgames`        | Lists all games that have been recorded in the blockchain.                  |
| `blockchain_gamesbyplayers <player_id>` | Retrieves all games in which a specific player has participated, using their player ID. |
| `blockchain_gamesbytournament <tournament_id>` | Retrieves all games associated with a specific tournament, using the tournament ID. |

### Accessing the Application

- Frontend: http://localhost:8080
- Django Admin: http://localhost:8000/admin/
- Silk Profiling: http://localhost:8000/silk/
### Accessing the Application

- Frontend: http://localhost:8080
- Django Admin: http://localhost:8000/admin/
- Silk Profiling: http://localhost:8000/silk/
