import hvac
import os
import time

class VaultClient:
    def __init__(self, vault_addr=None, vault_token=None):
        # Configures the Vault connection
        self.vault_addr = vault_addr or os.getenv("VAULT_ADDR")
        if vault_token:
            self.vault_token = vault_token
        else:
            with open("/vault/data/.root-token", "r") as f:
                self.vault_token = f.read().strip()


        # Creates the Vault client
        self.client = hvac.Client(url=self.vault_addr)
        self.client.token = self.vault_token


    def get_email_vars(self, var):
        secret = self.client.secrets.kv.read_secret_version(path="email_host")

        if var == "username":
            return secret['data']['data']['username']
        elif var == "password":
            return secret['data']['data']['password']
        elif var == "host":
            return secret['data']['data']['host']
        elif var == "port":
            return secret['data']['data']['port']
        else:
            raise ValueError("Invalid variable name. Choose from: email_host_user, email_host_password, host, port.")

    def get_db_vars(self, var):
        secret = self.client.secrets.kv.read_secret_version(path="database")

        if var == "host":
            return secret['data']['data']['host']
        elif var == "port":
            return secret['data']['data']['port']
        elif var == "username":
            return secret['data']['data']['username']
        elif var == "password":
            return secret['data']['data']['password']
        elif var == "db_url":
            return secret['data']['data']['db_url']
        else:
            raise ValueError("Invalid variable name. Choose from: host, port, username, password, url.")

    def get_42_vars(self, var):
        secret = self.client.secrets.kv.read_secret_version(path="42oauth")

        if var == "client_id":
            return secret['data']['data']['client_id']
        elif var == "client_secret":
            return secret['data']['data']['client_secret']
        elif var == "redirect_uri":
            return secret['data']['data']['redirect_uri']
        else:
            raise ValueError("Invalid variable name. Choose from: client_id, client_secret, redirect_uri.")

    def get_redis_vars(self, var):
        secret = self.client.secrets.kv.read_secret_version(path="redis")

        if var == "host":
            return secret['data']['data']['host']
        elif var == "port":
            return secret['data']['data']['port']
        elif var == "password":
            return secret['data']['data']['password']
        else:
            raise ValueError("Invalid variable name. Choose from: redis_host, redis_port, redis_password.")

    def get_ganache_vars(self, var):
        secret = self.client.secrets.kv.read_secret_version(path="ganache")

        if var == "code":
            return secret['data']['data']['code']
        else:
            raise ValueError("Invalid variable name. Choose from: ganache_code.")

    def get_jwt_key(self):
        secret = self.client.secrets.kv.read_secret_version(path="jwt")
        return secret['data']['data']['secret_key']