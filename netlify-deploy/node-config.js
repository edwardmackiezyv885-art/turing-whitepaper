/*
 * Turing Mainnet USDT node-order frontend configuration.
 *
 * This file is public and is never a source of truth for price, inventory, or
 * payment verification. The order API must independently validate every field.
 * No treasury, administrator, or NFT-authority secret belongs in the browser.
 */
window.TURING_NODE_CONFIG = Object.freeze({
  version: "3.0.0-production-usdt",
  network: "mainnet-beta",
  purchaseEnabled: true,
  api: Object.freeze({
    publicConfig: "/api/node-orders/config",
    balance: "/api/node-orders/balance",
    create: "/api/node-orders/create",
    refresh: "/api/node-orders/refresh",
    broadcast: "/api/node-orders/broadcast",
    verify: "/api/node-orders/verify",
    status: "/api/node-orders/status",
    admin: "/api/node-orders/admin"
  }),
  treasuryOwner: "FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8",
  token: Object.freeze({
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    treasuryTokenAccount: "DDeDE8pBjqDwQazgCwPMNuJGePjckgcWTn6wMtmcLXNg"
  }),
  orderPollSeconds: 5,
  requestTimeoutMs: 30000,
  walletRequestTimeoutMs: 45000,
  recentOrderStorageKey: "turing-node-recent-order-v3",
  pendingPaymentStorageKey: "turing-node-pending-payment-v1",
  referralStorageKey: "turing-referrer-v2",
  referralTtlDays: 30,
  testTier: Object.freeze({
    id: "test-050",
    level: "TEST",
    amountUsdt: "0.5",
    supply: 50,
    test: true,
    zh: "支付链路测试",
    en: "Payment Flow Test",
    certificateImage: "./assets/nodes/thumbs/tnode-l1-explorer.webp",
    certificateFallback: "./assets/nodes/thumbs/tnode-l1-explorer.jpg",
    certificateOriginal: "./assets/nodes/tnode-l1-explorer.png"
  }),
  tiers: Object.freeze([
    Object.freeze({ id: "explorer", level: "L1", amountUsdt: "1000", supply: 350, zh: "探索节点", en: "Explorer Node", certificateImage: "./assets/nodes/thumbs/tnode-l1-explorer.webp", certificateFallback: "./assets/nodes/thumbs/tnode-l1-explorer.jpg", certificateOriginal: "./assets/nodes/tnode-l1-explorer.png" }),
    Object.freeze({ id: "builder", level: "L2", amountUsdt: "5000", supply: 40, zh: "建设节点", en: "Builder Node", certificateImage: "./assets/nodes/thumbs/tnode-l2-builder.webp", certificateFallback: "./assets/nodes/thumbs/tnode-l2-builder.jpg", certificateOriginal: "./assets/nodes/tnode-l2-builder.png" }),
    Object.freeze({ id: "cocreator", level: "L3", amountUsdt: "10000", supply: 20, zh: "共创节点", en: "Co-creator Node", certificateImage: "./assets/nodes/thumbs/tnode-l3-cocreator.webp", certificateFallback: "./assets/nodes/thumbs/tnode-l3-cocreator.jpg", certificateOriginal: "./assets/nodes/tnode-l3-cocreator.png" }),
    Object.freeze({ id: "market-agent", level: "L4", amountUsdt: "50000", supply: 5, zh: "核心市场代理节点", en: "Core Market Agent Node", certificateImage: "./assets/nodes/thumbs/tnode-l4-core-agent.webp", certificateFallback: "./assets/nodes/thumbs/tnode-l4-core-agent.jpg", certificateOriginal: "./assets/nodes/tnode-l4-core-agent.png" })
  ])
});
