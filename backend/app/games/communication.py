def truncate(n, decimals=0) -> float:
    multiplier = 10 ** decimals
    return int(n * multiplier) / multiplier
    
class GameCommunication:
    def __init__(self, game_instance):
        self.game = game_instance
        self.socket = game_instance.socket

    async def send_game_state(self):
        await self.socket.channel_layer.group_send(
            self.socket.db_game.channel_group_name,
            {
                "type": "state_update",
                "objects": {
                    "type": "gameState",
                    "ball": self._get_ball_state(),
                    "paddles": self._get_paddles_state()
                }
            }
        )

    async def send_score_update(self):
        await self.socket.channel_layer.group_send(
            self.socket.db_game.channel_group_name,
            {
                "type": "state_update",
                "objects": {
                    "type": "score",
                    "score": self.game.score
                }
            }
        )

    async def send_game_over(self):
        await self.socket.channel_layer.group_send(
            self.socket.db_game.channel_group_name,
            {
                "type": "state_update",
                "objects": {
                    "type": "endGame",
                    "score": self.game.score
                }
            }
        )

        tournament_id = await self.game.db.get_tournament_id()
        if tournament_id:
            await self.socket.channel_layer.group_send(
                f"tournament_{tournament_id}",
                {
                    "type": "endGame",
                    "game_id": self.socket.db_game.id,
                }
            )

    async def send_disconnect_message(self):
        await self.socket.channel_layer.group_send(
            self.socket.db_game.channel_group_name,
            {
                "type": "state_update",
                "objects": {
                    "type": "endGame",
                    "message": "User disconnected"
                }
            }
        )

    def _get_ball_state(self):
        return {
            "x": truncate(self.game.ball.x, 2),
            "y": truncate(self.game.ball.y, 2),
            "speed_x": truncate(self.game.ball.speed_x, 2),
            "speed_y": truncate(self.game.ball.speed_y, 2),
        }

    def _get_paddles_state(self):
        return [
            {
                "y": truncate(paddle.y, 2),
            }
            for paddle in self.game.paddles
        ]

