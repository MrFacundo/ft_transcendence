FROM alpine:3.21

RUN apk add --no-cache curl


ADD https://github.com/prometheus/prometheus/releases/download/v2.52.0/prometheus-2.52.0.linux-amd64.tar.gz /tmp/
RUN tar -xzf /tmp/prometheus-2.52.0.linux-amd64.tar.gz -C /opt/ && \
    mv /opt/prometheus-2.52.0.linux-amd64 /opt/prometheus

WORKDIR /opt/prometheus

CMD ["./prometheus", "--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.retention.time=30d"]
