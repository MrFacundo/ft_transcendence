#!/bin/sh

set -eu

echo "🔧 Starting entrypoint.sh"
variables="DB_NAME DB_USER DB_PASSWORD DB_HOST FOUNDRY_MNEMONIC FOUNDRY_PRIVATE_KEY"
for var in $variables; do
  if [ -z "$(eval echo \$$var)" ]; then
    echo "❌ Error: The environment variable $var is not defined."
    exit 1
  fi
done


cleanup() {
  echo "🛑 Cleaning up..."
  if [ -n "${ANVIL_PID:-}" ] && kill -0 "$ANVIL_PID" 2>/dev/null; then
    kill "$ANVIL_PID"
  fi
  exit 1
}

reset_balance() {
  echo "💰 Resetting account balance $1 via anvil_setBalance..."
  curl -s -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"anvil_setBalance\",\"params\":[\"$1\", \"0xFFFFFFFFFFFFFFFF\"],\"id\":1}" \
    $FOUNDRY_URL > /dev/null
  echo "✅ Balance reset for account: $1"
}

echo "🚀 Starting Anvil..."
anvil --mnemonic "$FOUNDRY_MNEMONIC" \
      --balance 18446744073709551615 \
      --gas-limit 10000000 \
      --host 0.0.0.0 2>&1 &
ANVIL_PID=$!

# Aguarda o Anvil subir
echo "⏳ Waiting for Anvil to be ready..."
for i in $(seq 1 60); do
  if nc -z $FOUNDRY_HOST $FOUNDRY_PORT; then
    echo "✅ Anvil is ready!"
    break
  fi
  sleep 1
done

if ! nc -z $FOUNDRY_HOST $FOUNDRY_PORT; then
  echo "❌ Error: Anvil did not start within the expected time."
  cat anvil.log
  cleanup
fi

echo "🔍 Deriving address from private key used in deployment..."
ACCOUNT_ADDRESS=$(cast wallet address --private-key "$FOUNDRY_PRIVATE_KEY")
echo "🔑 Deployment will be done with the account: $ACCOUNT_ADDRESS"


reset_balance "$ACCOUNT_ADDRESS"

BALANCE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ACCOUNT_ADDRESS\", \"latest\"],\"id\":1}" \
 $FOUNDRY_URL)
BALANCE=$(echo "$BALANCE_RESPONSE" | jq -r '.result')
echo "Balance response: $BALANCE_RESPONSE"

DECIMAL_BALANCE=$(echo "$BALANCE" | sed 's/^0x//' | tr 'a-f' 'A-F' | xargs printf "ibase=16; %s\n" | bc 2>/dev/null || echo "0")
if ! echo "$DECIMAL_BALANCE" | grep -Eq '^[0-9]+$'; then
    echo "❌Invalid balance detected."
    cleanup
fi
echo "✅ Available balance (wei): $DECIMAL_BALANCE"


echo "📦 Deploying smart contracts with Foundry..."
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol \
  --rpc-url $FOUNDRY_URL\
  --broadcast \
  --private-key "$FOUNDRY_PRIVATE_KEY" \
  --gas-limit 5000000 \
  --gas-price 0 \
  --json || true)


CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | \
  jq -r '.logs[]?' | \
  grep -Eo '^0x[a-fA-F0-9]{40}$' | \
  tail -n1 || echo "")


if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "null" ]; then
  CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | jq -r '.logs[]?' | grep -Eo '0x[a-fA-F0-9]{40}' | tail -n1 || echo "")
fi


if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "null" ]; then
  echo "❌ Deploy failed: Unable to extract contract address."
  echo "$DEPLOY_OUTPUT"
  cleanup
fi

echo "💾 Saving contract address in deployedAddress.json..."
echo "{\"address\": \"$CONTRACT_ADDRESS\"}" | tee /usr/src/app/deployedAddress.json
chmod 664 /usr/src/app/deployedAddress.json
echo "✅ Smart contract deployed at: $CONTRACT_ADDRESS"



echo "✅ entrypoint.sh completed successfully. Anvil will continue running..."
tail -f /dev/null
