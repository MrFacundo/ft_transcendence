import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .physics import Ball, Paddle
from .database import GameDatabase
from .communication import GameCommunication

class Game:
    def __init__(self):
        self.ball = Ball(0.5 - 0.01, 0.5 - 0.01)
        self.paddles = [Paddle(0), Paddle(1 - 0.02)]
        self.socket: AsyncWebsocketConsumer | None = None
        self.score = [0, 0]
        self.disconnected = False
        self.db = None
        self.comm = None
        self.players_ready = [False, False]
        self.players_connected = [False, False]

    def reset(self):
        self.ball = Ball(0.5 - 0.01, 0.5 - 0.01)
        self.paddles[0].y = 0.5 - 0.075
        self.paddles[1].y = 0.5 - 0.075

    async def handle_disconnect(self):
        if hasattr(self.socket, 'side'):
            side = self.socket.side
            self.players_connected[side] = False
            self.disconnected = True

    async def handle_ready(self, socket: AsyncWebsocketConsumer):
        self.socket = socket
        self.comm = GameCommunication(self)
        self.db = GameDatabase(self)
        await self.db.set_game_status("in_progress")

    async def handle_interruption(self):
        status = await self.db.get_status()
        if status != "in_progress":
            return
        await self.db.set_score()
        winner = 0 if self.score[0] > self.score[1] else 1
        await self.db.update_stats(winner)
        await self.db.set_winner(winner)
        await self.db.set_game_status("interrupted")
        await self.comm.send_game_over()
        self.players_ready = [False, False]

    async def handle_keys(self, side, message_type, key):
        async with self.socket.update_lock:
            if message_type == "keydown":
                self.paddles[side].moving = -0.02 if key == "w" else 0.02
            elif message_type == "keyup":
                self.paddles[side].moving = 0

    async def game_loop(self):
        if not self.socket:
            return

        counter = 0
        while not self.disconnected:
            counter += 1

            if counter % 10 == 0:
                await self.comm.send_score_update()

            if self.score[0] >= 3 or self.score[1] >= 3:
                winner = 0 if self.score[0] >= 3 else 1
                await self.db.set_score()
                await self.db.update_stats(winner)
                await self.db.set_winner(winner)
                await self.db.set_game_status("completed")
                await self.comm.send_game_over()
                return

            self._update_game_state()
            await self._handle_collisions()
            await self._check_scoring()
            await self.comm.send_game_state()
            await asyncio.sleep(0.1)

        await self.comm.send_disconnect_message()

    def _update_game_state(self):
        self.ball.update()
        for paddle in self.paddles:
            paddle.update()

    async def _handle_collisions(self):
        for paddle in self.paddles:
            if self.ball.collides(paddle):
                self.ball.calculate_angle(paddle)

    async def _check_scoring(self):
        if self.ball.x < self.paddles[0].x:
            self.reset()
            self.score[1] += 1
            await self.comm.send_score_update()

        if self.ball.x + self.ball.width > self.paddles[1].x + self.paddles[1].width:
            self.reset()
            self.score[0] += 1
            await self.comm.send_score_update()

    async def startGame(self, socket: AsyncWebsocketConsumer):
        await self.db.set_game_status("in_progress")
        await self.comm.send_game_state()
        asyncio.create_task(self.game_loop())