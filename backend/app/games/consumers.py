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

def create_group_name(game_id: int) -> str:
    return f"game_{game_id}"


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

    @database_sync_to_async
    def set_channel_group_name(self, game: PongGame, group_name: str):
        game.channel_group_name = group_name
        game.save()

    async def connect(self):
        if "error" in self.scope:
            await self.handle_error(self.scope["error"])
            return

        await self.accept()
        self.is_connected = True

        game_id = self.scope["url_route"]["kwargs"].get("game_id")
        user = self.scope["user"]
        
        if not game_id:
            await self.handle_error("No game ID provided")
            return

        await self.initialize_game(game_id)
        await self.check_errors(user, game_id)
        await self.setup_player(user)
        await self.setup_channel_group()
        await self.notify_player()
        await self.notify_oponent()

    async def initialize_game(self, game_id):
        if game_id not in active_games:
            active_games[game_id] = Game()
            active_games[game_id].players_ready = [False, False]
            active_games[game_id].players_connected = [False, False]
        self.game = active_games[game_id]
        self.db_game = await database_sync_to_async(PongGame.objects.filter(id=game_id).first)()
    
    async def check_errors(self, user, game_id):
        if not self.game:
            await self.handle_error("Game not found")
            return
        if not await self.is_valid_player(user):
            await self.handle_error("You are not a player in this game")
            return
        if await self.game_has_winner(self.db_game):
            await self.handle_error("Game is finished")
            return

    async def handle_error(self, message):
        await self.accept()
        await self.send(text_data=json.dumps({"type": "error", "message": message}))
        await self.close()

    async def is_valid_player(self, user):
        return (await self.get_player1(self.db_game)) == user or (await self.get_player2(self.db_game)) == user

    async def setup_player(self, user):
        self.side = 0 if (await self.get_player1(self.db_game)) == user else 1
        self.game.players_connected[self.side] = True

    async def setup_channel_group(self):
        channel_group_name = await self.get_channel_group_name(self.db_game) or create_group_name(self.db_game.id)
        await self.set_channel_group_name(self.db_game, channel_group_name)
        await self.channel_layer.group_add(channel_group_name, self.channel_name)
        self.game_group_name = channel_group_name

    async def notify_player(self):
        await self.send(text_data=json.dumps({"type": "connection_established", "side": self.side}))
        other_side = 1 if self.side == 0 else 0
        other_player = await (self.get_player1(self.db_game) if other_side == 0 else self.get_player2(self.db_game))

        if self.game.players_connected[other_side]:
            await self.send(text_data=json.dumps({"type": "player_connected", "player": other_player.username, "side": other_side}))
            if self.game.players_ready[other_side]:
                await self.send(text_data=json.dumps({"type": "player_ready", "side": other_side}))

    async def notify_oponent(self):
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                "type": "player_status",
                "objects": {
                    "type": "player_connected",
                    "player": self.scope["user"].username,
                    "side": self.side
                }
            }
        )

    async def disconnect(self, close_code):
        self.is_connected = False
        game_id = self.scope["url_route"].get("game_id")

        if self.game_group_name and hasattr(self, 'side'):
            try:
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        "type": "player_status",
                        "objects": {
                            "type": "player_disconnected",
                            "side": self.side,
                        }
                    }
                )
            except Exception:
                pass

        if self.game_group_name:
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

        if hasattr(self, 'game') and self.game:
            await self.game.handle_disconnect()

        if hasattr(self, 'db_game') and self.db_game:
            if self.db_game.status == "in_progress":
                await self.game.handle_interruption()

        if game_id in active_games and self.db_game.status in ["completed", "interrupted"]:
            del active_games[game_id]

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get("type", "")

        if message_type == "player_ready":
            self.game.players_ready[self.side] = True
            await self.game.handle_ready(self)
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "player_status",
                    "objects": {
                        "type": "player_ready",
                        "side": self.side
                    }
                }
            )
            if all(self.game.players_ready):
                await self.game.startGame(self)
        elif message_type in ["keydown", "keyup"] and text_data_json.get("key") in ["w", "s"]:
            if self.db_game.status == "in_progress":
                await self.game.handle_keys(self.side, message_type, text_data_json["key"])

    async def state_update(self, event):
        if self.is_connected:
            try:
                await self.send(text_data=json.dumps(event.get("objects")))
            except Exception:
                pass

    async def player_status(self, event):
        if self.is_connected:
            try:
                await self.send(text_data=json.dumps(event.get("objects")))
            except Exception:
                pass

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