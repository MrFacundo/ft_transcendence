#!/bin/sh

set -eu

echo "🔧 Starting entrypoint.sh"

required_vars="DB_NAME DB_USER DB_PASSWORD DB_HOST FOUNDRY_MNEMONIC FOUNDRY_PRIVATE_KEY FOUNDRY_URL PROJECT_DIR"
for var in $required_vars; do
  if [ -z "$(eval echo \$$var)" ]; then
    echo "❌ Missing required env var: $var"
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
  echo "💰 Resetting balance of $1 to max u64..."
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

echo "⏳ Waiting for Anvil to be ready..."
for i in $(seq 1 30); do
  if nc -z $FOUNDRY_HOST $FOUNDRY_PORT; then
    echo "✅ Anvil is ready!"
    break
  fi
  sleep 1
done

if ! nc -z $FOUNDRY_HOST $FOUNDRY_PORT; then
  echo "❌ Error: Anvil did not start in time."
  cleanup
fi

cat <<EOF > "$PROJECT_DIR/foundry.toml"
[profile.default]
src = "src"
script = "foundry/script"
out = "foundry/out"
libs = ["foundry/lib"]
cache_path = "foundry/cache"
broadcast = "foundry/broadcast"
remappings = ["forge-std=foundry/lib/forge-std/src"]
EOF

echo "🔍 Deriving account from private key..."
ACCOUNT_ADDRESS=$(cast wallet address --private-key "$FOUNDRY_PRIVATE_KEY")
echo "🔑 Using account: $ACCOUNT_ADDRESS"

reset_balance "$ACCOUNT_ADDRESS"

echo "🔨 Compiling smart contracts..."
forge build

echo "🚀 Deploying smart contract..."            
DEPLOY_OUTPUT=$(forge script foundry/script/Deploy.s.sol:DeployScript \
  --rpc-url "$FOUNDRY_URL" \
  --broadcast \
  --private-key "$FOUNDRY_PRIVATE_KEY" \
  --gas-limit 5000000 \
  --gas-price 0 \
  --json || true)


CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | jq -r '.contract_address // empty')
if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "null" ]; then
  CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | jq -r '.logs[]?' | grep -Eo '^0x[a-fA-F0-9]{40}$' | tail -n1 || echo "")
fi

if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "null" ]; then
  echo "❌ Could not extract contract address"
  echo "$DEPLOY_OUTPUT"
  cleanup
fi

echo "💾 Saving contract address to deployedAddress.json..."
echo "{\"address\": \"$CONTRACT_ADDRESS\"}" > "$PROJECT_DIR/deployedAddress.json"
chmod 664 "$PROJECT_DIR/deployedAddress.json"
echo "✅ Contract deployed at: $CONTRACT_ADDRESS"

rm -rf foundry/lib/forge-std/.git
rm -rf foundry/lib/forge-std/.github
rm -rf foundry/lib/forge-std/test
rm -f foundry/lib/forge-std/CONTRIBUTING.md
rm -f foundry/lib/forge-std/LICENSE-APACHE
rm -f foundry/lib/forge-std/LICENSE-MIT
rm -f foundry/lib/forge-std/README.md
rm -f foundry/lib/forge-std/.gitattributes
rm -f foundry/lib/forge-std/.gitignore
echo "✅ entrypoint.sh finished. Anvil will continue running..."
tail -f /dev/null
