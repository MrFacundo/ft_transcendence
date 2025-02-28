#!/bin/bash

set -e  # Parar em caso de erro

# Aguardar Ganache estar pronto
echo "Aguardando Ganache..."
sleep 10

# Compilar e migrar contratos
echo "Compilando contratos..."
truffle compile
echo "Migrando contratos..."
truffle migrate --network development --reset

# Mover arquivo de endereço
if [ -f /usr/src/app/deployedAddress.json ]; then
  cp /usr/src/app/deployedAddress.json /usr/src/app/shared/
  echo "✅Arquivo deployedAddress.json copiado para volume compartilhado."
else
  echo "❌Erro: deployedAddress.json não encontrado!"
  exit 1
fi

# Manter container rodando
#tail -f /dev/null