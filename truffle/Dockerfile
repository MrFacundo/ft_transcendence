FROM node:18-alpine

# Instalar dependências
RUN apk add --no-cache \
    bash \
    git \
    python3 \
    make \
    g++ \
    libc6-compat \
    linux-headers

WORKDIR /usr/src/app

# Copiar package.json primeiro
COPY package*.json ./
RUN npm install -g truffle@5.8.2
RUN npm install

# Copiar resto dos arquivos
COPY . .
RUN chmod +x deploy.sh

# Definir volume
VOLUME ["/usr/src/app"]

CMD ["sh", "deploy.sh"]