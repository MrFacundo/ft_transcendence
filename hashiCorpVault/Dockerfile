FROM hashicorp/vault:1.18.4

RUN apk add --no-cache bash curl jq

RUN apk add --no-cache \
    bash \
    curl \
    jq \
    && rm -rf /var/cache/apk/*

# Create necessary directories
RUN mkdir -p /vault/config /vault/data && \
    chown -R vault:vault /vault && \
    chmod -R 750 /vault

# Copy entrypoint script for automated unsealing
COPY src/vault-entrypoint.sh /vault/vault-entrypoint.sh
RUN chmod +x /vault/vault-entrypoint.sh

# Expose Vault API port
EXPOSE 8200

# Run Vault using the entrypoint script
ENTRYPOINT ["/vault/vault-entrypoint.sh"]
