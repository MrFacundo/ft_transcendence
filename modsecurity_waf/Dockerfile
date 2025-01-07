# Start from the pre-built image
FROM bit3/nginx-waf:latest

# Install any necessary tools (e.g., vim, curl, or other utilities)
RUN apt-get update && apt-get install -y vim curl net-tools

# Copy your custom configuration files (e.g., nginx.conf, default.conf, etc.)
COPY src/default.conf /etc/nginx/conf.d/

# Optionally, install additional software or make further changes
RUN apt-get install -y libmodsecurity3

# Expose the necessary ports (adjust based on your requirements)
EXPOSE 8081

# Define the command to run the image
RUN bash docker-entrypoint.sh

CMD ["nginx", "-g", "daemon off;"]
