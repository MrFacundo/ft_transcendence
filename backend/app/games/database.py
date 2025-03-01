from channels.db import database_sync_to_async

class GameDatabase:
    def __init__(self, game_instance):
        self.game = game_instance
        self.socket = game_instance.socket

    @database_sync_to_async
    def set_game_status(self, status: str):
        self.socket.db_game.status = status
        self.socket.db_game.save()

    @database_sync_to_async
    def update_stats(self, winner: int):
        player1 = self.socket.db_game.player1
        player2 = self.socket.db_game.player2
        
        player1_stats = player1.game_stats
        player2_stats = player2.game_stats
        
        player1_stats.total_matches += 1
        player2_stats.total_matches += 1
        
        if winner == 0:
            player1_stats.wins += 1
            player2_stats.losses += 1
        else:
            player2_stats.wins += 1
            player1_stats.losses += 1
            
        player1_stats.save()
        player2_stats.save()

    @database_sync_to_async
    def set_winner(self, winner: int):
        game = self.socket.db_game
        game.winner = game.player1 if winner == 0 else game.player2
        game.save()

    @database_sync_to_async
    def set_score(self):
        game = self.socket.db_game
        game.score_player1 = self.game.score[0]
        game.score_player2 = self.game.score[1]
        game.save()

    @database_sync_to_async
    def get_tournament_id(self):
        return self.socket.db_game.tournament.id if self.socket.db_game.tournament else None