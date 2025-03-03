#!/bin/bash

# Arquivo onde os aliases serão armazenados
ALIAS_FILE="$HOME/.bashrc"

# Adiciona os aliases ao .bashrc
echo "Adicionando aliases ao $ALIAS_FILE..."

cat <<EOL >> $ALIAS_FILE

# --- Aliases Personalizados ---
alias c='clear'
alias s='cd /home/ronaldpr/02_commoncore/ft_transcendence/backend/app/scripts'

alias lag='docker exec transcendence_back python app/scripts/list_all_games.py --listar_jogos_blockchain'
alias gbp='docker exec transcendence_back python app/scripts/get_game_by_player.py --games_by_player'
alias gbt='docker exec transcendence_back python app/scripts/get_game_by_tournament.py --games_by_tournament'

EOL

# Recarrega o .bashrc para aplicar os aliases imediatamente
source $ALIAS_FILE

echo "✅ Aliases adicionados com sucesso! Reinicie o terminal ou rode 'source ~/.bashrc' para ativá-los."