from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from app.tournaments.models import Tournament
from app.games.models import PongGame
from app.tournaments.serializers import TournamentSerializer
from django.utils import timezone
import json

class TournamentConsumer(AsyncWebsocketConsumer):
    start_messages = {
        'semifinal_1': set(),
        'semifinal_2': set(),
        'final': set()
    }

    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            return await self.close()

        self.tournament_id = self.scope["url_route"]["kwargs"].get("tournament_id")
        if not self.tournament_id:
            return await self.close()

        self.tournament_db = await self.get_tournament(self.tournament_id)
        if not await self.is_user_participant(self.user, self.tournament_db) or not await self.is_tournament_ongoing(self.tournament_db):
            return await self.close()

        self.room_group_name = f"tournament_{self.tournament_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'tournament_connected',
            'user': self.user.id
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'tournament_disconnected',
            'user': self.user.username
        })

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get("type") == "start":
            await self.handle_start_message()

    async def handle_start_message(self):
        game_stage = await self.get_game_stage()
        if not game_stage:
            return
        print("message received from ", self.user.id)
        print("game stage: ", game_stage)
        self.start_messages[game_stage].add(self.user.id)
        participants = await self.get_game_participants(game_stage)

        if participants.count() == 2 and self.start_messages[game_stage] == set(participants):
            game_id = await self.get_game_id(self.tournament_db, game_stage)
            for user_id in participants:
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "start_game",
                    "user_id": user_id,
                    "game_id": game_id
                })
            self.start_messages[game_stage].clear()

    async def endGame(self, event): #this comes from the game consumer
        await self.update_final_game(event)
        tournament_data = await self.get_tournament_data(self.tournament_id)
        await self.send(text_data=json.dumps({
            "type": "game_over",
            "game_id": event["game_id"],
            "tournament": tournament_data,
        }))

    async def start_game(self, event):
        if event["user_id"] == self.user.id:
            await self.send(text_data=json.dumps({
                "type": "start_game",
                "game_url": f"/game/{event['game_id']}",
                "participant_id": event["user_id"]
            }))

    async def tournament_connected(self, event):
        tournament_data = await self.get_tournament_data(self.tournament_id)
        await self.send(text_data=json.dumps({
            'type': 'join',
            'tournament': tournament_data,
            'participant_id': event['user']
        }))

    async def tournament_disconnected(self, event):
        await self.send(text_data=json.dumps({
            'message': f'{event["user"]} disconnected from the tournament.'
        }))

    @database_sync_to_async
    def get_tournament(self, tournament_id):
        return Tournament.objects.get(id=tournament_id)

    @database_sync_to_async
    def is_user_participant(self, user, tournament):
        return tournament.participants.filter(id=user.id).exists()

    @database_sync_to_async
    def is_tournament_ongoing(self, tournament):
        return tournament.end_date is None

    @database_sync_to_async
    def get_tournament_data(self, tournament_id):
        tournament = Tournament.objects.get(id=tournament_id)
        return TournamentSerializer(tournament).data

    @database_sync_to_async
    def get_game_participants(self, game):
        game_map = {
            'semifinal_1': self.tournament_db.semifinal_1_game,
            'semifinal_2': self.tournament_db.semifinal_2_game,
            'final': self.tournament_db.final_game
        }
        game_instance = game_map.get(game)
        if not game_instance:
            return []
        return [game_instance.player1.id, game_instance.player2.id]

    @database_sync_to_async
    def get_game_id(self, tournament, game_type):
        game_map = {
            'semifinal_1': tournament.semifinal_1_game,
            'semifinal_2': tournament.semifinal_2_game,
            'final': tournament.final_game
        }
        game_instance = game_map.get(game_type)
        if game_type == 'final' and not game_instance:
            game_instance = PongGame.objects.create()
            tournament.final_game = game_instance
            tournament.save()
        return game_instance.id if game_instance else None

    async def get_game_stage(self):
        if self.user.id in await self.get_game_participants('semifinal_1'):
            return 'semifinal_1'
        elif self.user.id in await self.get_game_participants('semifinal_2'):
            return 'semifinal_2'
        elif self.user.id in await self.get_game_participants('final'):
            return 'final'
        return None
    
    @database_sync_to_async
    def update_final_game(self, event):
        final_game = self.tournament_db.final_game
        if (event["game_id"] == self.tournament_db.semifinal_1_game.id):
            final_game.player1 = self.tournament_db.semifinal_1_game.winner
        elif (event["game_id"] == self.tournament_db.semifinal_2_game.id):
            final_game.player2 = self.tournament_db.semifinal_2_game.winner
        elif (event["game_id"] == self.tournament_db.final_game.id):
            self.tournament_db.end_date = timezone.now()