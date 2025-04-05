storage "file" {
  path = "/vault/data"
  node_id = "node1"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  #tls_disable = true # enable this for production
}

api_addr = "http://localhost:8200"
cluster_addr = "http://localhost:8201"


# vault uses mlock to prevent memory from being swapped to disk. In production, you should not disable this.
disable_mlock = true
ui = true