#!/bin/bash

# filepath: /home/ronaldpr/02_commoncore/ft_transcendence/truffle/run_truffle_calls.sh
set -e  # Parar em caso de erro

# Aguardar Ganache estar pronto
echo "Aguardando Ganache..."
sleep 10

# Executar chamadas no Truffle
echo "Executando chamadas no Truffle..."
truffle exec execute_calls.js --network development