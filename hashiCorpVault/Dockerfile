# Use the official Vault image
FROM hashicorp/vault:latest

# Set Vault to server mode
ENV VAULT_ADDR=http://0.0.0.0:8200
ENV VAULT_API_ADDR=http://127.0.0.1:8200
ENV VAULT_CONFIG_PATH=/vault/config

# Create necessary directories
RUN mkdir -p /vault/config /vault/data

# Copy Vault configuration file into the container
COPY src/vault-config.hcl /vault/config/vault.hcl

# Set permissions
RUN chmod 640 /vault/config/vault.hcl

# Expose the Vault API port
EXPOSE 8200

# Command to run Vault in server mode
CMD ["vault", "server", "-config=/vault/config/vault.hcl"]
