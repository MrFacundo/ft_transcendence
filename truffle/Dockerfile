# filepath: /home/rprocopi/02_commoncore/ft_transcendence/truffle/Dockerfile
# truffle/Dockerfile
FROM node:16

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install -g truffle
RUN npm install

COPY . .

# Copie o script de deploy
COPY deploy.sh /usr/src/app/deploy.sh

# Execute o script de deploy
CMD ["sh", "/usr/src/app/deploy.sh"]