FROM alpine:3.21

ENV PROMETHEUS_VERSION=2.52.0

RUN apk add --no-cache curl

ADD https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz /tmp/

RUN tar -xzf /tmp/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz -C /opt/ && \
    mv /opt/prometheus-${PROMETHEUS_VERSION}.linux-amd64 /opt/prometheus && \
    mkdir -p /etc/vault

WORKDIR /opt/prometheus

ENTRYPOINT ["./prometheus", "--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.retention.time=30d", "--web.external-url=/prometheus/"]
