storage "file" {
  path = "/vault/data"
  node_id = "node1"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
  telemetry {
    unauthenticated_metrics_access = true
  }
}

telemetry {
  prometheus_retention_time = "12h"
  disable_hostname = true
}

api_addr = "http://localhost:8200"
cluster_addr = "https://localhost:8201"

disable_mlock = true
ui = true
