FROM hashicorp/vault:1.18.4

RUN apk add --no-cache bash curl jq

# Create necessary directories with proper permissions
RUN mkdir -p /vault/data /vault/config /etc/vault && \
    chown -R vault:vault /vault /etc/vault && \
    chmod -R 750 /vault

# Copy configuration and entrypoint script
COPY src/vault-config.hcl /vault/vault-config.hcl
COPY src/vault-entrypoint.sh /vault/vault-entrypoint.sh

# Expose Vault API port
EXPOSE 8200

# Run Vault using the entrypoint script
ENTRYPOINT ["/vault/vault-entrypoint.sh"]
