FROM node:18-alpine

ARG GANACHE_ENV

# Instalar dependências do sistema
RUN apk add --no-cache \
    bash git python3 py3-pip py3-setuptools py3-wheel make g++ \
    libc6-compat linux-headers postgresql-client procps

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de configuração primeiro para melhor uso do cache
COPY package.json ./
# COPY package-lock.json . || true

# Instalar dependências Node.js
RUN npm install

# Copiar scripts necessários ANTES do resto da aplicação
COPY entrypoint.sh /usr/src/app/entrypoint.sh
COPY healthcheck.sh /usr/src/app/healthcheck.sh

# Garantir permissões corretas
RUN chmod +x /usr/src/app/entrypoint.sh /usr/src/app/healthcheck.sh

# Copiar todos os outros arquivos da aplicação
COPY . .

# Instalar dependências Python sem ambiente virtual
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Instalar Ganache e Truffle
RUN npm install -g ganache-cli@latest truffle@latest

# Definir volume para persistência de dados
VOLUME ["/usr/src/app"]

# Comando padrão
ENTRYPOINT ["sh", "/usr/src/app/entrypoint.sh"]
