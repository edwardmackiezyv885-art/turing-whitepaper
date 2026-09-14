# Turing node-sale contract integration

## Current status

The website contains the complete purchase, wallet, live-quote, referral-link, and referral-review experience. Mainnet payment is intentionally locked in `node-config.js`:

```js
purchaseEnabled: false,
programId: ""
```

Do not enable it until a deployed program, NFT mint authority, production RPC, price service, and independent audit are available. A browser-only SOL transfer is not an acceptable substitute: it cannot atomically enforce the 415-node cap, record referral attribution, and mint the rights certificate.

## Required atomic guarantees

The production Solana program must complete these operations in one transaction or fail all of them:

1. Validate that the sale is active and the selected tier has remaining inventory: 350 / 40 / 20 / 5.
2. Read SOL / USD from the approved Pyth account, reject stale or invalid data, and enforce the buyer's `max_lamports` slippage limit.
3. Transfer the calculated lamports to `FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8`.
4. Create a unique purchase-record PDA containing buyer, tier, USD amount, paid lamports, price timestamp, and immutable purchase-time referrer.
5. Reject self-referrals and invalid referral accounts. A blank referrer means official direct purchase.
6. Mint one wallet-bound Token-2022 `NonTransferable` certificate NFT to the payment wallet and link its mint to the purchase record.
7. Increment tier inventory and emit a `NodePurchased` event only after every preceding step succeeds.

Referral reward NFTs should be minted only after the node is marked delivered. Re-audit changes require a separate, auditable authority instruction with old and new attribution in the event log.

## Frontend adapter contract

After audit, load a versioned adapter before `node-purchase.js` and expose:

```js
window.TURING_NODE_CONTRACT = {
  async purchaseNode({
    provider,
    walletAddress,
    tier,
    referrer,
    treasury,
    network,
    programId,
    quote
  }) {
    // Build, simulate, request wallet signature, submit, and confirm.
    // Return only after confirmation:
    return { signature: "...", purchaseRecord: "...", certificateMint: "..." };
  }
};
```

The adapter must simulate the transaction before signature, show the exact maximum SOL spend, use a recent blockhash, confirm against `lastValidBlockHeight`, and verify the emitted purchase record after confirmation.

## Production configuration

After devnet tests and audit:

1. Put the audited program address in `node-config.js` as `programId`.
2. Set `contractAdapterUrl` to the immutable, content-hashed adapter asset and include it before `node-purchase.js`.
3. Set a paid production RPC endpoint. Do not rely on the public mainnet RPC for a sale.
4. Set `quoteProxyUrl` to a server-side endpoint that returns `{ price, publishTime, source }`. Never expose a Pyth API key in browser JavaScript.
5. Verify the on-chain treasury, tier caps, oracle feed, pause authority, and NFT authority against the published deployment manifest.
6. Complete devnet end-to-end tests, cap-boundary tests, stale-price tests, replay tests, self-referral tests, and independent audit remediation.
7. Set `purchaseEnabled: true` only after the deployed bytecode and published audit match.

## Authority model

- Use a multisig for upgrade, pause, delivery, and referral-review authority.
- Separate upgrade authority from treasury control.
- Add a timelock for non-emergency configuration changes.
- Prefer an immutable program after the sale parameters and operational recovery plan are proven.
- Never store private keys, seed phrases, mint-authority secrets, or provider API keys in the website or Netlify deployment package.

