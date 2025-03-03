#!/bin/bash

ALIAS_FILE="$HOME/.bashrc"


echo "Add aliases $ALIAS_FILE..."

cat <<EOL >> $ALIAS_FILE

alias c='clear'

alias lag='docker exec transcendence_back python app/scripts/list_all_games.py --list_blockchain_games'
alias gbp='docker exec transcendence_back python app/scripts/get_game_by_player.py --games_by_player'
alias gbt='docker exec transcendence_back python app/scripts/get_game_by_tournament.py --games_by_tournament'

EOL

source $ALIAS_FILE

echo "✅ Aliases added successfully! Restart the terminal or run 'source ~/.bashrc' to activate them.."