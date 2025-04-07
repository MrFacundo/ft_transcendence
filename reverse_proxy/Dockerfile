FROM nginx:latest

RUN apt update && \
    apt install -y jq curl && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

COPY nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]