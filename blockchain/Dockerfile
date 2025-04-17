# -------------------------------
# Stage 1: BASE FOUNDRY
# -------------------------------
FROM ghcr.io/foundry-rs/foundry:latest AS foundry-base

# -------------------------------
# Stage 2: PYTHON + Foundry
# -------------------------------
FROM python:3.10-slim


RUN apt-get update && apt-get install -y \
	procps curl git jq bc netcat-openbsd build-essential \
	libssl-dev pkg-config ca-certificates && \
	rm -rf /var/lib/apt/lists/*

RUN git init && \
git config user.name "Temp" && \
git config user.email "temp@example.com" && \
git config --global --add safe.directory /usr/src/app && \
git add . && \
git commit -m "temp commit" || echo "(commit falhou, ignorando)"


COPY --from=foundry-base /usr/local/bin/forge /usr/bin/forge
COPY --from=foundry-base /usr/local/bin/cast /usr/bin/cast
COPY --from=foundry-base /usr/local/bin/anvil /usr/bin/anvil

ENV FOUNDRY_DISABLE_NIGHTLY_WARNING=1
ENV GIT_DISCOVERY_ACROSS_FILESYSTEM=1

WORKDIR /usr/src/app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt || true

RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
	