import random
from app.games.models import PongGame

class MatchMaker:
    @staticmethod
    def create_matches(tournament):
        participants = list(tournament.participants.all())
        if len(participants) != 4:
            return

        random.shuffle(participants)

        tournament.semifinal_1_game1 = PongGame.objects.create(player1=participants[0], player2=participants[1], tournament=tournament)
        tournament.semifinal_1_game2 = PongGame.objects.create(player1=participants[2], player2=participants[3], tournament=tournament)
        tournament.final_game = PongGame.objects.create(player1=None, player2=None, tournament=tournament)
        tournament.save()
