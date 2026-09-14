# Turing Node Sale — Mainnet candidate

This Anchor program is the source of truth for the Solana node sale. The production deployment starts with public sale disabled. A separate buyer-restricted, one-supply, 1 U smoke-test certificate is used for the first Mainnet transaction and carries no node, staking, referral, or revenue rights.

## Fixed addresses

- Program candidate: `46z8HyP9StJs6SvPJGC2HgsUoFuH2snsSiWypWVzxdNF`
- Treasury: `FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8`
- Pyth SOL/USD feed: `ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`

Do not publish the website purchase switch until the Mainnet smoke test, independent audit, deployment-bytecode verification, and multisig authority handoff are complete.

Operational commands and the wallet-creation procedure are documented in `MAINNET_RUNBOOK.md`. The scripts hard-fail on a non-Mainnet genesis hash, a mismatched Program ID, treasury, Pyth account owner, or sale state.
