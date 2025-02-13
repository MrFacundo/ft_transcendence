from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from app.tournaments.models import Tournament
from app.games.models import PongGame
from app.tournaments.serializers import TournamentSerializer
from django.utils import timezone
import json

class TournamentConsumer(AsyncWebsocketConsumer):
    start_messages = {'semifinal_1': set(), 'semifinal_2': set(), 'final': set()}

    async def connect(self):
        self.user = self.scope["user"]
        self.tournament_id = self.scope["url_route"]["kwargs"].get("tournament_id")
        if not (self.user.is_authenticated and self.tournament_id):
            return await self.close()

        self.tournament_db = await self.get_tournament()
        self.tournament_participants = await self.get_tournament_participants()

        if not (await self.is_user_participant() and await self.is_tournament_ongoing()):
            return await self.close()

        self.room_group_name = f"tournament_{self.tournament_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(self.room_group_name, {"type": "tournament_connected", "user": self.user.id})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(self.room_group_name, {"type": "tournament_disconnected", "user": self.user.username})

    async def receive(self, text_data):
        if json.loads(text_data).get("type") == "start":
            await self.handle_start_message()

    async def handle_start_message(self):
        game_stage = await self.get_game_stage()
        if not game_stage:
            return
        print("message received from", self.user.id)
        print("game stage:", game_stage)
        
        self.start_messages[game_stage].add(self.user.id)
        participants = self.get_game_participants(game_stage)
        
        if len(participants) == 2 and self.start_messages[game_stage] == set(participants):
            game_id = await self.get_game_id(game_stage)
            for user_id in participants:
                await self.channel_layer.group_send(self.room_group_name, {"type": "start_game", "user_id": user_id, "game_id": game_id})
            self.start_messages[game_stage].clear()

    async def endGame(self, event):
        await self.update_final_game(event)
        await self.send(text_data=json.dumps({"type": "game_over", "game_id": event["game_id"], "tournament": await self.get_tournament_data()}))

    async def start_game(self, event):
        if event["user_id"] == self.user.id:
            await self.send(text_data=json.dumps({"type": "start_game", "game_url": f"/game/{event['game_id']}", "participant_id": event["user_id"]}))

    async def tournament_connected(self, event):
        await self.send(text_data=json.dumps({"type": "join", "tournament": await self.get_tournament_data(), "participant_id": event["user"]}))

    async def tournament_disconnected(self, event):
        await self.send(text_data=json.dumps({"message": f"{event['user']} disconnected from the tournament."}))

    @database_sync_to_async
    def get_tournament(self):
        return Tournament.objects.get(id=self.tournament_id)

    @database_sync_to_async
    def get_tournament_participants(self):
        return list(self.tournament_db.participants.all())

    @database_sync_to_async
    def is_user_participant(self):
        return self.tournament_db.participants.filter(id=self.user.id).exists()

    @database_sync_to_async
    def is_tournament_ongoing(self):
        return self.tournament_db.end_date is None

    @database_sync_to_async
    def get_tournament_data(self):
        return TournamentSerializer(Tournament.objects.get(id=self.tournament_id)).data

    def get_game_participants(self, game):
        game_instance = getattr(self.tournament_db, f"{game}_game", None)
        if game_instance:
            player1_id = game_instance.player1.id if game_instance.player1 else None
            player2_id = game_instance.player2.id if game_instance.player2 else None
            return [player1_id, player2_id]
        return []

    @database_sync_to_async
    def get_game_id(self, game_type):
        game_instance = getattr(self.tournament_db, f"{game_type}_game", None)
        return game_instance.id if game_instance else None

    async def get_game_stage(self):
        self.tournament_db = await self.get_tournament()
        if self.user.id in self.get_game_participants("final"):
            return "final"
        for stage in ["semifinal_1", "semifinal_2"]:
            if self.user.id in self.get_game_participants(stage):
                return stage
        return None

    @database_sync_to_async
    def update_final_game(self, event):
        tournament = Tournament.objects.get(id=self.tournament_id)
        final_game = tournament.final_game

        if event["game_id"] == tournament.semifinal_1_game.id:
            final_game.player1 = tournament.semifinal_1_game.winner
        elif event["game_id"] == tournament.semifinal_2_game.id:
            final_game.player2 = tournament.semifinal_2_game.winner
        elif event["game_id"] == tournament.final_game.id:
            tournament.end_date = timezone.now()
            tournament.save()
        
        final_game.save()