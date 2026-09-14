# Turing Mainnet deployment runbook

This runbook deploys the production program with the four public tiers **disabled**. It enables only one designated wallet to buy a single 1 U smoke-test certificate. That test certificate explicitly carries no node, staking, referral, revenue, or economic rights.

Never send a seed phrase, private key, or keypair JSON to anyone. Run wallet-generation commands yourself and share only public addresses.

## 1. Create two wallets yourself

Open Ubuntu/WSL and run:

```bash
mkdir -p ~/.config/solana
~/.local/share/solana/install/releases/3.1.10/solana-release/bin/solana-keygen new \
  --outfile ~/.config/solana/turing-mainnet-authority.json
~/.local/share/solana/install/releases/3.1.10/solana-release/bin/solana-keygen new \
  --outfile ~/.config/solana/turing-mainnet-smoke-buyer.json
```

Write both seed phrases on paper and store them offline. Do not photograph or paste them into chat.

Display only the public addresses:

```bash
~/.local/share/solana/install/releases/3.1.10/solana-release/bin/solana address \
  --keypair ~/.config/solana/turing-mainnet-authority.json
~/.local/share/solana/install/releases/3.1.10/solana-release/bin/solana address \
  --keypair ~/.config/solana/turing-mainnet-smoke-buyer.json
```

Fund the authority with at least 6 SOL for initial deployment and the smoke buyer with at least 0.05 SOL for the 1 U payment, account rent, NFT mint, and transaction fees. These are operational buffers, not exact guaranteed costs.

## 2. Install pinned JavaScript dependencies

From this project directory in WSL:

```bash
export PATH="$HOME/.nvm/versions/node/v24.10.0/bin:$PATH"
npm ci
```

## 3. Run read-only Mainnet preflight

Replace `SMOKE_BUYER_PUBLIC_KEY` with the second wallet's public address:

```bash
export PATH="$HOME/.nvm/versions/node/v24.10.0/bin:$PATH"
npm run mainnet:preflight -- --smoke-buyer SMOKE_BUYER_PUBLIC_KEY
```

Verify the displayed Program ID, treasury, authority, binary hash, balance, and network before continuing.

## 4. Deploy the program

First run the shell script without the confirmation variable. It prints a preflight and exits without deployment. When all values match, run:

```bash
export TURING_MAINNET_DEPLOY=I_UNDERSTAND_THIS_USES_REAL_SOL
bash scripts/deploy-mainnet.sh
unset TURING_MAINNET_DEPLOY
```

## 5. Initialize the one-wallet smoke test

```bash
export PATH="$HOME/.nvm/versions/node/v24.10.0/bin:$PATH"
npm run mainnet:initialize -- --smoke-buyer SMOKE_BUYER_PUBLIC_KEY
npm run mainnet:status
```

The verified state must show `publicSaleEnabled: false`, `smokeTestEnabled: true`, and the exact designated smoke buyer.

## 6. Preview and execute the 1 U purchase

The first command is a no-spend preview. It prints the live oracle price and maximum SOL amount, then exits:

```bash
npm run mainnet:smoke -- --keypair ~/.config/solana/turing-mainnet-smoke-buyer.json
```

After checking the preview:

```bash
export TURING_MAINNET_SMOKE=I_UNDERSTAND_THIS_SPENDS_REAL_SOL
npm run mainnet:smoke -- --keypair ~/.config/solana/turing-mainnet-smoke-buyer.json
unset TURING_MAINNET_SMOKE
```

Save the transaction signature, purchase-record address, and certificate-mint address printed by the script.

## 7. Permanently retire the 1 U path

Only after the script verifies the treasury increase, purchase record, and one certificate token:

```bash
npm run mainnet:retire-smoke
npm run mainnet:status
```

The state must show `smokeTestRetired: true`, `smokeTestEnabled: false`, and `publicSaleEnabled: false`. The public four-tier sale stays locked until independent audit, bytecode verification, production RPC configuration, website integration testing, and multisig authority handoff are complete.
