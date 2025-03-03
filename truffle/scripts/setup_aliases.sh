#!/bin/bash

ALIAS_FILE="$HOME/.bashrc"

echo "Adicionando aliases ao $ALIAS_FILE..."

cat <<EOL >> $ALIAS_FILE

# --- Custom Aliases ---
alias c='clear'
alias s='cd scripts'
alias gp='truffle exec scripts/execute_calls.js p'
alias gt='truffle exec scripts/execute_calls.js t'
EOL


source $ALIAS_FILE

echo "✅ Aliases added successfully! Restart the terminal or run 'source ~/.bashrc' to activate them."