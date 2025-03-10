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