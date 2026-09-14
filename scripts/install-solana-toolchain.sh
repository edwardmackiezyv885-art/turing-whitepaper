#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Installing the official Solana development toolchain"
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash

if [[ -f "$HOME/.cargo/env" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

echo "[2/4] Installing Anchor Version Manager"
if ! command -v avm >/dev/null 2>&1; then
  cargo install --git https://github.com/solana-foundation/anchor avm --force
fi

echo "[3/4] Pinning Anchor for the Pyth Solana Receiver SDK"
avm install 0.31.1
avm use 0.31.1

echo "[4/4] Installed versions"
rustc --version
cargo --version
solana --version
anchor --version
node --version
npm --version

