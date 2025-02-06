import asyncio
from typing import Union
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import PongGame
from channels.db import database_sync_to_async

def truncate(n, decimals=0) -> float:
    multiplier = 10 ** decimals
    return int(n * multiplier) / multiplier

class Hitbox :
    def __init__(self, x, y, width, height):
        self.x: float = x
        self.y: float = y
        self.width: float = width
        self.height: float = height
        self.disconnected = False

    def printState(self, name: str):
        print(f"{name}: {self.x}, {self.y}, {self.width}, {self.height}")

    def collides(self, other: "Hitbox") -> bool:
        # check if the other hitbox is to the left of this hitbox
        if self.x > other.x and self.x < other.x + other.width:
            print("Collision on x left")
            # check if the other hitbox is above this hitbox
            if self.y > other.y and self.y < other.y + other.height:
                return True
            # check if the other hitbox is below this hitbox
            if self.y + self.height > other.y and self.y + self.height < other.y + other.height:
                return True
        # check if the other hitbox is to the right of this hitbox
        if self.x + self.width > other.x and self.x + self.width < other.x + other.width:
            print("Collision on x right")
            # check if the other hitbox is above this hitbox
            if self.y > other.y and self.y < other.y + other.height:
                return True
            # check if the other hitbox is below this hitbox
            if self.y + self.height > other.y and self.y + self.height < other.y + other.height:
                return True
        return False
    
class Paddle (Hitbox):
    def __init__(self, x):
        super().__init__(x, 0.5 - 0.075, 0.02, 0.25)
        self.moving: float = 0
    pass

    def update(self):
        self.y = truncate(self.y + self.moving, 2)
        if self.y < 0:
            self.y = 0
        elif self.y + self.height > 1:
            self.y = 1 - self.height


class Ball (Hitbox):
    def __init__(self, x, y):
        super().__init__(x, y, 0.02, 0.02)
        self.speed_x = 0.03
        self.speed_y = 0
    pass

    def update(self):
        self.x = truncate(self.x + self.speed_x, 2)
        self.y = truncate(self.y + self.speed_y, 2)
    pass

class Game :
    def __init__(self):
        self.ball = Ball(0.5 - 0.01, 0.5 - 0.01)
        self.paddles = list([
            Paddle(0),
            Paddle(1 - 0.02)
        ])
        self.socket: Union[AsyncWebsocketConsumer, None] = None
        self.score = [0, 0]
        self.disconnected = False

    @database_sync_to_async
    def set_game_active(self):
        self.socket.db_game.status = "in_progress"
        self.socket.db_game.save()

    def reset(self):
        self.ball = Ball(0.5 - 0.01, 0.5 - 0.01)
        self.paddles[0].y = 0.5 - 0.075
        self.paddles[1].y = 0.5 - 0.075

    @database_sync_to_async
    def setStats(self, winner: int):
        # Get the players
        player1 = self.socket.db_game.player1
        player2 = self.socket.db_game.player2

        # Update GameStats for both players
        player1_stats = player1.game_stats  # Direct access via related name
        player2_stats = player2.game_stats

        # Increment total matches for both players
        player1_stats.total_matches += 1
        player2_stats.total_matches += 1

        # Update wins and losses
        if winner == 0:  # Player 1 wins
            player1_stats.wins += 1
            player2_stats.losses += 1
        else:  # Player 2 wins
            player2_stats.wins += 1
            player1_stats.losses += 1

        # Save the updated stats
        player1_stats.save()
        player2_stats.save()

    @database_sync_to_async
    def setWinner(self, winner: int):
        self.socket.db_game.winner = self.socket.db_game.player1 if winner == 0 else self.socket.db_game.player2
        self.socket.db_game.score_player1 = self.score[0]
        self.socket.db_game.score_player2 = self.score[1]
        self.socket.db_game.status = "completed"
        self.socket.db_game.save()

    async def handle_disconnect(self):
        self.disconnected = True      
    
    async def game_loop(self):
        if (self.socket is None):
            return
        counter = 0
        while not self.disconnected:
            counter += 1

            if (counter % 10 == 0):
                await self.socket.channel_layer.group_send(self.socket.db_game.channel_group_name, {
                    "type": "state_update",
                    "objects": {
                        "type": "score",
                        "score": self.score
                    }
                })

            if (self.score[0] >= 5 or self.score[1] >= 5):
                print("Game Over")           
                await self.socket.channel_layer.group_send(self.socket.db_game.channel_group_name, {
                    "type": "state_update",
                    "objects": {
                        "type": "endGame",
                        "score": self.score
                    }
                })
                await self.setStats(0 if self.score[0] >= 5 else 1)
                await self.setWinner(0 if self.score[0] >= 5 else 1)
                return            
            # Update the ball's position
            self.ball.update()
            # Update the paddles' positions
            for paddle in self.paddles:
                paddle.update()
            await asyncio.sleep(.1)
            
            # Check if the ball collides with the top or bottom of the screen
            if self.ball.y <= 0 or self.ball.y + self.ball.height >= 1:
                self.ball.speed_y *= -1

            # Check if the ball collides with the paddles
            if self.ball.collides(self.paddles[0]) or self.ball.collides(self.paddles[1]):
                print("Collided")
                self.ball.speed_x *= -1

            # Check if the ball got past left paddle
            if self.ball.x < self.paddles[0].x:
                self.reset()
                self.score[1] += 1
                await self.socket.channel_layer.group_send(self.socket.db_game.channel_group_name, {
                    "type": "state_update",
                    "objects": {
                        "type": "score",
                        "score": self.score
                    }
                })
                print("score: ", self.score)
                pass

            # Check if the ball got past right paddle
            if self.ball.x + self.ball.width > self.paddles[1].x + self.paddles[1].width:
                self.reset()
                self.score[0] += 1
                await self.socket.channel_layer.group_send(self.socket.db_game.channel_group_name, {
                    "type": "state_update",
                    "objects": {
                        "type": "score",
                        "score": self.score
                    }
                })
                print("score: ", self.score)
                pass

            await self.socket.channel_layer.group_send(self.socket.db_game.channel_group_name, {
                "type": "state_update",
                "objects": {
                    "type": "gameState",
                    "ball": {
                        "x": truncate(self.ball.x, 2),
                        "y": truncate(self.ball.y, 2),
                        "width": truncate(self.ball.width, 2),
                        "height": truncate(self.ball.height, 2),
                        "speed_x": truncate(self.ball.speed_x, 2),
                        "speed_y": truncate(self.ball.speed_y, 2)
                    },
                    "paddles": [
                        {
                            "x": truncate(self.paddles[0].x, 2),
                            "y": truncate(self.paddles[0].y, 2),
                            "width": truncate(self.paddles[0].width, 2),
                            "height": truncate(self.paddles[0].height, 2)
                        },
                        {
                            "x": truncate(self.paddles[1].x, 2),
                            "y": truncate(self.paddles[1].y, 2),
                            "width": truncate(self.paddles[1].width, 2),
                            "height": truncate(self.paddles[1].height, 2)
                        }
                    ]
                }
            })
            # await asyncio.sleep(0.1)
        await self.socket.channel_layer.group_send(self.socket.db_game.channel_group_name, {
            "type": "state_update",
            "objects": {
                "type": "endGame",
                "message": "User disconnected"
            }
        })

    async def startGame(self, socket: AsyncWebsocketConsumer):
        self.socket = socket
        # set db game state to active
        await self.set_game_active()
        # send start game message to group
        await socket.channel_layer.group_send(socket.db_game.channel_group_name, {
            "type": "state_update",
            "objects": {
                "type": "startGame"
            }
        })

        # start game loop
        asyncio.create_task(self.game_loop())
        pass
    pass