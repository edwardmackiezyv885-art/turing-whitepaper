#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOLANA_BIN="${SOLANA_BIN:-$HOME/.local/share/solana/install/releases/3.1.10/solana-release/bin}"
RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
AUTHORITY_KEYPAIR="${AUTHORITY_KEYPAIR:-$HOME/.config/solana/turing-mainnet-authority.json}"
PROGRAM_KEYPAIR="$ROOT_DIR/target/deploy/turing_node_sale-keypair.json"
PROGRAM_SO="$ROOT_DIR/target/deploy/turing_node_sale.so"
EXPECTED_PROGRAM_ID="46z8HyP9StJs6SvPJGC2HgsUoFuH2snsSiWypWVzxdNF"
MAINNET_GENESIS_HASH="5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d"

for file in "$AUTHORITY_KEYPAIR" "$PROGRAM_KEYPAIR" "$PROGRAM_SO"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

actual_program_id="$($SOLANA_BIN/solana-keygen pubkey "$PROGRAM_KEYPAIR")"
if [[ "$actual_program_id" != "$EXPECTED_PROGRAM_ID" ]]; then
  echo "Program keypair mismatch: $actual_program_id" >&2
  exit 1
fi

genesis_hash="$($SOLANA_BIN/solana genesis-hash --url "$RPC_URL")"
if [[ "$genesis_hash" != "$MAINNET_GENESIS_HASH" ]]; then
  echo "Refusing deployment: RPC is not Solana Mainnet (genesis $genesis_hash)." >&2
  exit 1
fi

authority="$($SOLANA_BIN/solana address --keypair "$AUTHORITY_KEYPAIR")"
balance="$($SOLANA_BIN/solana balance "$authority" --url "$RPC_URL")"
sha256="$(sha256sum "$PROGRAM_SO" | awk '{print $1}')"

echo "Network: Solana Mainnet"
echo "Program ID: $EXPECTED_PROGRAM_ID"
echo "Upgrade authority / fee payer: $authority"
echo "Authority balance: $balance"
echo "Program SHA-256: $sha256"
echo "Public sale status after initialization: DISABLED"

if [[ "${TURING_MAINNET_DEPLOY:-}" != "I_UNDERSTAND_THIS_USES_REAL_SOL" ]]; then
  echo "Preflight only. To deploy, set TURING_MAINNET_DEPLOY=I_UNDERSTAND_THIS_USES_REAL_SOL." >&2
  exit 2
fi

exec "$SOLANA_BIN/solana" program deploy \
  "$PROGRAM_SO" \
  --url "$RPC_URL" \
  --keypair "$AUTHORITY_KEYPAIR" \
  --fee-payer "$AUTHORITY_KEYPAIR" \
  --upgrade-authority "$AUTHORITY_KEYPAIR" \
  --program-id "$PROGRAM_KEYPAIR" \
  --use-rpc \
  --max-sign-attempts 10 \
  --with-compute-unit-price "${DEPLOY_COMPUTE_UNIT_PRICE:-5000}"
