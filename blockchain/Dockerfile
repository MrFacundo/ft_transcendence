FROM node:18-alpine

ARG GANACHE_ENV GANACHE_URL GANACHE_PORT

RUN apk add --no-cache \
bash git python3 py3-pip py3-setuptools py3-wheel make g++ \
libc6-compat linux-headers postgresql-client procps

WORKDIR /usr/src/app
COPY . .

RUN npm install dotenv

RUN chmod +x entrypoint.sh

RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

RUN npm install -g ganache-cli@latest truffle@latest

VOLUME ["/usr/src/app"]

CMD ["sh", "/usr/src/app/entrypoint.sh"]
