window.TURING_MERCHANT_PAYMENT_CONFIG = Object.freeze({
  version: "1.0.0-mainnet-service-fee",
  network: "mainnet-beta",
  amountUsdt: "1400",
  referenceCny: "10,000",
  serviceId: "metaverse-cbd-onboarding",
  settlementNotice: "COMMERCIAL_SERVICE_FEE_NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR",
  api: Object.freeze({
    publicConfig: "/api/merchant-orders/config",
    balance: "/api/merchant-orders/balance",
    create: "/api/merchant-orders/create",
    refresh: "/api/merchant-orders/refresh",
    broadcast: "/api/merchant-orders/broadcast",
    verify: "/api/merchant-orders/verify",
    status: "/api/merchant-orders/status"
  }),
  treasuryOwner: "FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8",
  token: Object.freeze({
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    treasuryTokenAccount: "DDeDE8pBjqDwQazgCwPMNuJGePjckgcWTn6wMtmcLXNg"
  }),
  requestTimeoutMs: 30000,
  walletRequestTimeoutMs: 45000,
  applicationStorageKey: "turing-merchant-application-v1",
  recentOrderStorageKey: "turing-merchant-service-fee-order-v1",
  pendingPaymentStorageKey: "turing-merchant-service-fee-pending-v1",
  receiptStorageKey: "turing-merchant-service-fee-receipt-v1"
});
