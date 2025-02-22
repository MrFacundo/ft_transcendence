#!/bin/bash

# Navegue até o diretório do projeto Truffle
cd /usr/src/app

# Compile os contratos
truffle compile

# Migrar os contratos para a rede de desenvolvimento
truffle migrate --network development

# Executar testes (opcional)
truffle test --network development

# Mover `deployedAddress.json` para o volume compartilhado
if [ -f /usr/src/app/deployedAddress.json ]; then
  mv /usr/src/app/deployedAddress.json /usr/src/app/shared/deployedAddress.json
  echo "Arquivo deployedAddress.json movido para volume compartilhado."
else
  echo "Erro: deployedAddress.json não encontrado!"
fi

# Manter o contêiner em execução
# tail -f /dev/null