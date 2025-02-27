#!/bin/bash

# Arquivo onde os aliases serão armazenados
ALIAS_FILE="$HOME/.bashrc"

# Adiciona os aliases ao .bashrc
echo "Adicionando aliases ao $ALIAS_FILE..."

cat <<EOL >> $ALIAS_FILE

# --- Aliases Personalizados ---
alias c='clear'
alias s='cd app/scripts'
alias gg='python monitor_games_.py --get_novos_jogos'
alias rg='python monitor_games_.py --registrar_jogo'
alias lg='python monitor_games_.py --listar_jogos_blockchain'
alias mg='python monitor_games_.py --monitorar'
alias gp='python getPostgresV2.py

EOL

# Recarrega o .bashrc para aplicar os aliases imediatamente
source $ALIAS_FILE

echo "✅ Aliases adicionados com sucesso! Reinicie o terminal ou rode 'source ~/.bashrc' para ativá-los."
