#!/bin/bash


ALIAS_FILE="$HOME/.bashrc"


echo "Adicionando aliases ao $ALIAS_FILE..."

cat <<EOL >> $ALIAS_FILE

# --- Aliases Personalizados ---
alias c='clear'
alias s='cd app/scripts'

alias lag='python app/scripts/list_all_games.py --list_blockchain_games'
alias gbp='python app/scripts/get_game_by_player.py --games_by_player'
alias gbt='python app/scripts/get_game_by_tournament.py --games_by_tournament'

EOL

# Recarrega o .bashrc para aplicar os aliases imediatamente
source $ALIAS_FILE

echo "✅ Aliases added successfully! Restart the terminal or run 'source ~/.bashrc' to activate them 'source ~/.bashrc'"
