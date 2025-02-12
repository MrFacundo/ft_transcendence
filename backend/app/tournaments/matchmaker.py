import random
from app.games.models import PongGame

class MatchMaker:
    @staticmethod
    def create_matches(tournament):
        participants = list(tournament.participants.all())
        if len(participants) != 4:
            return

        random.shuffle(participants)

        game1 = PongGame.objects.create(player1=participants[0], player2=participants[1], tournament=tournament)
        game2 = PongGame.objects.create(player1=participants[2], player2=participants[3], tournament=tournament)

        tournament.semifinal_1_game = game1
        tournament.semifinal_2_game = game2
        tournament.save()
