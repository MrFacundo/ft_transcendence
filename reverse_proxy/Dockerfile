FROM nginx:latest

RUN apt update && \
    apt install -y jq && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

COPY renew_cert.sh /usr/local/bin/renew_cert.sh

RUN chmod +x /usr/local/bin/renew_cert.sh

COPY nginx.conf /etc/nginx/nginx.conf

#Infinite loop for debug
ENTRYPOINT [ "/bin/sh", "-c", "/usr/local/bin/renew_cert.sh && nginx -g 'daemon off;'"]