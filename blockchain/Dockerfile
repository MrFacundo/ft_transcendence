FROM python:3.10

RUN apt-get update && apt-get install -y \
    procps \
    curl \
    git \
    jq \
    bc \
    netcat-openbsd \
    build-essential \
    libssl-dev \
    pkg-config \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN curl -L https://foundry.paradigm.xyz | bash && \
    /root/.foundry/bin/foundryup

ENV PATH="/root/.foundry/bin:$PATH"

WORKDIR /usr/src/app

COPY . .

RUN git init && git config user.name "Temporary" && git config user.email "temporary@example.com"

RUN rm -rf lib/forge-std && \
    forge install foundry-rs/forge-std --no-commit

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || true

RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
