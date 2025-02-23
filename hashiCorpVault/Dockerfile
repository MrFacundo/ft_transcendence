FROM hashicorp/vault:1.18.4

# Create necessary directories
RUN mkdir -p /vault/config /vault/data
RUN chown -R vault:vault /vault && chmod -R 750 /vault

# Expose Vault API port
EXPOSE 8200

# Run Vault in server mode
CMD ["vault", "server", "-config=/vault/config/vault.hcl"]
