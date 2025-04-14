FROM nginx:latest

RUN apt update && \
    apt install -y jq curl && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/ssl

RUN touch /etc/nginx/ssl/localhost.crt
RUN touch /etc/nginx/ssl/localhost.key

RUN chmod 600 /etc/nginx/ssl/localhost.crt
RUN chmod 600 /etc/nginx/ssl/localhost.key

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

COPY nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]