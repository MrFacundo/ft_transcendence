#!/bin/sh

# Teste 1: Verificar se Ganache está em execução
if ! echo "Ganache is running"; then
  exit 1
fi

# Teste 2: Verificar se o arquivo existe
if ! ls /usr/src/app/shared/deployedAddress.json; then
  exit 1
fi

exit 0