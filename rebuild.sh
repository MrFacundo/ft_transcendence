# Atualizar o Dockerfile
# (Faça as alterações necessárias no Dockerfile)

# Reconstruir a imagem
docker build -t blockchain:latest .

# Taguear a imagem (opcional)
docker tag blockchain:latest blockchain:v2

# Parar e remover contêineres antigos
docker stop my-container
docker rm my-container

# Executar contêineres com a nova imagem
docker run -d --name my-container blockchain:latest