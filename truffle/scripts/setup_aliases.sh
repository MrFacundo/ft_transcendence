#!/bin/bash

# filepath: /home/ronaldpr/02_commoncore/ft_transcendence/backend/app/scripts/setup_aliases.sh

# Arquivo onde os aliases serão armazenados
ALIAS_FILE="$HOME/.bashrc"

# Adiciona os aliases ao .bashrc
echo "Adicionando aliases ao $ALIAS_FILE..."

cat <<EOL >> $ALIAS_FILE

# --- Aliases Personalizados ---
alias c='clear'
alias s='cd scripts'
alias gp='truffle exec scripts/execute_calls.js p'
alias gt='truffle exec scripts/execute_calls.js t'
EOL

# Recarrega o .bashrc para aplicar os aliases imediatamente
source $ALIAS_FILE

echo "✅ Aliases adicionados com sucesso! Reinicie o terminal ou rode 'source ~/.bashrc' para ativá-los."