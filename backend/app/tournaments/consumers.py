from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from app.tournaments.models import Tournament
import json

"""

Tournament Consumer

"""

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.tournament_id = self.scope["url_route"]["kwargs"].get("tournament_id")
        if not self.tournament_id:
            await self.close()
            return
        
        self.tournament_db = await self.get_tournament(self.tournament_id)
        
        is_participant = await self.is_user_participant(self.user, self.tournament_db)
        if not is_participant:
            await self.close()
            return

        is_ongoing = await self.is_tournament_ongoing(self.tournament_db)
        if not is_ongoing:
            await self.close()
            return

        self.room_name = self.tournament_id
        self.room_group_name = f"tournament_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        print(f"Connected to tournament room: {self.room_name}, group: {self.room_group_name}")

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'tournament_connected',
                'user': self.user.username
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Disconnected from tournament room: {self.room_name}, group: {self.room_group_name}")

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'tournament_disconnected',
                'user': self.user.username
            }
        )

    async def tournament_connected(self, event):
        user = event['user']
        await self.send(text_data=json.dumps({
            'message': f'{user} connected to the tournament.'
        }))

    async def tournament_disconnected(self, event):
        user = event['user']
        await self.send(text_data=json.dumps({
            'message': f'{user} disconnected from the tournament.'
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
    def is_tournament_full(self, tournament):
        return tournament.participants.count() >= tournament.participants_amount
