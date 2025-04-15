#!/bin/bash

# Nome do container a ser corrigido
CONTAINER_NAME='blockchain'
# $1

if [ -z "$CONTAINER_NAME" ]; then
  echo "❌ Error: Você deve fornecer o nome do container como argumento."
  echo "Uso: ./fix_container.sh <nome_do_container>"
  exit 1
fi

echo "🔍 Verificando o status do container '$CONTAINER_NAME'..."

# Verifica se o container existe
if ! docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
  echo "❌ Error: O container '$CONTAINER_NAME' não existe."
  exit 1
fi

# Desativa o reinício automático do container
echo "⏸️ Desativando reinício automático do container..."
docker update --restart=no "$CONTAINER_NAME"

# Para o container, se estiver em execução
if docker ps --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
  echo "🛑 Parando o container..."
  docker stop "$CONTAINER_NAME"
fi

# Remove a imagem associada ao container
IMAGE_ID=$(docker inspect --format='{{.Image}}' "$CONTAINER_NAME")
if [ -n "$IMAGE_ID" ]; then
  echo "🗑️ Removendo a imagem associada ao container..."
  docker rmi "$IMAGE_ID"
else
  echo "⚠️ Nenhuma imagem associada ao container foi encontrada."
fi

# Inicia o container em modo interativo para depuração
echo "🔧 Iniciando o container em modo interativo para depuração..."
docker start -ai "$CONTAINER_NAME"

# # Pergunta ao usuário se deseja reativar o reinício automático
# read -p "Deseja reativar o reinício automático do container após corrigir o problema? (y/n): " RESTART_CHOICE
# if [ "$RESTART_CHOICE" = "y" ]; then
#   echo "♻️ Reativando reinício automático do container..."
#   docker update --restart=always "$CONTAINER_NAME"
# fi

# Reinicia o container
echo "🚀 Reiniciando o container..."
docker restart "$CONTAINER_NAME"
