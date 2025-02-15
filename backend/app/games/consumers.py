import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .game import Game
from .models import PongGame
from channels.db import database_sync_to_async
from django.utils import timezone

"""

Game Consumer

"""

active_games = {}
game_timers = {}

def create_group_name(player_id: int, game_id: int) -> str:
    return f"{game_id}_{player_id}"

class GameConsumer(AsyncWebsocketConsumer):
    game_group_name = None
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    update_lock = asyncio.Lock()
    side: int = 0
    is_connected = False

    @database_sync_to_async
    def get_player1(self, game: PongGame):
        return game.player1

    @database_sync_to_async
    def get_player2(self, game: PongGame):
        return game.player2
    
    @database_sync_to_async
    def get_channel_group_name(self, game: PongGame):
        return game.channel_group_name
    
    @database_sync_to_async
    def game_has_winner(self, game: PongGame):
        return game.winner is not None

    async def connect(self):
        if "error" in self.scope:
            await self.accept()
            await self.send(text_data=json.dumps({"type": "error", "message": self.scope["error"]}))
            await self.close()
            return

        await self.accept()
        self.is_connected = True
        
        game_id = self.scope["url_route"]["kwargs"].get("game_id")
        if not game_id:
            await self.send(text_data=json.dumps({"type": "error", "message": "No game ID provided"}))
            await self.close()
            return

        if game_id not in active_games:
            active_games[game_id] = Game()
            game_timers[game_id] = asyncio.create_task(self.start_timeout_timer(game_id))
        self.game = active_games[game_id]

        db_game = await database_sync_to_async(PongGame.objects.filter(id=game_id).first)()
        if not db_game:
            await self.send(text_data=json.dumps({"type": "error", "message": "Game not found"}))
            await self.close()
            return

        user = self.scope["user"]
        if (await self.get_player1(db_game)) != user and (await self.get_player2(db_game)) != user:
            await self.send(text_data=json.dumps({"type": "error", "message": "You are not a player in this game"}))
            await self.close()
            return

        if await self.game_has_winner(db_game):
            await self.send(text_data=json.dumps({"type": "error", "message": "Game is finished"}))
            await self.close()
            return

        self.side = 0 if (await self.get_player1(db_game)) == user else 1
        channel_group_name = await self.get_channel_group_name(db_game)
        if not channel_group_name:
            db_game.channel_group_name = create_group_name(user.id, db_game.id)
            await self.channel_layer.group_add(db_game.channel_group_name, self.channel_name)
            await database_sync_to_async(db_game.save)()
        else:
            if game_id in game_timers:
                game_timers[game_id].cancel()
                del game_timers[game_id]
            await self.channel_layer.group_add(channel_group_name, self.channel_name)

        await self.channel_layer.group_send(
            db_game.channel_group_name,
            {"type": "state_update", "objects": {"type": "join", "player": user.username, "side": self.side}}
        )
        db_game.match_date = timezone.now()
        await database_sync_to_async(db_game.save)()

        self.db_game = db_game
        self.game_group_name = db_game.channel_group_name

    async def disconnect(self, close_code):
        self.is_connected = False
        game_id = self.scope["url_route"]["kwargs"].get("game_id")
        
        if self.game_group_name:
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        
        if hasattr(self, 'game') and self.game:
            await self.game.handle_disconnect()
        
        if hasattr(self, 'db_game') and self.db_game:
            if not self.db_game.winner and self.db_game.status == 'in_progress':
                self.db_game.status = 'interrupted'
                await database_sync_to_async(self.db_game.save)()
        
        if game_id and game_id in game_timers:
            game_timers[game_id].cancel()
            del game_timers[game_id]
        
        if game_id and game_id in active_games:
            if hasattr(self, 'db_game') and self.db_game and self.db_game.status in ["completed", "interrupted"]:
                del active_games[game_id]

    async def start_timeout_timer(self, game_id):
        try:
            await asyncio.sleep(10)
            
            if game_id in active_games:
                if hasattr(self, 'db_game'):
                    self.db_game.status = 'interrupted'
                    await database_sync_to_async(self.db_game.save)()
                
                if self.game_group_name and self.is_connected:
                    try:
                        await self.channel_layer.group_send(
                            self.game_group_name,
                            {"type": "state_update", "objects": {
                                "type": "error",
                                "message": "Game interrupted - second player did not connect in time"
                            }}
                        )
                    except Exception:
                        pass  # Ignore sending errors during shutdown
                
                del active_games[game_id]
                
                if self.is_connected:
                    await self.close()
                
        finally:
            if game_id in game_timers:
                del game_timers[game_id]

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get("type", "")

        if message_type == "start_game" and self.db_game.status == "not_started":
            await self.game.startGame(self)
        elif message_type == "keydown":
            key = text_data_json.get("key")
            if key in ["w", "s"]:
                async with self.update_lock:
                    self.game.paddles[self.side].moving = -0.02 if key == "w" else 0.02
        elif message_type == "keyup" and text_data_json.get("key") in ["w", "s"]:
            async with self.update_lock:
                self.game.paddles[self.side].moving = 0

    async def state_update(self, event):
        if self.is_connected:
            try:
                await self.send(text_data=json.dumps(event.get("objects")))
            except Exception:
                pass  # Ignore sending errors during shutdown

"""

Game Invitation Consumer

"""

class GameInvitationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"game_invitation_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def game_accepted(self, event):
        game_url = event['game_url']
        await self.send(text_data=json.dumps({
            'type': 'game_accepted',
            'game_url': game_url
        }))

    async def game_invited(self, event):
        invitation = event['invitation']
        await self.send(text_data=json.dumps({
            'type': 'game_invited',
            'invitation': invitation
        }))