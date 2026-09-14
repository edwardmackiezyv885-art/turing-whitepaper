(() => {
  "use strict";

  const config = window.TURING_NODE_CONFIG;
  if (!config) return;

  const i18n = {
    zh: {
      buyNode: "购买节点", purchaseTitle: "购买图灵节点",
      testBuyNode: "测试支付 0.5 USDT", testPurchaseTitle: "0.5 USDT 主网支付测试",
      testBannerTitle: "0.5 USDT 主网支付测试", testBannerText: "仅用于验证付款、邀请登记和订单状态；不产生正式节点权益、NFT 或邀请奖励。",
      testTierMeta: "真实主网付款 · 无正式权益", testRightsNotice: "本订单仅验证 Solana Mainnet USDT 支付链路；付款成功后记录测试状态，不发放节点权益、NFT 或邀请奖励。",
      testOwnerConfirm: "我确认这是 0.5 USDT 主网测试付款，且该订单不产生正式节点权益、NFT 或邀请奖励。",
      testSecurityCopy: "第一步签署不扣款的测试订单证明；第二步确认 0.5 USDT 主网付款。Bitget 可能显示为“合约交互”，该弹窗就是实际付款。还需少量 SOL 支付手续费。",
      checkingPaymentTitle: "正在检查销售状态", checkingPaymentText: "正在读取主网正式销售状态。",
      paymentLockedTitle: "支付服务暂不可用", paymentLockedText: "当前不会发起付款，请稍后重试。",
      paymentReadyTitle: "Solana Mainnet · USDT 支付已就绪", paymentReadyText: "订单由服务端生成；付款核验后进入 NFT 待发放队列，邀请地址随订单登记并由官方复核资格。",
      connectWalletTitle: "连接付款钱包", connectWalletHint: "节点权益和 NFT 凭证将发放至这个地址。",
      connectWallet: "连接 Solana 钱包", connectedWallet: "已连接", disconnect: "断开", chooseWallet: "选择钱包",
      walletCompatibilityNote: "支持 Wallet Standard、最新版 MetaMask、Bitget Wallet、TokenPocket 与 OKX Wallet（建议 6.90.1+）。Bitget/TP 会在钱包内打开本站；观察地址不能付款，冷钱包须由可签署 Solana 消息和交易的软件代理（如 TP 离线签名或 Keystone + Solflare）。",
      detectedWallet: "已检测", openWallet: "打开钱包", walletStandardLabel: "兼容钱包", walletLoading: "正在准备连接…", walletRetry: "重新加载", walletOpenHint: "已尝试打开钱包，请在钱包内继续。",
      metamaskName: "MetaMask", bitgetName: "Bitget Wallet", tokenPocketName: "TokenPocket", okxName: "OKX Wallet", noCompatibleWallet: "当前浏览器未检测到兼容钱包，可选择下方手机钱包打开本网站。",
      chooseTier: "选择节点等级", tierHint: "正式档位仅收 Solana Mainnet USDT。", totalSupply: "总量", referralReward: "邀请 NFT",
      confirmPayment: "确认 USDT 支付", paymentHint: "订单只收取 Solana Mainnet 上的官方 USDT，金额由订单服务核定。",
      nodePrice: "节点价格", paymentAsset: "付款资产", paymentNetwork: "网络", officialMint: "官方 USDT Mint",
      referralSource: "邀请归属", officialDirect: "官方直购", invalidSelfReferral: "自邀无效 · 按官方直购处理",
      rightsNotice: "付款核验后，节点权益与 NFT 权益凭证将发放至当前付款钱包。请勿使用交易所或托管地址。",
      walletOwnerConfirm: "我确认自己控制该钱包，并已核对节点等级、USDT 金额和邀请归属。",
      lockedButton: "支付服务暂不可用", payNow: "签署归属证明并创建订单", processingPayment: "正在创建安全订单…", paying: "正在等待钱包确认付款…",
      orderReadyTitle: "付款订单已准备好", orderReadyText: "下一次钱包弹窗就是本订单的 USDT 付款确认；Bitget 可能显示为“合约交互”，确认后不会再出现第三个付款窗口。", preparingPaymentTitle: "正在准备付款交易", preparingPaymentText: "正在获取最新区块信息，按钮可用后点击一次即可打开钱包。", openingWalletTitle: "正在打开钱包", openingWalletText: "当前钱包弹窗就是本订单的 USDT 付款确认；请核对官网显示的金额后确认，不会再出现第三个窗口。", checkingChainTitle: "正在核对链上付款", checkingChainText: "钱包尚未返回明确结果。请勿重复支付，系统正在查询链上记录。", payPreparedOrder: "支付 USDT", orderPrepared: "安全订单已创建，请点击付款按钮继续。", returnToBrowser: "钱包确认后如未自动返回，请手动回到本页面查看链上状态。",
      refreshingPayment: "正在更新付款交易…", refreshPayment: "更新付款交易", paymentRefreshed: "付款交易已更新，请再次点击支付。",
      paymentUncertain: "正在核对链上付款，请勿重复支付。", retryPaymentReady: "未发现已提交付款，交易已更新，可再次支付。", orderExpiredRecreate: "订单已接近过期，已停止付款，请重新创建订单。",
      checkingBalance: "正在核对钱包余额…", checkBalance: "检查钱包余额", recheckBalance: "重新检查余额", balanceCheckTitle: "付款前余额检查", balanceCheckText: "先核对 Solana 主网上的官方 USDT 和 SOL 手续费余额，不会发起付款。", balanceReady: "余额充足，请再次点击支付。", balanceCheckFailed: "暂时无法核对钱包余额，请点击重新检查。", insufficientWalletFunds: "钱包余额不足，交易未提交。请补充 Solana 主网 USDT 和 SOL 后重新检查。",
      securityCopy: "第一步只签署不扣款的归属证明并创建订单；第二步由您再次点击并确认明确的 USDT 转账。还需少量 SOL 支付手续费。官方绝不会索取助记词、私钥或无限授权。",
      inviteTitle: "我的专属邀请链接", inviteHint: "连接钱包后生成。邀请地址会随已付款订单登记，奖励资格由官方复核。",
      copy: "复制", copied: "已复制", firstTouch: "采用首次有效邀请访问记录；付款前请核对邀请钱包。",
      auditTitle: "邀请归属补审", auditHint: "如通过官方链接购买但实际由节点伙伴邀请，可提交订单和交易申请人工复核。",
      applyAudit: "申请重新审计", treasuryLabel: "官方收款钱包 Owner", treasuryHint: "仅用于核对。请通过本页面生成的订单付款，不要手工转账。",
      auditFormTitle: "邀请归属补审申请", auditFormIntro: "请提供链上交易签名、购买钱包和邀请人钱包。提交不代表自动改绑，官方将依据订单与链上数据复核。",
      buyerWallet: "购买钱包", referrerWallet: "邀请人钱包", transactionSignature: "购买交易签名", contact: "联系方式", purchaseTier: "购买档位",
      evidence: "补充说明与证据", evidencePlaceholder: "请说明邀请时间、沟通方式及可供核验的证据。", cancel: "取消", submitAudit: "提交申请",
      noWallet: "未检测到可用的 Solana 钱包。请选择手机钱包打开本网站，或安装并解锁兼容扩展。",
      connecting: "正在连接…", walletFailed: "钱包连接失败，请在钱包中重新授权。", walletChanged: "付款钱包已切换，请重新核对订单。",
      auditInvalidWallet: "请检查购买钱包和邀请人钱包地址。", auditInvalidSignature: "请填写有效的 Solana 交易签名。",
      auditSubmitting: "正在提交…", auditSuccess: "申请已提交，官方将按订单和链上记录复核。", auditFailed: "提交失败，请稍后重试或联系官方。",
      paymentUnavailable: "USDT 支付服务尚未就绪，当前不会发起付款。", paymentFailed: "付款未完成。请查看钱包或错误提示后重试。", requestTimeout: "订单服务响应超时，尚未发起付款。请稍后重试。",
      walletRequired: "请先连接付款钱包。", confirmRequired: "请勾选钱包与订单确认。", orderInvalid: "订单安全校验失败，未调起钱包。",
      saleClosed: "正式节点销售当前未开放。", soldOut: "该档位已售罄或暂时被订单占用。",
      paymentSubmitted: "交易已提交，正在等待主网确认，请勿重复付款。", paymentVerified: "付款已核验，NFT 正在等待发放。", testPaymentVerified: "0.5 USDT 主网测试付款已核验成功。",
      latestOrder: "最近订单", refreshStatus: "刷新状态", orderNumber: "订单号", orderReferrer: "邀请登记", eligibilityReview: "奖励资格待复核", testReferralRecord: "测试登记 · 无奖励", paymentTransaction: "付款交易", nftMint: "NFT Mint", issuanceTransaction: "发放交易",
      statusAwaiting: "等待付款", statusConfirming: "主网确认中", statusTestPaid: "0.5 USDT 测试付款成功", statusNftPending: "已付款 · NFT 待发放", statusManualReview: "付款已核验 · 人工复核", statusNftIssued: "NFT 已发放", statusFailed: "订单失败", statusExpired: "订单已过期", statusUnknown: "订单处理中",
      noteAwaiting: "订单已创建。只有钱包签名并通过链上核验后才算付款成功。", noteConfirming: "交易正在等待 Solana Mainnet 最终确认，请勿再次支付。",
      noteTestPaid: "0.5 USDT 已在 Solana Mainnet 核验到账，付款与邀请登记链路测试完成。本测试订单不产生正式节点权益、NFT 或邀请奖励。", noteNftPending: "USDT 付款已核验，邀请地址已随订单登记并等待资格复核；NFT 将发放至付款钱包。", noteManualReview: "USDT 已到账，但订单需要官方人工核对库存或重复付款边界。请勿再次付款。", noteNftIssued: "NFT 已发放，可通过 Mint 和发放交易在链上核对。",
      noteFailed: "该订单未完成，请重新创建订单。", noteExpired: "订单已过期，未付款可重新创建；如已签名请联系官方并提供交易签名。",
      statusRefreshFailed: "暂时无法更新订单状态，请稍后刷新。", close: "关闭"
    },
    en: {
      buyNode: "Buy a node", purchaseTitle: "Buy a Turing Node",
      testBuyNode: "Test payment · 0.5 USDT", testPurchaseTitle: "0.5 USDT Mainnet Payment Test",
      testBannerTitle: "0.5 USDT Mainnet payment test", testBannerText: "Validates payment, referral recording, and order status only. It grants no production node rights, NFT, or referral reward.",
      testTierMeta: "Real Mainnet payment · No production rights", testRightsNotice: "This order only validates the Solana Mainnet USDT payment flow. A successful test records test status and grants no node rights, NFT, or referral reward.",
      testOwnerConfirm: "I understand this is a 0.5 USDT Mainnet test payment and grants no production node rights, NFT, or referral reward.",
      testSecurityCopy: "Step one signs a no-charge test-order proof. Step two confirms the 0.5 USDT Mainnet payment. Bitget may label it Contract Interaction; that prompt is the actual payment. A small SOL balance is also required.",
      checkingPaymentTitle: "Checking sale status", checkingPaymentText: "Reading the Mainnet production-sale status.",
      paymentLockedTitle: "Payment service unavailable", paymentLockedText: "No payment can be initiated right now. Please try again later.",
      paymentReadyTitle: "Solana Mainnet · USDT checkout ready", paymentReadyText: "The server creates the order. Verified payments enter the NFT queue; the referral address is recorded and eligibility is reviewed by the team.",
      connectWalletTitle: "Connect payment wallet", connectWalletHint: "Node rights and the NFT certificate will be issued to this address.",
      connectWallet: "Connect Solana wallet", connectedWallet: "Connected", disconnect: "Disconnect", chooseWallet: "Choose a wallet",
      walletCompatibilityNote: "Supports Wallet Standard, the latest MetaMask, Bitget Wallet, TokenPocket, and OKX Wallet (6.90.1+ recommended). Bitget/TP reopen this site inside the wallet. Watch-only addresses cannot pay; cold wallets require Solana message and transaction signing through compatible software, such as TP offline signing or Keystone with Solflare.",
      detectedWallet: "Detected", openWallet: "Open wallet", walletStandardLabel: "Compatible wallet", walletLoading: "Preparing connection…", walletRetry: "Reload connector", walletOpenHint: "The wallet was opened. Continue inside the wallet app.",
      metamaskName: "MetaMask", bitgetName: "Bitget Wallet", tokenPocketName: "TokenPocket", okxName: "OKX Wallet", noCompatibleWallet: "No compatible wallet was detected in this browser. Use one of the mobile-wallet buttons below to open this site.",
      chooseTier: "Choose a node tier", tierHint: "Production tiers accept USDT on Solana Mainnet only.", totalSupply: "Supply", referralReward: "Referral NFT",
      confirmPayment: "Confirm USDT payment", paymentHint: "Orders accept only the official USDT on Solana Mainnet. The order service determines the exact amount.",
      nodePrice: "Node price", paymentAsset: "Payment asset", paymentNetwork: "Network", officialMint: "Official USDT mint",
      referralSource: "Referral attribution", officialDirect: "Official direct", invalidSelfReferral: "Self-referral ignored · official direct",
      rightsNotice: "After payment verification, node rights and the NFT certificate will be issued to this wallet. Do not use an exchange or custodial address.",
      walletOwnerConfirm: "I control this wallet and have checked the node tier, USDT amount, and referral attribution.",
      lockedButton: "Payment service unavailable", payNow: "Sign ownership proof and create order", processingPayment: "Creating a secure order…", paying: "Waiting for wallet payment confirmation…",
      orderReadyTitle: "Payment order is ready", orderReadyText: "The next wallet prompt is the USDT payment for this order. Bitget may label it Contract Interaction; there is no third payment prompt.", preparingPaymentTitle: "Preparing the payment", preparingPaymentText: "Fetching the latest block data. Once enabled, one tap will open your wallet.", openingWalletTitle: "Opening your wallet", openingWalletText: "This wallet prompt is the USDT payment. Verify the amount shown on the site and confirm; no third prompt follows.", checkingChainTitle: "Checking the on-chain payment", checkingChainText: "The wallet has not returned a final result. Do not pay again while the chain record is checked.", payPreparedOrder: "Pay USDT", orderPrepared: "Secure order created. Tap the payment button to continue.", returnToBrowser: "If the wallet does not return automatically, come back to this page to view the on-chain status.",
      refreshingPayment: "Refreshing payment transaction…", refreshPayment: "Refresh payment transaction", paymentRefreshed: "Payment transaction refreshed. Tap Pay again.",
      paymentUncertain: "Checking the on-chain payment. Do not pay again.", retryPaymentReady: "No submitted payment was found. The transaction is refreshed and ready to retry.", orderExpiredRecreate: "This order is too close to expiry. Payment was stopped; create a new order.",
      checkingBalance: "Checking wallet balance…", checkBalance: "Check wallet balance", recheckBalance: "Check balance again", balanceCheckTitle: "Pre-payment balance check", balanceCheckText: "Checks official Solana USDT and the SOL fee balance without initiating payment.", balanceReady: "Balance is sufficient. Tap Pay again to continue.", balanceCheckFailed: "The wallet balance could not be checked. Tap to try again.", insufficientWalletFunds: "Wallet balance is insufficient and no transaction was submitted. Add Solana USDT and SOL, then check again.",
      securityCopy: "Step one signs a no-charge ownership proof and creates the order. Step two requires another tap to confirm the explicit USDT transfer. A small SOL balance is required for fees. Turing never asks for a seed phrase, private key, or unlimited approval.",
      inviteTitle: "My referral link", inviteHint: "Generated after wallet connection. The address is recorded with a paid order; reward eligibility is reviewed by the team.",
      copy: "Copy", copied: "Copied", firstTouch: "The first valid referral visit is retained. Verify the referrer wallet before paying.",
      auditTitle: "Referral re-audit", auditHint: "If you used the official link but were referred by a node partner, submit the order and transaction for manual review.",
      applyAudit: "Request re-audit", treasuryLabel: "Official treasury owner", treasuryHint: "For verification only. Pay through an order generated on this page; do not transfer manually.",
      auditFormTitle: "Referral attribution review", auditFormIntro: "Provide the transaction signature, buyer wallet, and referrer wallet. Submission does not automatically change attribution; the team reviews the order and on-chain data.",
      buyerWallet: "Buyer wallet", referrerWallet: "Referrer wallet", transactionSignature: "Payment signature", contact: "Contact", purchaseTier: "Purchase tier",
      evidence: "Details and evidence", evidencePlaceholder: "Describe when and how the referral occurred and what can be verified.", cancel: "Cancel", submitAudit: "Submit request",
      noWallet: "No supported Solana wallet was detected. Open this site with a listed mobile wallet or install and unlock a compatible extension.",
      connecting: "Connecting…", walletFailed: "Wallet connection failed. Please authorize it again.", walletChanged: "The payment wallet changed. Review the order again.",
      auditInvalidWallet: "Check the buyer and referrer wallet addresses.", auditInvalidSignature: "Enter a valid Solana transaction signature.",
      auditSubmitting: "Submitting…", auditSuccess: "Request submitted. The team will review the order and on-chain records.", auditFailed: "Submission failed. Try again later or contact the official team.",
      paymentUnavailable: "The USDT checkout is not ready; no payment will be initiated.", paymentFailed: "Payment was not completed. Review the wallet or error message and try again.", requestTimeout: "The order service timed out. No payment was initiated; please try again.",
      walletRequired: "Connect the payment wallet first.", confirmRequired: "Confirm the wallet and order details first.", orderInvalid: "Order security validation failed. The wallet was not opened.",
      saleClosed: "The production node sale is currently closed.", soldOut: "This tier is sold out or all remaining slots are temporarily reserved.",
      paymentSubmitted: "Transaction submitted and awaiting Mainnet confirmation. Do not pay again.", paymentVerified: "Payment verified. The NFT is awaiting issuance.", testPaymentVerified: "The 0.5 USDT Mainnet test payment is verified.",
      latestOrder: "Latest order", refreshStatus: "Refresh status", orderNumber: "Order ID", orderReferrer: "Referral record", eligibilityReview: "Eligibility review pending", testReferralRecord: "Test record · No reward", paymentTransaction: "Payment transaction", nftMint: "NFT mint", issuanceTransaction: "Issuance transaction",
      statusAwaiting: "Awaiting payment", statusConfirming: "Confirming on Mainnet", statusTestPaid: "0.5 USDT test payment complete", statusNftPending: "Paid · NFT pending", statusManualReview: "Payment verified · Manual review", statusNftIssued: "NFT issued", statusFailed: "Order failed", statusExpired: "Order expired", statusUnknown: "Order processing",
      noteAwaiting: "The order is created. It is not paid until the wallet signs and the transaction passes on-chain verification.", noteConfirming: "The transaction is awaiting final confirmation on Solana Mainnet. Do not pay again.",
      noteTestPaid: "The 0.5 USDT payment was verified on Solana Mainnet and the payment/referral-recording test is complete. This test order grants no production node rights, NFT, or referral reward.", noteNftPending: "The USDT payment is verified. The referral address is recorded pending eligibility review, and the NFT will be issued to the payment wallet.", noteManualReview: "USDT was received, but the team must review an inventory or duplicate-payment edge case. Do not pay again.", noteNftIssued: "The NFT has been issued. Verify the mint and issuance transaction on-chain.",
      noteFailed: "This order did not complete. Create a new order to retry.", noteExpired: "The order expired. Create a new order if unpaid; if you already signed, contact support with the transaction signature.",
      statusRefreshFailed: "Order status is temporarily unavailable. Please refresh later.", close: "Close"
    }
  };

  const $ = id => document.getElementById(id);
  const purchaseDialog = $("node-purchase-dialog");
  const auditDialog = $("referral-audit-dialog");
  const buyButton = $("node-buy-button");
  const connectButton = $("wallet-connect-button");
  const disconnectButton = $("wallet-disconnect-button");
  const walletPicker = $("wallet-picker");
  const walletProviderList = $("wallet-provider-list");
  const walletAddressBox = $("wallet-address");
  const tierList = $("node-tier-list");
  const submitButton = $("node-purchase-submit");
  const paymentButton = $("node-payment-submit");
  const paymentActionPanel = $("payment-action-panel");
  const ownerConfirm = $("wallet-owner-confirm");
  const inviteInput = $("invite-link");
  const copyInviteButton = $("copy-invite-link");
  const auditForm = $("referral-audit-form");
  const auditStatus = $("audit-form-status");

  const testMode = new URLSearchParams(location.search).get("node_test") === "1";
  const tiers = testMode && config.testTier ? [config.testTier] : [...config.tiers];
  const recentOrderStorageKey = `${config.recentOrderStorageKey}${testMode ? "-test" : ""}`;
  const pendingPaymentStorageKey = `${config.pendingPaymentStorageKey || "turing-node-pending-payment-v1"}${testMode ? "-test" : ""}`;
  let lang = getLanguage();
  let selectedTier = tiers[0];
  let provider = null;
  let boundProvider = null;
  let walletAddress = "";
  let activeReferrer = captureReferral();
  const preparedBlockhashMaxAgeMs = 45000;
  const pendingRefreshIntervalMs = 15000;
  const pendingExpirySafetyMs = 60000;
  const attemptedPaymentRetentionMs = 24 * 60 * 60 * 1000;
  let currentOrder = loadRecentOrder();
  let pendingPayment = loadPendingPayment();
  let orderPollTimer = null;
  let busy = false;
  let busyAction = "";
  let refreshingPayment = false;
  let balanceCheck = null;
  let returnToPurchase = false;
  let saleAvailability = { loaded: false, formal: false, test: false };

  if (pendingPayment?.tierId) selectedTier = tiers.find(item => item.id === pendingPayment.tierId) || selectedTier;

  function getLanguage() {
    return document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function t(key) {
    return i18n[lang][key] || i18n.zh[key] || key;
  }

  function truncate(value, head = 6, tail = 6) {
    return value ? `${value.slice(0, head)}…${value.slice(-tail)}` : "";
  }

  function decodeBase58(value) {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    if (!value || typeof value !== "string") return null;
    const bytes = [0];
    for (const char of value) {
      const digit = alphabet.indexOf(char);
      if (digit < 0) return null;
      let carry = digit;
      for (let index = 0; index < bytes.length; index += 1) {
        carry += bytes[index] * 58;
        bytes[index] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }
    for (let index = 0; index < value.length - 1 && value[index] === "1"; index += 1) bytes.push(0);
    return Uint8Array.from(bytes.reverse());
  }

  function isSolanaAddress(value) {
    const decoded = decodeBase58((value || "").trim());
    return Boolean(decoded && decoded.length === 32);
  }

  function isSignature(value) {
    return /^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test((value || "").trim());
  }

  function isOrderId(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
  }

  function toBaseUnits(value, decimals) {
    const normalized = String(value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
    const [whole, fraction = ""] = normalized.split(".");
    if (fraction.length > decimals) return null;
    return (BigInt(whole) * (10n ** BigInt(decimals)) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals))).toString();
  }

  function bytesToBase64(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    return btoa(binary);
  }

  function formatUsdt(value) {
    const number = Number(value);
    const digits = Number.isInteger(number) ? 0 : 1;
    return `${new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: 6 }).format(number)} USDT`;
  }

  function fromBaseUnits(value, decimals = 6) {
    const raw = String(value || "0").replace(/^\+/, "");
    if (!/^\d+$/.test(raw)) return "0";
    const padded = raw.padStart(decimals + 1, "0");
    const whole = padded.slice(0, -decimals);
    const fraction = padded.slice(-decimals).replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : whole;
  }

  function orderMemoFor(tier, orderId) {
    const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number(tier.amountUsdt));
    return `TURING NODE PURCHASE | ${tier.level} ${tier.en.toUpperCase()} | ${amount} USDT | ORDER ${orderId}`;
  }

  function captureReferral() {
    const incoming = new URLSearchParams(location.search).get("ref");
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(config.referralStorageKey) || "null"); } catch (_) { stored = null; }
    const maxAge = Number(config.referralTtlDays || 30) * 86400000;
    if (stored?.address && isSolanaAddress(stored.address) && Date.now() - Date.parse(stored.firstSeenAt || 0) <= maxAge) return stored.address;
    if (!isSolanaAddress(incoming)) return "";
    try { localStorage.setItem(config.referralStorageKey, JSON.stringify({ address: incoming, firstSeenAt: new Date().toISOString() })); } catch (_) { /* Current visit remains valid. */ }
    return incoming;
  }

  function effectiveReferrer() {
    if (!activeReferrer || (walletAddress && activeReferrer === walletAddress)) return "";
    return activeReferrer;
  }

  function loadRecentOrder() {
    try {
      const value = JSON.parse(localStorage.getItem(recentOrderStorageKey) || "null");
      if (!isOrderId(value?.id) || typeof value?.customerToken !== "string" || value.customerToken.length < 32) return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  function loadPendingPayment() {
    try {
      const value = JSON.parse(localStorage.getItem(pendingPaymentStorageKey) || sessionStorage.getItem(pendingPaymentStorageKey) || "null");
      if (!isOrderId(value?.orderId) || typeof value?.transactionBase64 !== "string" || value.transactionBase64.length < 100) return null;
      if (!isSolanaAddress(value?.buyer) || !tiers.some(item => item.id === value?.tierId) || !value?.expected) return null;
      const expiresAt = Date.parse(value.expiresAt || "");
      if (!Number.isFinite(expiresAt)) return null;
      if (value.paymentAttemptedAt ? expiresAt <= Date.now() - attemptedPaymentRetentionMs : expiresAt <= Date.now() + pendingExpirySafetyMs) return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  function savePendingPayment() {
    try {
      sessionStorage.removeItem(pendingPaymentStorageKey);
      if (pendingPayment) localStorage.setItem(pendingPaymentStorageKey, JSON.stringify(pendingPayment));
      else localStorage.removeItem(pendingPaymentStorageKey);
    } catch (_) { /* The prepared order remains available in the current page. */ }
  }

  function clearPendingPayment() {
    pendingPayment = null;
    balanceCheck = null;
    savePendingPayment();
    renderPaymentAction();
  }

  function pendingMatchesContext() {
    return Boolean(
      pendingPayment && walletAddress && pendingPayment.buyer === walletAddress &&
      pendingPayment.tierId === selectedTier.id && currentOrder?.id === pendingPayment.orderId &&
      (pendingOrderHasTime() || Boolean(pendingPayment.paymentAttemptedAt))
    );
  }

  function pendingOrderHasTime(value = pendingPayment) {
    const expiresAt = Date.parse(value?.expiresAt || "");
    return Number.isFinite(expiresAt) && expiresAt - Date.now() > pendingExpirySafetyMs;
  }

  function expireUnsafePendingPayment(showMessage = false) {
    if (!pendingPayment || pendingOrderHasTime()) return false;
    if (pendingPayment.paymentAttemptedAt) return false;
    clearPendingPayment();
    ownerConfirm.checked = false;
    updateSubmitState();
    if (showMessage) showToast(t("orderExpiredRecreate"), "error");
    return true;
  }

  function saveRecentOrder() {
    if (!currentOrder) return;
    const safe = {
      id: currentOrder.id,
      customerToken: currentOrder.customerToken,
      buyer: currentOrder.buyer || "",
      tierId: currentOrder.tierId || "",
      status: currentOrder.status || "awaiting_payment",
      signature: currentOrder.signature || currentOrder.paymentSignature || "",
      paymentSignature: currentOrder.paymentSignature || currentOrder.signature || "",
      referrer: currentOrder.referrer || "",
      referralStatus: currentOrder.referralStatus || "",
      nftMint: currentOrder.nftMint || "",
      issuanceSignature: currentOrder.issuanceSignature || "",
      isTest: Boolean(currentOrder.isTest),
      createdAt: currentOrder.createdAt || new Date().toISOString(),
      expiresAt: currentOrder.expiresAt || ""
    };
    try { localStorage.setItem(recentOrderStorageKey, JSON.stringify(safe)); } catch (_) { /* Status still works for this session. */ }
  }

  function mergeOrder(payload) {
    const order = payload?.order || payload || {};
    currentOrder = {
      ...(currentOrder || {}),
      ...order,
      id: order.id || order.orderId || currentOrder?.id,
      customerToken: currentOrder?.customerToken || payload?.customerToken,
      signature: order.paymentSignature || currentOrder?.signature || ""
    };
    saveRecentOrder();
    renderOrderStatus();
    return currentOrder;
  }

  function applyLanguage() {
    lang = getLanguage();
    document.querySelectorAll("[data-node-i18n]").forEach(node => {
      const value = t(node.dataset.nodeI18n);
      if (value) node.textContent = value;
    });
    document.querySelectorAll("[data-node-i18n-placeholder]").forEach(node => { node.placeholder = t(node.dataset.nodeI18nPlaceholder); });
    document.querySelectorAll("[data-node-i18n-aria]").forEach(node => { node.setAttribute("aria-label", t(node.dataset.nodeI18nAria)); });
    $("node-purchase-close").setAttribute("aria-label", t("close"));
    $("referral-audit-close").setAttribute("aria-label", t("close"));
    buyButton.setAttribute("aria-label", t(testMode ? "testBuyNode" : "buyNode"));
    if (testMode) {
      buyButton.querySelector("span").textContent = t("testBuyNode");
      $("node-purchase-title").textContent = t("testPurchaseTitle");
    }
    $("payment-test-banner").hidden = !testMode;
    purchaseDialog.classList.toggle("test-mode", testMode);
    renderTiers();
    renderReferral();
    renderPaymentSummary();
    renderOrderStatus();
    if (!walletPicker.hidden) renderWalletPicker();
    updatePaymentState();
  }

  function renderTiers() {
    tierList.innerHTML = tiers.map(tier => `
      <label class="tier-option ${tier.id === selectedTier.id ? "selected" : ""}">
        <input type="radio" name="node-tier" value="${tier.id}" ${tier.id === selectedTier.id ? "checked" : ""}>
        <picture class="tier-certificate-picture"><source srcset="${tier.certificateImage}" type="image/webp"><img class="tier-certificate" src="${tier.certificateFallback || tier.certificateImage}" alt="" width="56" height="56" loading="lazy" decoding="async"></picture>
        <span class="tier-level">${tier.level}</span>
        <span class="tier-copy"><b>${lang === "zh" ? tier.zh : tier.en}</b><small>${tier.test ? t("testTierMeta") : `${t("totalSupply")} ${tier.supply} · ${t("referralReward")} 10%`}</small></span>
        <strong>${formatUsdt(tier.amountUsdt)}</strong>
      </label>`).join("");
    tierList.querySelectorAll("input").forEach(input => input.addEventListener("change", () => {
      selectedTier = tiers.find(item => item.id === input.value) || tiers[0];
      ownerConfirm.checked = false;
      renderTiers();
      renderPaymentSummary();
      updateSubmitState();
    }));
  }

  const connectorScripts = new Map();
  const connectorStatus = new Map([["metamask", "idle"], ["okx", "idle"]]);

  function connectorScript(kind) {
    return kind === "metamask" ? "./metamask-solana-connector.js" : "./okx-solana-connector.js";
  }

  function loadConnectorScript(src) {
    if (connectorScripts.has(src)) return connectorScripts.get(src);
    const promise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-wallet-connector="${src}"]`);
      if (existing?.dataset.loaded === "true") return resolve();
      const script = existing || document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.walletConnector = src;
      script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
      script.addEventListener("error", () => {
        connectorScripts.delete(src);
        script.remove();
        reject(new Error(`Unable to load ${src}`));
      }, { once: true });
      if (!existing) document.head.appendChild(script);
    });
    connectorScripts.set(src, promise);
    return promise;
  }

  function preloadConnector(kind) {
    if (connectorStatus.get(kind) === "ready" || connectorStatus.get(kind) === "loading") return;
    connectorStatus.set(kind, "loading");
    if (!walletPicker.hidden) renderWalletPicker();
    loadConnectorScript(connectorScript(kind)).then(async () => {
      const connector = kind === "metamask" ? window.TURING_METAMASK_SOLANA : window.TURING_OKX_SOLANA;
      if (!connector) throw new Error(`${kind} connector did not initialize`);
      await connector.ready;
      connectorStatus.set(kind, "ready");
      if (!walletPicker.hidden) renderWalletPicker();
    }).catch(() => {
      const src = connectorScript(kind);
      connectorScripts.delete(src);
      document.querySelector(`script[data-wallet-connector="${src}"]`)?.remove();
      connectorStatus.set(kind, "error");
      if (!walletPicker.hidden) renderWalletPicker();
    });
  }

  function walletProviderIsCompatible(item) {
    return Boolean(item && typeof item.connect === "function" && typeof item.signMessage === "function" &&
      (typeof item.signTransaction === "function" || typeof item.signAndSendTransaction === "function"));
  }

  function legacyWalletOptions() {
    const injectedSolana = window.solana;
    const entries = [
      ["phantom", "Phantom", window.phantom?.solana],
      ["solflare", "Solflare", window.solflare],
      ["backpack", "Backpack", window.backpack?.solana],
      ["okx", t("okxName"), window.okxwallet?.solana || window.okxwallet?.solanaProvider],
      ["bitget", t("bitgetName"), window.bitkeep?.solana || window.bitgetWallet?.solana || ((injectedSolana?.isBitKeep || injectedSolana?.isBitget) ? injectedSolana : null)],
      ["tokenpocket", t("tokenPocketName"), window.tokenpocket?.solana || window.tp?.solana || ((injectedSolana?.isTokenPocket || injectedSolana?.isTP) ? injectedSolana : null)],
      ["injected", "Solana Wallet", injectedSolana]
    ];
    const seen = new Set();
    return entries.filter(([, , item]) => {
      if (!walletProviderIsCompatible(item) || seen.has(item)) return false;
      seen.add(item);
      return true;
    }).map(([id, name, item]) => ({ id: `injected:${id}`, name, provider: item, detected: true }));
  }

  function standardWalletOptions() {
    return (window.TURING_WALLET_STANDARD?.list?.() || []).map(item => ({ ...item, detected: true }));
  }

  function walletOptions() {
    const options = [...standardWalletOptions(), ...legacyWalletOptions()];
    const names = new Set();
    const unique = options.filter(item => {
      const normalized = item.name.toLowerCase().replace(/\s+wallet$/i, "").replace(/\s+/g, "");
      if (names.has(normalized)) return false;
      names.add(normalized);
      return true;
    });
    const has = value => Array.from(names).some(name => name.includes(value));
    if (!has("metamask")) unique.push({ id: "connector:metamask", name: t("metamaskName"), connector: "metamask", detected: false });
    if (!has("okx")) unique.push({ id: "connector:okx", name: t("okxName"), connector: "okx", detected: false });
    if (!has("bitget") && !has("bitkeep")) unique.push({ id: "deeplink:bitget", name: t("bitgetName"), deeplink: "bitget", detected: false });
    if (!has("tokenpocket")) unique.push({ id: "deeplink:tokenpocket", name: t("tokenPocketName"), deeplink: "tokenpocket", detected: false });
    return unique;
  }

  function walletAppUrl(kind) {
    const target = ["http:", "https:"].includes(location.protocol) ? location.href : `https://meta9898.shop/${location.search}${location.hash}`;
    if (kind === "bitget") return `https://bkcode.vip?action=dapp&url=${encodeURIComponent(target)}`;
    const params = encodeURIComponent(JSON.stringify({ url: target, chain: "SOLANA", source: "Turing" }));
    return `tpdapp://open?params=${params}`;
  }

  function renderWalletPicker() {
    const options = walletOptions();
    walletProviderList.textContent = "";
    const detectedCount = options.filter(item => item.detected || item.standard || item.provider).length;
    if (!detectedCount) {
      const note = document.createElement("p");
      note.className = "wallet-empty-note";
      note.textContent = t("noCompatibleWallet");
      walletProviderList.appendChild(note);
    }
    options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wallet-provider-option";
      button.dataset.walletOption = option.id;
      button.setAttribute("role", "listitem");
      const connectorState = option.connector ? connectorStatus.get(option.connector) : "ready";
      button.disabled = connectorState === "loading";
      const badge = document.createElement("span");
      badge.className = "wallet-provider-badge";
      if (option.icon?.startsWith("data:")) {
        const image = document.createElement("img");
        image.src = option.icon;
        image.alt = "";
        badge.appendChild(image);
      } else {
        badge.textContent = option.name.slice(0, 1).toUpperCase();
      }
      const copy = document.createElement("span");
      copy.className = "wallet-provider-copy";
      const name = document.createElement("strong");
      name.textContent = option.name;
      const status = document.createElement("small");
      status.textContent = connectorState === "loading" ? t("walletLoading") : connectorState === "error" ? t("walletRetry") :
        option.detected || option.standard || option.provider ? t("detectedWallet") : t("openWallet");
      copy.append(name, status);
      const arrow = document.createElement("span");
      arrow.className = "wallet-provider-arrow";
      arrow.textContent = "›";
      button.append(badge, copy, arrow);
      button.addEventListener("click", () => {
        if (option.connector && connectorStatus.get(option.connector) !== "ready") return preloadConnector(option.connector);
        connectWalletOption(option, button);
      });
      walletProviderList.appendChild(button);
    });
  }

  function setWalletPicker(open) {
    walletPicker.hidden = !open;
    connectButton.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) return;
    preloadConnector("metamask");
    preloadConnector("okx");
    renderWalletPicker();
  }

  function walletAddressFrom(providerValue, response) {
    const account = Array.isArray(response) ? response[0] : response?.accounts?.[0];
    let providerAccount = null;
    try { providerAccount = providerValue?.getAccount?.(); } catch (_) { /* Public key fallbacks remain available. */ }
    const value = response?.publicKey || account?.publicKey || account?.address || account ||
      providerAccount?.publicKey || providerAccount?.address || providerValue?.publicKey;
    return value?.toString?.() || String(value || "");
  }

  function unbindProviderEvents() {
    if (!boundProvider) return;
    const remove = boundProvider.removeListener?.bind(boundProvider) || boundProvider.off?.bind(boundProvider);
    remove?.("accountChanged", onAccountChanged);
    remove?.("accountsChanged", onAccountChanged);
    remove?.("disconnect", onWalletDisconnected);
    boundProvider = null;
  }

  function onAccountChanged(publicKey) {
    const value = Array.isArray(publicKey) ? publicKey[0] : publicKey;
    if (!value) return disconnectWallet(false);
    const next = value?.publicKey?.toString?.() || value?.address || value.toString();
    if (!isSolanaAddress(next)) return disconnectWallet(false);
    if (next === walletAddress) return;
    walletAddress = next;
    if (pendingPayment?.buyer && pendingPayment.buyer !== next) clearPendingPayment();
    ownerConfirm.checked = false;
    showToast(t("walletChanged"), "info");
    renderWallet();
  }

  function onWalletDisconnected() {
    disconnectWallet(false);
  }

  function bindProviderEvents(walletProvider) {
    unbindProviderEvents();
    if (typeof walletProvider.on !== "function") return;
    walletProvider.on("accountChanged", onAccountChanged);
    walletProvider.on("accountsChanged", onAccountChanged);
    walletProvider.on("disconnect", onWalletDisconnected);
    boundProvider = walletProvider;
  }

  async function connectWalletOption(option, button) {
    button.disabled = true;
    const status = button.querySelector("small");
    status.textContent = t("connecting");
    try {
      if (option.deeplink) {
        showToast(t("walletOpenHint"), "info");
        location.href = walletAppUrl(option.deeplink);
        return;
      }
      if (option.standard) {
        provider = await window.TURING_WALLET_STANDARD.connectWallet(option.wallet);
      } else if (option.connector === "metamask") {
        if (!window.TURING_METAMASK_SOLANA) throw new Error("MetaMask connector is not ready");
        provider = await window.TURING_METAMASK_SOLANA.connect();
      } else if (option.connector === "okx") {
        if (!window.TURING_OKX_SOLANA) throw new Error("OKX connector is not ready");
        provider = await window.TURING_OKX_SOLANA.connect();
      } else {
        provider = option.provider;
      }
      const response = option.provider ? await provider.connect() : { publicKey: provider.publicKey };
      const address = walletAddressFrom(provider, response);
      if (!isSolanaAddress(address)) throw new Error("Invalid wallet public key");
      walletAddress = address;
      bindProviderEvents(provider);
      setWalletPicker(false);
      renderWallet();
    } catch (error) {
      console.warn("Turing wallet connection rejected:", error?.message || error);
      showToast(t("walletFailed"), "error");
    } finally {
      button.disabled = false;
      status.textContent = option.detected || option.standard || option.provider ? t("detectedWallet") : t("openWallet");
    }
  }

  async function disconnectWallet(requestProvider = true) {
    const previous = provider;
    unbindProviderEvents();
    walletAddress = "";
    provider = null;
    ownerConfirm.checked = false;
    renderWallet();
    if (requestProvider && previous?.disconnect) {
      try { await previous.disconnect(); } catch (_) { /* Local disconnect is complete. */ }
    }
  }

  function renderWallet() {
    const connected = Boolean(walletAddress);
    connectButton.hidden = connected;
    if (connected) setWalletPicker(false);
    walletAddressBox.hidden = !connected;
    walletAddressBox.querySelector("code").textContent = connected ? truncate(walletAddress, 7, 7) : "";
    walletAddressBox.querySelector("code").title = walletAddress;
    $("audit-buyer-wallet").value = walletAddress;
    renderReferral();
    updateSubmitState();
    if (connected) window.setTimeout(refreshStalePendingPayment, 0);
  }

  function renderPaymentAction() {
    const prepared = pendingMatchesContext();
    paymentActionPanel.hidden = !prepared;
    submitButton.hidden = prepared;
    const uncertain = Boolean(pendingPayment?.paymentAttemptedAt);
    const fresh = pendingBlockhashIsFresh();
    const checkedBalance = balanceCheck?.orderId === pendingPayment?.orderId ? balanceCheck : null;
    const checkingBalance = Boolean(!uncertain && checkedBalance?.checking);
    const balanceBlocked = Boolean(checkedBalance && !checkedBalance.checking && !checkedBalance.enough);
    const needsBalanceCheck = Boolean(!uncertain && (!checkedBalance || balanceBlocked));
    paymentButton.disabled = !prepared || busy || refreshingPayment || checkingBalance || uncertain || !fresh || !paymentIsReady();
    paymentButton.classList.toggle("loading", busyAction === "pay" || refreshingPayment || checkingBalance);
    const label = checkingBalance ? t("checkingBalance") : needsBalanceCheck ? t(checkedBalance ? "recheckBalance" : "checkBalance") :
      busyAction === "pay" ? t("paying") : uncertain ? t("paymentUncertain") : refreshingPayment ? t("refreshingPayment") :
        !fresh ? t("refreshingPayment") : `${t("payPreparedOrder")} · ${formatUsdt(pendingPayment?.amountUsdt || selectedTier.amountUsdt)}`;
    paymentButton.querySelector("span").textContent = label;
    const title = $("payment-action-title");
    const text = $("payment-action-text");
    const stateKeys = (checkingBalance || needsBalanceCheck) ? ["balanceCheckTitle", "balanceCheckText"] : uncertain ? ["checkingChainTitle", "checkingChainText"] :
      busyAction === "pay" ? ["openingWalletTitle", "openingWalletText"] :
      (refreshingPayment || !fresh) ? ["preparingPaymentTitle", "preparingPaymentText"] : ["orderReadyTitle", "orderReadyText"];
    title.textContent = t(stateKeys[0]);
    text.textContent = balanceBlocked && checkedBalance.message ? checkedBalance.message : t(stateKeys[1]);
    if (!checkingBalance && !needsBalanceCheck && !uncertain && !refreshingPayment && fresh) {
      const amount = formatUsdt(pendingPayment?.amountUsdt || selectedTier.amountUsdt);
      const node = lang === "zh" ? `${selectedTier.level} ${selectedTier.zh}` : `${selectedTier.level} ${selectedTier.en}`;
      title.textContent = `${node} · ${amount}`;
      text.textContent = lang === "zh"
        ? `钱包“合约交互”购买的是 ${node}，支付 ${amount}。确认前请核对节点、金额、Solana Mainnet 和官方 USDT Mint。`
        : `The wallet “Contract Interaction” purchases ${node} for ${amount}. Verify the node, amount, Solana Mainnet, and official USDT mint.`;
    }
    paymentActionPanel.dataset.state = (checkingBalance || needsBalanceCheck || uncertain) ? "checking" : busyAction === "pay" ? "opening" : (refreshingPayment || !fresh) ? "preparing" : "ready";
    if (prepared && !fresh && !busy && !refreshingPayment && !uncertain) queueMicrotask(refreshStalePendingPayment);
  }

  function balanceErrorMessage(result) {
    if (!result.enoughUsdt) {
      const required = formatUsdt(fromBaseUnits(result.requiredUsdtBaseUnits, result.decimals));
      const available = formatUsdt(fromBaseUnits(result.usdtBaseUnits, result.decimals));
      return lang === "zh"
        ? `USDT 余额不足：需要 ${required}，当前 ${available}。请补充 Solana 主网官方 USDT。`
        : `Insufficient USDT: ${required} required, ${available} available. Add official USDT on Solana Mainnet.`;
    }
    if (!result.enoughSol) {
      const required = (Number(result.requiredSolLamports || 0) / 1e9).toFixed(6).replace(/0+$/, "");
      const available = (Number(result.solLamports || 0) / 1e9).toFixed(6).replace(/0+$/, "");
      return lang === "zh"
        ? `SOL 手续费余额不足：至少需要约 ${required} SOL，当前 ${available} SOL。`
        : `Insufficient SOL for fees: about ${required} SOL required, ${available} SOL available.`;
    }
    return "";
  }

  async function checkPreparedBalance(showFeedback = true) {
    if (!pendingMatchesContext() || !config.api?.balance) return false;
    const orderId = pendingPayment.orderId;
    balanceCheck = { orderId, checking: true, enough: false, message: "" };
    renderPaymentAction();
    try {
      const result = await apiJson(config.api.balance, {
        method: "POST",
        body: JSON.stringify({ buyer: walletAddress, tierId: selectedTier.id, testMode })
      });
      if (!pendingPayment || pendingPayment.orderId !== orderId || result.buyer !== walletAddress || result.tierId !== selectedTier.id) {
        throw Object.assign(new Error("Balance response mismatch"), { code: "BALANCE_RESPONSE_MISMATCH" });
      }
      balanceCheck = { ...result, orderId, checking: false, enough: Boolean(result.enough), message: balanceErrorMessage(result) };
      if (showFeedback) showToast(balanceCheck.enough ? t("balanceReady") : balanceCheck.message, balanceCheck.enough ? "success" : "error");
      return balanceCheck.enough;
    } catch (error) {
      console.warn("Turing wallet balance check failed:", error?.code || error?.message || error);
      balanceCheck = { orderId, checking: false, enough: false, message: t("balanceCheckFailed") };
      if (showFeedback) showToast(t("balanceCheckFailed"), "error");
      return false;
    } finally {
      renderPaymentAction();
    }
  }

  function pendingBlockhashIsFresh() {
    return Boolean(pendingPayment?.blockhashRefreshedAt && Date.now() - Number(pendingPayment.blockhashRefreshedAt) < preparedBlockhashMaxAgeMs);
  }

  async function refreshPendingBlockhash(showConfirmation = false) {
    if (!pendingMatchesContext() || pendingPayment?.paymentAttemptedAt || refreshingPayment || typeof window.TURING_USDT_PAYMENT?.refreshBlockhash !== "function") return false;
    const orderId = pendingPayment.orderId;
    refreshingPayment = true;
    renderPaymentAction();
    try {
      const refreshed = await window.TURING_USDT_PAYMENT.refreshBlockhash({
        transactionBase64: pendingPayment.transactionBase64,
        expected: pendingPayment.expected,
        refresh: {
          url: config.api.refresh,
          orderId: pendingPayment.orderId,
          customerToken: currentOrder?.customerToken
        }
      });
      if (!pendingPayment || pendingPayment.orderId !== orderId) return false;
      pendingPayment.transactionBase64 = refreshed.transactionBase64;
      pendingPayment.blockhashRefreshedAt = refreshed.refreshedAt;
      pendingPayment.lastValidBlockHeight = refreshed.lastValidBlockHeight;
      savePendingPayment();
      if (showConfirmation) showToast(t("paymentRefreshed"), "success");
      return true;
    } catch (error) {
      console.warn("Turing payment transaction refresh failed:", error?.message || error);
      if (showConfirmation) showToast(t("paymentFailed"), "error");
      return false;
    } finally {
      refreshingPayment = false;
      renderPaymentAction();
    }
  }

  function refreshStalePendingPayment() {
    if (expireUnsafePendingPayment(purchaseDialog.open)) return;
    if (document.hidden || busy || refreshingPayment || pendingPayment?.paymentAttemptedAt || !pendingMatchesContext() || pendingBlockhashIsFresh()) return;
    refreshPendingBlockhash(false);
  }

  function renderReferral() {
    const target = $("active-referrer");
    if (activeReferrer && walletAddress && activeReferrer === walletAddress) {
      target.textContent = t("invalidSelfReferral");
      target.title = activeReferrer;
    } else if (activeReferrer) {
      target.textContent = truncate(activeReferrer, 7, 7);
      target.title = activeReferrer;
    } else {
      target.textContent = t("officialDirect");
      target.removeAttribute("title");
    }
    if (walletAddress) {
      const url = new URL(location.href);
      url.searchParams.set("ref", walletAddress);
      url.hash = `#/${lang}/nodes`;
      inviteInput.value = url.toString();
      copyInviteButton.disabled = false;
    } else {
      inviteInput.value = "";
      inviteInput.placeholder = lang === "zh" ? "请先连接钱包" : "Connect wallet first";
      copyInviteButton.disabled = true;
    }
  }

  function renderPaymentSummary() {
    $("payment-amount").textContent = formatUsdt(selectedTier.amountUsdt);
    $("usdt-mint").textContent = config.token.mint;
    $("treasury-address").textContent = config.treasuryOwner;
    $("rights-notice-text").textContent = t(testMode ? "testRightsNotice" : "rightsNotice");
    ownerConfirm.nextElementSibling.textContent = t(testMode ? "testOwnerConfirm" : "walletOwnerConfirm");
    document.querySelector(".security-copy").textContent = t(testMode ? "testSecurityCopy" : "securityCopy");
  }

  function paymentIsReady() {
    return Boolean(
      config.purchaseEnabled && saleAvailability.loaded && saleAvailability.formal && (!testMode || saleAvailability.test) && config.network === "mainnet-beta" &&
      config.api?.create && config.api?.balance && config.api?.refresh && config.api?.broadcast && config.api?.verify && config.api?.status &&
      isSolanaAddress(config.token?.mint) && isSolanaAddress(config.token?.treasuryTokenAccount) &&
      typeof window.TURING_USDT_PAYMENT?.send === "function" &&
      typeof window.TURING_USDT_PAYMENT?.refreshBlockhash === "function" &&
      typeof window.TURING_USDT_PAYMENT?.validate === "function"
    );
  }

  function updatePaymentState() {
    const ready = paymentIsReady();
    const gate = $("payment-gate");
    gate.classList.toggle("ready", ready);
    const titleKey = ready ? "paymentReadyTitle" : (!saleAvailability.loaded ? "checkingPaymentTitle" : (saleAvailability.formal ? "paymentLockedTitle" : "saleClosed"));
    const textKey = ready ? "paymentReadyText" : (!saleAvailability.loaded ? "checkingPaymentText" : "paymentLockedText");
    gate.querySelector("b").textContent = testMode && ready ? t("testBannerTitle") : t(titleKey);
    gate.querySelector("p").textContent = testMode && ready ? t("testBannerText") : t(textKey);
    updateSubmitState();
  }

  async function loadSaleAvailability() {
    try {
      const result = await apiJson(config.api.publicConfig);
      if (result.network !== config.network || result.currency !== config.token.symbol || result.mint !== config.token.mint || result.treasuryOwner !== config.treasuryOwner || result.treasuryAta !== config.token.treasuryTokenAccount) {
        throw Object.assign(new Error("Sale configuration mismatch"), { code: "SALE_CONFIG_MISMATCH" });
      }
      saleAvailability = { loaded: true, formal: Boolean(result.saleEnabled), test: Boolean(result.paymentTestEnabled) };
    } catch (error) {
      console.warn("Turing sale status unavailable:", error?.code || error?.message || error);
      saleAvailability = { loaded: false, formal: false, test: false };
    }
    updatePaymentState();
  }

  function setBusy(action = "") {
    busyAction = action;
    busy = Boolean(action);
    submitButton.classList.toggle("loading", action === "prepare");
    updateSubmitState();
  }

  function updateSubmitState() {
    const ready = paymentIsReady();
    submitButton.disabled = !(ready && walletAddress && ownerConfirm.checked && !busy && !pendingMatchesContext());
    submitButton.querySelector("span").textContent = t(busyAction === "prepare" ? "processingPayment" : (ready ? "payNow" : "lockedButton"));
    renderPaymentAction();
  }

  async function apiJson(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(config.requestTimeoutMs || 30000));
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(options.headers || {})
        }
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.code = data.error || "HTTP_ERROR";
        error.status = response.status;
        throw error;
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function friendlyError(error) {
    const keys = {
      SALE_CLOSED: "saleClosed", SOLD_OUT: "soldOut", PAYMENT_TEST_DISABLED: "paymentUnavailable"
    };
    if (error?.name === "AbortError" || error?.code === 20) return t("requestTimeout");
    if (/insufficient|funds|balance/i.test(String(error?.message || ""))) return t("insufficientWalletFunds");
    return t(keys[error?.code] || "paymentFailed");
  }

  function validateCreatedOrder(order) {
    const expectedAmount = toBaseUnits(selectedTier.amountUsdt, config.token.decimals);
    const expectedMemo = orderMemoFor(selectedTier, order.orderId);
    return Boolean(
      isOrderId(order.orderId) && typeof order.customerToken === "string" && order.customerToken.length >= 32 &&
      typeof order.transactionBase64 === "string" && order.transactionBase64.length > 100 &&
      Number.isSafeInteger(Number(order.lastValidBlockHeight)) && Number(order.lastValidBlockHeight) > 0 &&
      order.buyer === walletAddress && order.currency === config.token.symbol &&
      order.mint === config.token.mint && order.treasuryOwner === config.treasuryOwner &&
      order.treasuryAta === config.token.treasuryTokenAccount && String(order.amountBaseUnits) === expectedAmount &&
      Boolean(order.isTest) === testMode && isSolanaAddress(order.buyerAta) && isSolanaAddress(order.reference) && order.memo === expectedMemo
    );
  }

  async function verifyCurrentOrder() {
    if (!currentOrder?.id || !currentOrder?.customerToken || !currentOrder?.signature) return null;
    const data = await apiJson(config.api.verify, {
      method: "POST",
      body: JSON.stringify({ orderId: currentOrder.id, customerToken: currentOrder.customerToken, signature: currentOrder.signature })
    });
    return mergeOrder(data);
  }

  function proofSignatureBytes(result) {
    const item = Array.isArray(result) ? result[0] : result;
    const value = item?.signature || item;
    if (value instanceof Uint8Array) return value;
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (typeof value === "string") {
      const base58 = decodeBase58(value);
      if (base58?.length === 64) return base58;
      try {
        const binary = atob(value);
        return Uint8Array.from(binary, character => character.charCodeAt(0));
      } catch (_) { return null; }
    }
    return null;
  }

  async function prepareNodeOrder() {
    if (!paymentIsReady()) return showToast(t("paymentUnavailable"), "error");
    if (!walletAddress) return showToast(t("walletRequired"), "error");
    if (!ownerConfirm.checked) return showToast(t("confirmRequired"), "error");
    const providerKey = provider?.publicKey?.toString?.() || walletAddress;
    if (providerKey !== walletAddress) {
      ownerConfirm.checked = false;
      renderWallet();
      return showToast(t("walletChanged"), "error");
    }

    setBusy("prepare");
    try {
      const timestamp = new Date().toISOString();
      const proofReferrer = effectiveReferrer() || "DIRECT";
      const proofMessage = `TURING NODE ORDER\nWallet: ${walletAddress}\nTier: ${selectedTier.id}\nReferrer: ${proofReferrer}\nTimestamp: ${timestamp}\nOrigin: ${location.origin}`;
      const proofResult = await provider.signMessage(new TextEncoder().encode(proofMessage), "utf8");
      const proofBytes = proofSignatureBytes(proofResult);
      const signatureBase64 = bytesToBase64(proofBytes);
      if (!signatureBase64 || signatureBase64.length < 80) throw new Error("Wallet proof signature is invalid");
      const order = await apiJson(config.api.create, {
        method: "POST",
        body: JSON.stringify({
          buyer: walletAddress,
          tierId: selectedTier.id,
          testMode,
          referrer: proofReferrer === "DIRECT" ? null : proofReferrer,
          walletProof: { timestamp, signatureBase64 }
        })
      });
      if (!validateCreatedOrder(order)) throw Object.assign(new Error("Order response mismatch"), { code: "ORDER_RESPONSE_MISMATCH" });

      currentOrder = {
        id: order.orderId,
        customerToken: order.customerToken,
        buyer: walletAddress,
        tierId: selectedTier.id,
        referrer: effectiveReferrer() || "",
        isTest: Boolean(order.isTest),
        status: order.status || "awaiting_payment",
        expiresAt: order.expiresAt,
        createdAt: new Date().toISOString()
      };
      saveRecentOrder();
      renderOrderStatus();
      pendingPayment = {
        orderId: order.orderId,
        buyer: walletAddress,
        tierId: selectedTier.id,
        amountUsdt: selectedTier.amountUsdt,
        transactionBase64: order.transactionBase64,
        blockhashRefreshedAt: Date.now(),
        lastValidBlockHeight: Number(order.lastValidBlockHeight || 0),
        expiresAt: order.expiresAt,
        expected: {
          buyer: walletAddress,
          buyerAta: order.buyerAta,
          mint: order.mint,
          treasuryAta: order.treasuryAta,
          treasuryOwner: order.treasuryOwner,
          amountBaseUnits: String(order.amountBaseUnits),
          reference: order.reference,
          memo: order.memo
        }
      };
      savePendingPayment();
      renderPaymentAction();
      const enoughBalance = await checkPreparedBalance(false);
      showToast(enoughBalance ? t("orderPrepared") : (balanceCheck?.message || t("balanceCheckFailed")), enoughBalance ? "success" : "error");
    } catch (error) {
      console.warn("Turing node order preparation failed:", error?.code || error?.message || error);
      showToast(error?.code === "ORDER_RESPONSE_MISMATCH" ? t("orderInvalid") : friendlyError(error), "error");
    } finally {
      setBusy();
    }
  }

  async function payPreparedOrder() {
    if (expireUnsafePendingPayment(true)) return;
    if (!pendingMatchesContext()) return showToast(t("orderInvalid"), "error");
    if (pendingPayment.paymentAttemptedAt) return showToast(t("paymentUncertain"), "info");
    if (!provider || !walletAddress) return showToast(t("walletRequired"), "error");
    if (!pendingBlockhashIsFresh()) return refreshPendingBlockhash(true);
    const providerKey = provider?.publicKey?.toString?.() || walletAddress;
    if (providerKey !== walletAddress) {
      ownerConfirm.checked = false;
      renderWallet();
      return showToast(t("walletChanged"), "error");
    }
    if (!balanceCheck || balanceCheck.orderId !== pendingPayment.orderId || !balanceCheck.enough) {
      await checkPreparedBalance(true);
      return;
    }

    const originalTitle = document.title;
    setBusy("pay");
    try {
      // Keep the wallet call as the first asynchronous action after the user's tap.
      // Mobile browsers otherwise often block the second wallet-app wake-up.
      const prepared = pendingPayment;
      window.TURING_USDT_PAYMENT.validate({ transactionBase64: prepared.transactionBase64, expected: prepared.expected });
      const nodeName = lang === "zh" ? `${selectedTier.level} ${selectedTier.zh}` : `${selectedTier.level} ${selectedTier.en}`;
      document.title = lang === "zh"
        ? `购买 ${nodeName} · ${formatUsdt(selectedTier.amountUsdt)}`
        : `Buy ${nodeName} · ${formatUsdt(selectedTier.amountUsdt)}`;
      prepared.paymentAttemptedAt = Date.now();
      savePendingPayment();
      renderPaymentAction();
      const walletRequest = window.TURING_USDT_PAYMENT.send({
        provider,
        connectedAddress: walletAddress,
        transactionBase64: prepared.transactionBase64,
        expected: prepared.expected,
        relay: {
          url: config.api.broadcast,
          orderId: prepared.orderId,
          customerToken: currentOrder?.customerToken
        }
      });
      const result = await withWalletTimeout(walletRequest);
      const signature = typeof result === "string" ? result : result?.signature;
      if (!isSignature(signature)) throw new Error("Wallet did not return a valid transaction signature");
      currentOrder.signature = signature;
      currentOrder.paymentSignature = signature;
      currentOrder.status = "payment_confirming";
      saveRecentOrder();
      clearPendingPayment();
      renderOrderStatus();
      showToast(t("paymentSubmitted"), "info");

      const verified = await verifyCurrentOrder();
      if (verified?.status === "test_paid") showToast(t("testPaymentVerified"), "success");
      else if (verified?.status === "nft_pending" || verified?.status === "nft_issued") showToast(t("paymentVerified"), "success");
      startOrderPolling();
    } catch (error) {
      console.warn("Turing USDT purchase failed:", error?.code || error?.message || error);
      if (!pendingPayment?.paymentAttemptedAt || error?.paymentMayHaveBeenSubmitted === false || walletExplicitlyRejected(error)) {
        if (/insufficient|funds|balance/i.test(String(error?.message || ""))) balanceCheck = null;
        if (pendingPayment) pendingPayment.paymentAttemptedAt = null;
        savePendingPayment();
        renderPaymentAction();
        showToast(friendlyError(error), "error");
      } else {
        currentOrder.status = "payment_confirming";
        saveRecentOrder();
        renderOrderStatus();
        showToast(t("paymentUncertain"), "info");
        startOrderPolling();
        refreshOrderStatus(false);
      }
    } finally {
      document.title = originalTitle;
      setBusy();
    }
  }

  function withWalletTimeout(promise) {
    const timeoutMs = Number(config.walletRequestTimeoutMs || 45000);
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error("Wallet payment request timed out");
        error.code = "WALLET_REQUEST_TIMEOUT";
        reject(error);
      }, timeoutMs);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
  }

  function walletExplicitlyRejected(error) {
    const code = String(error?.code || error?.name || "").toLowerCase();
    const message = String(error?.message || "").toLowerCase();
    return code === "4001" || code.includes("user_rejected") || message.includes("user rejected") ||
      message.includes("request rejected") || message.includes("cancelled by user") || message.includes("canceled by user");
  }

  function statusPresentation(status) {
    const values = {
      awaiting_payment: ["statusAwaiting", "noteAwaiting"],
      created: ["statusAwaiting", "noteAwaiting"],
      payment_confirming: ["statusConfirming", "noteConfirming"],
      submitted: ["statusConfirming", "noteConfirming"],
      test_paid: ["statusTestPaid", "noteTestPaid"],
      nft_pending: ["statusNftPending", "noteNftPending"],
      paid_manual_review: ["statusManualReview", "noteManualReview"],
      nft_issued: ["statusNftIssued", "noteNftIssued"],
      failed: ["statusFailed", "noteFailed"],
      expired: ["statusExpired", "noteExpired"]
    };
    return values[status] || ["statusUnknown", "noteConfirming"];
  }

  function renderExplorerLink(target, value, kind) {
    target.textContent = "";
    if (!value) {
      target.textContent = "—";
      return;
    }
    const link = document.createElement("a");
    link.href = `https://explorer.solana.com/${kind}/${encodeURIComponent(value)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = truncate(value, 8, 8);
    link.title = value;
    target.appendChild(link);
  }

  function renderOrderStatus() {
    const panel = $("order-status-panel");
    panel.hidden = !currentOrder;
    if (!currentOrder) return;
    const [titleKey, noteKey] = statusPresentation(currentOrder.status);
    panel.dataset.status = currentOrder.status || "unknown";
    $("order-status-title").textContent = t(titleKey);
    $("order-status-id").textContent = currentOrder.id;
    const referral = $("order-status-referrer");
    if (currentOrder.referrer) {
      referral.textContent = `${truncate(currentOrder.referrer, 7, 7)} · ${t(currentOrder.isTest ? "testReferralRecord" : "eligibilityReview")}`;
      referral.title = currentOrder.referrer;
    } else {
      referral.textContent = t("officialDirect");
      referral.removeAttribute("title");
    }
    $("order-status-note").textContent = t(noteKey);
    renderExplorerLink($("order-payment-signature"), currentOrder.paymentSignature || currentOrder.signature, "tx");
    const hasMint = isSolanaAddress(currentOrder.nftMint);
    $("order-nft-row").hidden = !hasMint;
    if (hasMint) renderExplorerLink($("order-nft-mint"), currentOrder.nftMint, "address");
    const hasIssuance = isSignature(currentOrder.issuanceSignature);
    $("order-issuance-row").hidden = !hasIssuance;
    if (hasIssuance) renderExplorerLink($("order-issuance-signature"), currentOrder.issuanceSignature, "tx");
  }

  async function refreshOrderStatus(showFeedback = true) {
    if (!currentOrder?.id || !currentOrder?.customerToken) return;
    const button = $("order-status-refresh");
    button.disabled = true;
    try {
      if (currentOrder.signature && ["awaiting_payment", "created", "submitted", "payment_confirming"].includes(currentOrder.status)) {
        await verifyCurrentOrder();
      } else {
        const recovering = Boolean(pendingPayment?.paymentAttemptedAt && pendingPayment.orderId === currentOrder.id);
        const payload = await apiJson(config.api.status, {
          method: "POST",
          body: JSON.stringify({ orderId: currentOrder.id, customerToken: currentOrder.customerToken, recoverPayment: recovering })
        });
        mergeOrder(payload);
        if (["test_paid", "nft_pending", "paid_manual_review", "nft_issued"].includes(currentOrder.status)) {
          clearPendingPayment();
          if (showFeedback) showToast(t(currentOrder.status === "test_paid" ? "testPaymentVerified" : "paymentVerified"), "success");
          return;
        }
        const recoveredSignature = recovering && Array.isArray(payload.paymentCandidates) ? payload.paymentCandidates.find(isSignature) : "";
        if (recoveredSignature) {
          currentOrder.signature = recoveredSignature;
          currentOrder.paymentSignature = recoveredSignature;
          currentOrder.status = "payment_confirming";
          saveRecentOrder();
          clearPendingPayment();
          renderOrderStatus();
          await verifyCurrentOrder();
        } else if (recovering && Number(payload.recoveryBlockHeight || 0) > Number(pendingPayment?.lastValidBlockHeight || 0) + 32) {
          pendingPayment.paymentAttemptedAt = null;
          if (!pendingOrderHasTime()) {
            expireUnsafePendingPayment(true);
            return;
          }
          pendingPayment.blockhashRefreshedAt = 0;
          savePendingPayment();
          const refreshed = await refreshPendingBlockhash(false);
          if (refreshed) showToast(t("retryPaymentReady"), "success");
        }
      }
      if (currentOrder.status === "test_paid" && showFeedback) showToast(t("testPaymentVerified"), "success");
      else if (currentOrder.status === "nft_pending" && showFeedback) showToast(t("paymentVerified"), "success");
      if (["test_paid", "nft_issued"].includes(currentOrder.status)) stopOrderPolling();
    } catch (error) {
      console.warn("Turing order status failed:", error?.code || error?.message || error);
      if (showFeedback) showToast(t("statusRefreshFailed"), "error");
    } finally {
      button.disabled = false;
    }
  }

  function startOrderPolling() {
    stopOrderPolling();
    if (!currentOrder || ["test_paid", "nft_issued"].includes(currentOrder.status)) return;
    orderPollTimer = setInterval(() => refreshOrderStatus(false), Number(config.orderPollSeconds || 5) * 1000);
  }

  function stopOrderPolling() {
    clearInterval(orderPollTimer);
    orderPollTimer = null;
  }

  async function copyText(value) {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); }
    catch (_) {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast(t("copied"), "success");
  }

  function showToast(message, type = "info") {
    const toast = $("toast");
    clearTimeout(showToast.timer);
    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("show");
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 4200);
  }

  function openPurchase() {
    applyLanguage();
    expireUnsafePendingPayment(false);
    loadSaleAvailability();
    if (!purchaseDialog.open) purchaseDialog.showModal();
    if (currentOrder) {
      refreshOrderStatus(false);
      startOrderPolling();
    }
  }

  function closePurchase() {
    stopOrderPolling();
    if (purchaseDialog.open) purchaseDialog.close();
  }

  function openAudit() {
    returnToPurchase = purchaseDialog.open;
    closePurchase();
    auditStatus.textContent = "";
    auditStatus.className = "form-status";
    $("audit-buyer-wallet").value = walletAddress;
    if (!auditDialog.open) auditDialog.showModal();
  }

  function closeAudit() {
    if (auditDialog.open) auditDialog.close();
    if (returnToPurchase) {
      returnToPurchase = false;
      openPurchase();
    }
  }

  async function submitAudit(event) {
    event.preventDefault();
    const data = new FormData(auditForm);
    if (!isSolanaAddress(data.get("buyer_wallet")) || !isSolanaAddress(data.get("referrer_wallet"))) {
      auditStatus.textContent = t("auditInvalidWallet");
      auditStatus.className = "form-status error";
      return;
    }
    if (!isSignature(data.get("transaction_signature"))) {
      auditStatus.textContent = t("auditInvalidSignature");
      auditStatus.className = "form-status error";
      return;
    }
    data.set("currency", "USDT");
    data.set("order_id", currentOrder?.id || "");
    const button = auditForm.querySelector("button[type=submit]");
    button.disabled = true;
    auditStatus.textContent = t("auditSubmitting");
    auditStatus.className = "form-status";
    try {
      const response = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data).toString() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      auditStatus.textContent = t("auditSuccess");
      auditStatus.className = "form-status success";
      auditForm.reset();
      $("audit-buyer-wallet").value = walletAddress;
    } catch (error) {
      console.warn("Referral audit form failed:", error?.message || error);
      auditStatus.textContent = t("auditFailed");
      auditStatus.className = "form-status error";
    } finally {
      button.disabled = false;
    }
  }

  buyButton.addEventListener("click", openPurchase);
  $("node-purchase-close").addEventListener("click", closePurchase);
  purchaseDialog.addEventListener("click", event => { if (event.target === purchaseDialog) closePurchase(); });
  purchaseDialog.addEventListener("close", stopOrderPolling);
  connectButton.addEventListener("click", () => setWalletPicker(walletPicker.hidden));
  $("wallet-picker-close").addEventListener("click", () => setWalletPicker(false));
  disconnectButton.addEventListener("click", () => disconnectWallet(true));
  ownerConfirm.addEventListener("change", updateSubmitState);
  submitButton.addEventListener("click", prepareNodeOrder);
  paymentButton.addEventListener("click", payPreparedOrder);
  $("order-status-refresh").addEventListener("click", () => refreshOrderStatus(true));
  copyInviteButton.addEventListener("click", () => copyText(inviteInput.value));
  $("open-audit-button").addEventListener("click", openAudit);
  $("referral-audit-close").addEventListener("click", closeAudit);
  $("audit-cancel").addEventListener("click", closeAudit);
  auditDialog.addEventListener("click", event => { if (event.target === auditDialog) closeAudit(); });
  auditForm.addEventListener("submit", submitAudit);
  window.addEventListener("load", updatePaymentState, { once: true });
  window.addEventListener("turing-usdt-payment-ready", updatePaymentState);
  window.addEventListener("focus", refreshStalePendingPayment);
  document.addEventListener("visibilitychange", refreshStalePendingPayment);
  window.setInterval(refreshStalePendingPayment, pendingRefreshIntervalMs);
  window.TURING_WALLET_STANDARD?.subscribe?.(() => { if (!walletPicker.hidden) renderWalletPicker(); });

  new MutationObserver(() => {
    const next = getLanguage();
    if (next !== lang) applyLanguage();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  applyLanguage();
  renderWallet();
  loadSaleAvailability();
})();
