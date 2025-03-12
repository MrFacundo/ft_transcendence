FROM node:18

WORKDIR /usr/src/app

COPY package.json /

RUN npm cache clean --force
RUN npm install --unsafe-perm

COPY . .

EXPOSE 8080

CMD if [ "$NODE_ENV" = "production" ]; then npm run start:prod; else npm start; fi5