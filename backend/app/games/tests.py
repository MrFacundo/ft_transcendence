#from django.test import TestCase

# Create your tests here.
from django.test import TestCase, Client
from django.urls import reverse
from app.games.models import PongGame

class GamesViewsTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Criar alguns jogos para teste
        PongGame.objects.create(name="Game 1")
        PongGame.objects.create(name="Game 2")

    def test_get_total_game_count(self):
        response = self.client.get(reverse('total-games'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"total_games": 2})

    def test_game_data_view(self):
        game_id = 1  # Supondo que este ID exista
        response = self.client.get(reverse('game_data', args=[game_id]))
        self.assertEqual(response.status_code, 200)
        # Adicione mais verificações conforme necessário