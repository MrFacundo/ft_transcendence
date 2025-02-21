#!/bin/bash

# Navegue até o diretório do projeto Truffle
cd /usr/src/app

# Compile os contratos
truffle compile

# Migrar os contratos para a rede de desenvolvimento
truffle migrate --network development

# Executar testes (opcional)
truffle test --network development