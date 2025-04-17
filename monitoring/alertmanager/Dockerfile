FROM alpine:3.21

ENV ALERTMANAGER_VERSION=0.28.0

RUN apk add --no-cache curl envsubst

ADD https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz /tmp/

RUN tar -xzf /tmp/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz -C /opt/ && \
    mv /opt/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager /bin/ && \
    rm -rf /tmp/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64* && \
    mkdir -p /etc/alertmanager /alertmanager

COPY alertmanager.yml.tmpl /etc/alertmanager/

WORKDIR /alertmanager

ENTRYPOINT ["/bin/sh", "-c", "envsubst < /etc/alertmanager/alertmanager.yml.tmpl > /etc/alertmanager/alertmanager.yml && exec /bin/alertmanager --config.file=/etc/alertmanager/alertmanager.yml --storage.path=/alertmanager --web.external-url=http://localhost/alertmanager"]