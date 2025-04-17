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

# CREATE root token and unseal key files
RUN touch /vault/data/.root-token && \
    touch /vault/data/.unseal-key && \
    chmod 640 /vault/data/.root-token && \
    chmod 640 /vault/data/.unseal-key

ENV VAULT_UNSEAL_KEY_FILE="/vault/data/.unseal-key"
ENV VAULT_TOKEN_FILE="/vault/data/.root-token"

# Copy entrypoint script for automated unsealing
COPY src/init-secrets.sh /vault/init-secrets.sh
COPY src/entrypoint.sh /vault/vault-entrypoint.sh
RUN chmod +x /vault/init-secrets.sh vault/vault-entrypoint.sh

# Expose Vault API port
EXPOSE 8200

# Run Vault using the entrypoint script
ENTRYPOINT ["/vault/vault-entrypoint.sh"]
