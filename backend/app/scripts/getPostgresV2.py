import psycopg2
import pandas as pd
from sqlalchemy import create_engine
import time
import os

DB_PARAMS = {
    'database': 'transcendence',
    'user': 'db_user',
    'password': 'db_password',
    'host': 'transcendence_db',
    'port': '5432'
}

CSV_FILE = 'games_history.csv'
DUPLICATE_COLUMNS = [
    'id', 'channel_group_name', 'date_played', 
    'score_player1', 'score_player2', 'match_date',
    'status', 'tournament_id', 'winner_id', 
    'player1_id', 'player2_id'
]

def get_engine():
    return create_engine(f'postgresql://{DB_PARAMS["user"]}:{DB_PARAMS["password"]}@{DB_PARAMS["host"]}:{DB_PARAMS["port"]}/{DB_PARAMS["database"]}')

def get_latest_game_id():
    """Obtém o último game_id salvo no CSV para buscar apenas novos jogos no banco de dados."""
    if not os.path.exists(CSV_FILE):
        return None
    
    try:
        df = pd.read_csv(CSV_FILE, usecols=['id'])
        if df.empty:
            return None
        return df['id'].max()
    except Exception as e:
        print(f"Erro ao ler o CSV: {e}")
        return None

def get_new_games():
    """Busca apenas novos registros no banco de dados para evitar duplicatas."""
    engine = get_engine()
    last_game_id = get_latest_game_id()
    
    query = "SELECT * FROM games_ponggame"
    if last_game_id is not None:
        query += f" WHERE id > {last_game_id}"
    
    try:
        new_data = pd.read_sql(query, engine)
        return new_data
    except Exception as e:
        print(f"Erro ao buscar novos jogos: {e}")
        return pd.DataFrame()

def get_total_game_count():
    """Obtém o número total de registros na base de dados."""
    engine = get_engine()
    query = "SELECT COUNT(*) FROM games_ponggame"

    try:
        result = pd.read_sql(query, engine)
        return result.iloc[0, 0]
    except Exception as e:
        print(f"Erro ao contar registros na base de dados: {e}")
        return 0

def save_games_to_csv(new_data):
    """Salva apenas os novos registros no CSV sem sobrescrever o histórico."""
    if new_data.empty:
        return 0  # Retorna 0 caso não haja novos registros

    try:
        # Se o arquivo já existe, adiciona apenas os novos registros
        if os.path.exists(CSV_FILE):
            new_data.to_csv(CSV_FILE, mode='a', header=False, index=False)
        else:
            new_data.to_csv(CSV_FILE, index=False)
        
        return len(new_data)
    except Exception as e:
        print(f"Erro ao salvar dados no CSV: {e}")
        return 0

if __name__ == "__main__":
    total_registros = get_total_game_count()  # Inicia com o total da base
    while True:
        new_data = get_new_games()
        num_novos_registros = save_games_to_csv(new_data)

        if num_novos_registros > 0:
            total_registros = get_total_game_count()  # Atualiza o total real da base
            
            print("\n--- Novos registros adicionados ---")
            print(new_data)  # Exibe apenas os registros novos
            print(f"Total de registros na base de dados: {total_registros}")

        time.sleep(6)