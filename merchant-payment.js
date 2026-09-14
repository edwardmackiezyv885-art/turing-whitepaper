(() => {
  "use strict";

  const config = window.TURING_MERCHANT_PAYMENT_CONFIG;
  if (!config) return;

  const copy = {
    zh: {
      title: "支付商家入驻服务费",
      lead: "提交商家资料后，可创建一笔与申请编号绑定的 Solana 主网订单。付款仅购买元宇宙 CBD 商家入驻服务，不是存款、质押或投资。",
      live: "SOLANA MAINNET · 正式收款已开放",
      checking: "正在核对主网收款配置…",
      closed: "商家服务费收款暂不可用",
      gateLive: "订单由服务端生成，并核验官方 USDT Mint、精确金额、付款钱包、唯一 reference 与 Treasury 到账变化。",
      gateClosed: "当前不会唤起钱包或创建付款订单，请稍后重试。",
      amountLabel: "固定结算金额",
      amount: "1,400 USDT",
      reference: "产品定价口径：约人民币 10,000 元；链上订单固定为 1,400 USDT，不按支付时汇率重算。",
      networkLabel: "网络与资产",
      network: "Solana Mainnet · 官方 USDT",
      scopeLabel: "服务范围",
      scope: "资料审核、数字店面方案、CBD 上线准备、基础运营接入",
      natureLabel: "交易性质",
      nature: "一次性商业服务费",
      noPromise: "无收益 · 无本金返还 · 无 NFT · 无 TUR 兑付",
      applicationTitle: "01 · 确认商家申请",
      applicationWaiting: "请先完成上方商家资料提交。提交成功后会生成申请编号并解锁付款。",
      applicationReady: "已绑定申请编号",
      copyId: "复制",
      copied: "已复制",
      walletTitle: "02 · 连接付款钱包",
      connect: "连接 Solana 钱包",
      connected: "已连接",
      disconnect: "断开",
      chooseWallet: "选择钱包",
      detected: "已检测",
      openWallet: "在钱包中打开",
      noWallet: "当前浏览器未检测到兼容钱包。可使用支持 Solana 的钱包内置浏览器打开本页。",
      confirmTitle: "03 · 核对服务与付款",
      confirmControl: "我确认自己控制当前钱包，并已核对申请编号、1,400 USDT、Solana Mainnet 和官方 USDT Mint。",
      confirmTerms: "我理解这是商家入驻商业服务费：不产生收益、不返还所谓本金、不发放 NFT，也不承诺 TUR 或任何代币兑付；付款不保证审核通过、固定流量或销售额。",
      create: "签名并创建服务费订单",
      preparing: "正在创建安全订单…",
      appRequired: "请先提交商家资料。",
      walletRequired: "请先连接付款钱包。",
      confirmRequired: "请完整勾选两项确认。",
      orderReady: "订单已准备好",
      orderReadyText: "下一步会在钱包中明确显示 1,400 USDT 转账。请再次核对网络、金额和官方 mint。",
      checkingBalance: "正在检查 USDT 与 SOL 余额…",
      checkBalance: "检查付款余额",
      pay: "支付 1,400 USDT",
      paying: "正在等待钱包确认…",
      insufficientUsdt: "USDT 余额不足：需要 {required}，当前 {available}。请补充 Solana 主网官方 USDT。",
      insufficientSol: "SOL 手续费余额不足：至少约 {required} SOL，当前 {available} SOL。",
      balanceReady: "余额充足，可以支付。",
      balanceFailed: "暂时无法核对余额，请稍后重试。",
      orderInvalid: "订单安全校验失败，未唤起钱包。",
      paymentSubmitted: "交易已提交，正在等待 Solana 主网最终确认，请勿重复付款。",
      paymentVerified: "服务费已完成链上核验，订单已进入商家入驻服务队列。",
      paymentFailed: "付款未完成。请查看钱包提示后重试。",
      requestTimeout: "订单服务响应超时，尚未确认付款结果。",
      paymentUncertain: "正在核对链上状态，请勿重复付款。",
      expired: "订单已过期，请重新创建。",
      refresh: "刷新链上状态",
      statusAwaiting: "等待付款",
      statusConfirming: "主网确认中",
      statusPaid: "服务费已支付",
      statusFailed: "订单未完成",
      orderNumber: "订单号",
      paymentWallet: "付款钱包",
      paymentTx: "付款交易",
      paidNote: "链上核验完成。该记录仅证明商家入驻服务费已支付，不代表收益、本金返还、NFT、TUR 兑付或固定获客结果。",
      pendingNote: "订单尚未完成链上核验。只有 Treasury 收到准确金额并通过交易校验后才视为支付成功。",
      security: "网站只请求一份不扣款的钱包控制权签名和一笔明确的 USDT 转账；不会索取助记词、私钥、验证码或无限授权。",
      mint: "官方 USDT Mint",
      treasury: "官方 Treasury Owner",
      serviceTerms: "服务费说明",
      serviceTermsText: "付款用于启动商家审核与入驻服务。具体交付排期、素材补充、店面方案和上线安排由团队后续确认；这笔费用不能作为可随时赎回的本金。",
      mobileOpen: "已尝试打开钱包，请在钱包内继续。"
    },
    en: {
      title: "Pay the merchant onboarding service fee",
      lead: "After submitting merchant information, create a Solana Mainnet order bound to the application ID. Payment purchases metaverse CBD onboarding services only; it is not a deposit, stake, or investment.",
      live: "SOLANA MAINNET · Production checkout is open",
      checking: "Checking Mainnet checkout configuration…",
      closed: "Merchant service-fee checkout is unavailable",
      gateLive: "The server creates each order and verifies the official USDT mint, exact amount, payer wallet, unique reference, and Treasury balance change.",
      gateClosed: "No wallet will open and no payment order will be created right now.",
      amountLabel: "Fixed settlement amount",
      amount: "1,400 USDT",
      reference: "Product price reference: approximately CNY 10,000. The on-chain order is fixed at 1,400 USDT and is not recalculated at payment time.",
      networkLabel: "Network and asset",
      network: "Solana Mainnet · Official USDT",
      scopeLabel: "Service scope",
      scope: "Application review, digital-store plan, CBD launch preparation, and basic operations onboarding",
      natureLabel: "Transaction type",
      nature: "One-time commercial service fee",
      noPromise: "No yield · No principal redemption · No NFT · No TUR settlement",
      applicationTitle: "01 · Confirm merchant application",
      applicationWaiting: "Submit the merchant form above first. A successful submission creates an application ID and unlocks checkout.",
      applicationReady: "Application ID bound",
      copyId: "Copy",
      copied: "Copied",
      walletTitle: "02 · Connect payment wallet",
      connect: "Connect Solana wallet",
      connected: "Connected",
      disconnect: "Disconnect",
      chooseWallet: "Choose a wallet",
      detected: "Detected",
      openWallet: "Open in wallet",
      noWallet: "No compatible wallet was detected. Open this page in a Solana-capable wallet browser.",
      confirmTitle: "03 · Review service and payment",
      confirmControl: "I control this wallet and have checked the application ID, 1,400 USDT, Solana Mainnet, and the official USDT mint.",
      confirmTerms: "I understand this is a commercial merchant-onboarding service fee: it provides no yield, principal redemption, NFT, TUR, or token settlement, and payment does not guarantee approval, fixed traffic, or sales.",
      create: "Sign and create service-fee order",
      preparing: "Creating a secure order…",
      appRequired: "Submit merchant information first.",
      walletRequired: "Connect the payment wallet first.",
      confirmRequired: "Accept both confirmations.",
      orderReady: "Order is ready",
      orderReadyText: "The next wallet prompt explicitly transfers 1,400 USDT. Verify the network, amount, and official mint again.",
      checkingBalance: "Checking USDT and SOL balances…",
      checkBalance: "Check payment balance",
      pay: "Pay 1,400 USDT",
      paying: "Waiting for wallet confirmation…",
      insufficientUsdt: "Insufficient USDT: {required} required, {available} available. Add official USDT on Solana Mainnet.",
      insufficientSol: "Insufficient SOL for fees: about {required} SOL required, {available} SOL available.",
      balanceReady: "Balance is sufficient. Payment is ready.",
      balanceFailed: "The balance could not be checked. Try again shortly.",
      orderInvalid: "Order security validation failed. The wallet was not opened.",
      paymentSubmitted: "Transaction submitted and awaiting final Solana Mainnet confirmation. Do not pay again.",
      paymentVerified: "The service fee is verified on-chain and the order is queued for merchant onboarding services.",
      paymentFailed: "Payment did not complete. Review the wallet message and retry.",
      requestTimeout: "The order service timed out and the final payment result is not yet known.",
      paymentUncertain: "Checking the on-chain result. Do not pay again.",
      expired: "The order expired. Create a new one.",
      refresh: "Refresh on-chain status",
      statusAwaiting: "Awaiting payment",
      statusConfirming: "Confirming on Mainnet",
      statusPaid: "Service fee paid",
      statusFailed: "Order incomplete",
      orderNumber: "Order ID",
      paymentWallet: "Payment wallet",
      paymentTx: "Payment transaction",
      paidNote: "On-chain verification is complete. This proves payment of the onboarding service fee only; it creates no yield, principal redemption, NFT, TUR settlement, or guaranteed customer result.",
      pendingNote: "The order is not yet verified. Payment succeeds only after the Treasury receives the exact amount and the transaction passes validation.",
      security: "The site requests one no-charge wallet-control signature and one explicit USDT transfer. It never asks for a seed phrase, private key, verification code, or unlimited approval.",
      mint: "Official USDT mint",
      treasury: "Official Treasury owner",
      serviceTerms: "Service-fee note",
      serviceTermsText: "Payment starts application review and onboarding work. Delivery schedule, asset follow-up, storefront plan, and launch arrangement are confirmed by the team later; the fee is not redeemable principal.",
      mobileOpen: "The wallet was opened. Continue inside the wallet app."
    }
  };

  let lang = "zh";
  let root = null;
  let application = loadJson(config.applicationStorageKey);
  let currentOrder = loadJson(config.recentOrderStorageKey);
  let pendingPayment = loadJson(config.pendingPaymentStorageKey);
  let provider = null;
  let walletAddress = "";
  let availability = { loaded: false, enabled: false };
  let busy = "";
  let balanceCheck = null;
  let pollTimer = null;

  const t = key => copy[lang]?.[key] || copy.zh[key] || key;
  const q = selector => root?.querySelector(selector);
  const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  const isSignature = value => /^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(String(value || ""));

  function loadJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch { return null; }
  }

  function saveJson(key, value) {
    try {
      if (value) localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    } catch { /* Current-page state remains usable. */ }
  }

  function decodeBase58(value) {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    if (!value || typeof value !== "string") return null;
    const bytes = [0];
    for (const character of value) {
      const digit = alphabet.indexOf(character);
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

  function isAddress(value) {
    const decoded = decodeBase58(String(value || "").trim());
    return Boolean(decoded && decoded.length === 32);
  }

  function truncate(value, head = 7, tail = 7) {
    return value ? `${value.slice(0, head)}…${value.slice(-tail)}` : "—";
  }

  function bytesToBase64(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    return btoa(binary);
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
      } catch { return null; }
    }
    return null;
  }

  function fromBaseUnits(value, decimals = 6) {
    const raw = String(value || "0");
    if (!/^\d+$/.test(raw)) return "0";
    const padded = raw.padStart(decimals + 1, "0");
    const whole = padded.slice(0, -decimals);
    const fraction = padded.slice(-decimals).replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : whole;
  }

  function formatUsdt(value) {
    return `${new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-US", { maximumFractionDigits: 6 }).format(Number(value))} USDT`;
  }

  function paymentReady() {
    return Boolean(
      availability.loaded && availability.enabled &&
      typeof window.TURING_USDT_PAYMENT?.send === "function" &&
      typeof window.TURING_USDT_PAYMENT?.refreshBlockhash === "function" &&
      typeof window.TURING_USDT_PAYMENT?.validate === "function"
    );
  }

  function renderMarkup() {
    root.innerHTML = `
      <section id="merchant-service-fee" class="merchant-service-fee-section" aria-labelledby="merchant-service-fee-title">
        <div class="merchant-fee-heading">
          <span>MAINNET SERVICE CHECKOUT</span>
          <h2 id="merchant-service-fee-title">${t("title")}</h2>
          <p>${t("lead")}</p>
        </div>
        <div class="merchant-fee-gate" data-merchant-fee-gate role="status" aria-live="polite">
          <span class="gate-dot" aria-hidden="true"></span>
          <div><strong>${t(availability.loaded ? (availability.enabled ? "live" : "closed") : "checking")}</strong><p>${t(availability.enabled ? "gateLive" : "gateClosed")}</p></div>
        </div>
        <div class="merchant-fee-summary">
          <article><span>${t("amountLabel")}</span><strong>${t("amount")}</strong><small>${t("reference")}</small></article>
          <article><span>${t("networkLabel")}</span><strong>${t("network")}</strong><small>${config.token.mint}</small></article>
          <article><span>${t("scopeLabel")}</span><strong>${t("scope")}</strong></article>
          <article><span>${t("natureLabel")}</span><strong>${t("nature")}</strong><small>${t("noPromise")}</small></article>
        </div>
        <div class="merchant-fee-checkout">
          <div class="merchant-fee-main">
            <section class="merchant-fee-step">
              <div class="merchant-fee-step-title"><span>01</span><h3>${t("applicationTitle")}</h3></div>
              <div class="merchant-application-binding" data-merchant-application-binding></div>
            </section>
            <section class="merchant-fee-step">
              <div class="merchant-fee-step-title"><span>02</span><h3>${t("walletTitle")}</h3></div>
              <button class="merchant-wallet-connect" data-merchant-wallet-connect type="button">${t("connect")}</button>
              <div class="merchant-wallet-connected" data-merchant-wallet-connected hidden><div><small>${t("connected")}</small><code></code></div><button type="button">${t("disconnect")}</button></div>
              <div class="merchant-wallet-picker" data-merchant-wallet-picker hidden>
                <div><strong>${t("chooseWallet")}</strong><button type="button" aria-label="Close">×</button></div>
                <div class="merchant-wallet-options" data-merchant-wallet-options role="list"></div>
              </div>
            </section>
            <section class="merchant-fee-step">
              <div class="merchant-fee-step-title"><span>03</span><h3>${t("confirmTitle")}</h3></div>
              <div class="merchant-fee-confirmations">
                <label><input type="checkbox" data-merchant-confirm-control><span>${t("confirmControl")}</span></label>
                <label><input type="checkbox" data-merchant-confirm-terms><span>${t("confirmTerms")}</span></label>
              </div>
              <button class="merchant-fee-primary" data-merchant-create-order type="button" disabled><span>${t("create")}</span></button>
              <div class="merchant-fee-payment-action" data-merchant-payment-action hidden>
                <div><strong>${t("orderReady")}</strong><p>${t("orderReadyText")}</p></div>
                <button class="merchant-fee-primary" data-merchant-pay type="button"><span>${t("checkBalance")}</span></button>
              </div>
              <p class="merchant-payment-message" data-merchant-payment-message role="status" aria-live="polite"></p>
              <p class="merchant-fee-security">${t("security")}</p>
            </section>
            <section class="merchant-fee-order-status" data-merchant-order-status hidden aria-live="polite">
              <div class="merchant-fee-order-head"><div><span>${t("statusAwaiting")}</span><strong></strong></div><button type="button">${t("refresh")}</button></div>
              <dl>
                <div><dt>${t("orderNumber")}</dt><dd data-order-id>—</dd></div>
                <div><dt>${t("paymentWallet")}</dt><dd data-order-wallet>—</dd></div>
                <div><dt>${t("paymentTx")}</dt><dd data-order-signature>—</dd></div>
              </dl>
              <p data-order-note>${t("pendingNote")}</p>
            </section>
          </div>
          <aside class="merchant-fee-side">
            <div><span>${t("mint")}</span><code>${config.token.mint}</code><a href="https://explorer.solana.com/address/${config.token.mint}" target="_blank" rel="noopener noreferrer">Solana Explorer ↗</a></div>
            <div><span>${t("treasury")}</span><code>${config.treasuryOwner}</code><a href="https://explorer.solana.com/address/${config.treasuryOwner}" target="_blank" rel="noopener noreferrer">Solana Explorer ↗</a></div>
            <div class="merchant-fee-terms"><span>${t("serviceTerms")}</span><p>${t("serviceTermsText")}</p></div>
          </aside>
        </div>
      </section>`;
  }

  function setMessage(message, type = "") {
    const target = q("[data-merchant-payment-message]");
    if (!target) return;
    target.textContent = message || "";
    target.className = `merchant-payment-message${type ? ` ${type}` : ""}`;
  }

  function renderApplication() {
    const target = q("[data-merchant-application-binding]");
    if (!target) return;
    if (!isUuid(application?.id)) {
      target.innerHTML = `<p>${t("applicationWaiting")}</p>`;
      target.classList.remove("is-ready");
      return;
    }
    target.classList.add("is-ready");
    target.innerHTML = `<div><small>${t("applicationReady")}</small><code>${application.id}</code>${application.businessName ? `<span>${application.businessName}</span>` : ""}</div><button type="button">${t("copyId")}</button>`;
    target.querySelector("button").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(application.id); }
      catch { /* The visible ID remains selectable. */ }
      setMessage(t("copied"), "success");
    });
  }

  function walletProviderIsCompatible(item) {
    return Boolean(item && typeof item.connect === "function" && typeof item.signMessage === "function" &&
      (typeof item.signTransaction === "function" || typeof item.signAndSendTransaction === "function"));
  }

  function walletOptions() {
    const options = (window.TURING_WALLET_STANDARD?.list?.() || []).map(item => ({ ...item, standard: true }));
    const injected = window.solana;
    const entries = [
      ["phantom", "Phantom", window.phantom?.solana],
      ["solflare", "Solflare", window.solflare],
      ["backpack", "Backpack", window.backpack?.solana],
      ["okx", "OKX Wallet", window.okxwallet?.solana || window.okxwallet?.solanaProvider],
      ["bitget", "Bitget Wallet", window.bitkeep?.solana || window.bitgetWallet?.solana || ((injected?.isBitKeep || injected?.isBitget) ? injected : null)],
      ["tokenpocket", "TokenPocket", window.tokenpocket?.solana || window.tp?.solana || ((injected?.isTokenPocket || injected?.isTP) ? injected : null)],
      ["injected", "Solana Wallet", injected]
    ];
    const seenProviders = new Set();
    entries.forEach(([id, name, item]) => {
      if (!walletProviderIsCompatible(item) || seenProviders.has(item)) return;
      seenProviders.add(item);
      options.push({ id: `injected:${id}`, name, provider: item });
    });
    const names = new Set();
    const unique = options.filter(item => {
      const name = item.name.toLowerCase().replace(/\s+wallet$/i, "").replace(/\s+/g, "");
      if (names.has(name)) return false;
      names.add(name);
      return true;
    });
    if (![...names].some(name => name.includes("bitget") || name.includes("bitkeep"))) {
      unique.push({ id: "deeplink:bitget", name: "Bitget Wallet", deeplink: "bitget" });
    }
    if (![...names].some(name => name.includes("tokenpocket"))) {
      unique.push({ id: "deeplink:tokenpocket", name: "TokenPocket", deeplink: "tokenpocket" });
    }
    return unique;
  }

  function walletAppUrl(kind) {
    const target = `https://meta9898.shop/#/${lang}/merchant-onboarding`;
    if (kind === "bitget") return `https://bkcode.vip?action=dapp&url=${encodeURIComponent(target)}`;
    return `tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url: target, chain: "SOLANA", source: "Turing" }))}`;
  }

  function renderWalletPicker() {
    const target = q("[data-merchant-wallet-options]");
    if (!target) return;
    const options = walletOptions();
    target.textContent = "";
    if (!options.length) target.innerHTML = `<p>${t("noWallet")}</p>`;
    options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "merchant-wallet-option";
      button.setAttribute("role", "listitem");
      button.innerHTML = `<span>${option.name.slice(0, 1).toUpperCase()}</span><div><strong>${option.name}</strong><small>${t(option.deeplink ? "openWallet" : "detected")}</small></div><i>›</i>`;
      button.addEventListener("click", () => connectWallet(option, button));
      target.appendChild(button);
    });
  }

  function walletAddressFrom(providerValue, response) {
    const account = Array.isArray(response) ? response[0] : response?.accounts?.[0];
    let providerAccount = null;
    try { providerAccount = providerValue?.getAccount?.(); } catch { /* Public-key fallbacks remain available. */ }
    const value = response?.publicKey || account?.publicKey || account?.address || account ||
      providerAccount?.publicKey || providerAccount?.address || providerValue?.publicKey;
    return value?.toString?.() || String(value || "");
  }

  async function connectWallet(option, button) {
    button.disabled = true;
    try {
      if (option.deeplink) {
        setMessage(t("mobileOpen"), "info");
        location.href = walletAppUrl(option.deeplink);
        return;
      }
      provider = option.standard
        ? await window.TURING_WALLET_STANDARD.connectWallet(option.wallet)
        : option.provider;
      const response = option.provider ? await provider.connect() : { publicKey: provider.publicKey };
      const address = walletAddressFrom(provider, response);
      if (!isAddress(address)) throw new Error("Invalid wallet public key");
      walletAddress = address;
      q("[data-merchant-wallet-picker]").hidden = true;
      renderWallet();
      setMessage("");
    } catch (error) {
      console.warn("Merchant wallet connection failed:", error?.message || error);
      setMessage(t("paymentFailed"), "error");
    } finally {
      button.disabled = false;
    }
  }

  async function disconnectWallet() {
    const previous = provider;
    provider = null;
    walletAddress = "";
    balanceCheck = null;
    q("[data-merchant-confirm-control]").checked = false;
    renderWallet();
    if (previous?.disconnect) {
      try { await previous.disconnect(); } catch { /* Local disconnect is complete. */ }
    }
  }

  function renderWallet() {
    const connect = q("[data-merchant-wallet-connect]");
    const connected = q("[data-merchant-wallet-connected]");
    if (!connect || !connected) return;
    connect.hidden = Boolean(walletAddress);
    connected.hidden = !walletAddress;
    connected.querySelector("code").textContent = truncate(walletAddress);
    connected.querySelector("code").title = walletAddress;
    updateActions();
  }

  function orderMatchesApplication() {
    return Boolean(currentOrder && application?.id && currentOrder.applicationId === application.id);
  }

  function pendingMatches() {
    return Boolean(
      pendingPayment && orderMatchesApplication() && pendingPayment.orderId === currentOrder.id &&
      pendingPayment.buyer === walletAddress && Date.parse(pendingPayment.expiresAt) > Date.now()
    );
  }

  function renderOrderStatus() {
    const panel = q("[data-merchant-order-status]");
    if (!panel) return;
    panel.hidden = !orderMatchesApplication();
    if (panel.hidden) return;
    const paid = currentOrder.status === "service_fee_paid";
    const confirming = currentOrder.status === "payment_confirming";
    panel.dataset.status = currentOrder.status || "unknown";
    panel.querySelector(".merchant-fee-order-head span").textContent = t(paid ? "statusPaid" : confirming ? "statusConfirming" : currentOrder.status === "failed" ? "statusFailed" : "statusAwaiting");
    panel.querySelector(".merchant-fee-order-head strong").textContent = currentOrder.amount ? `${currentOrder.amount} USDT` : t("amount");
    panel.querySelector("[data-order-id]").textContent = currentOrder.id || "—";
    panel.querySelector("[data-order-wallet]").textContent = truncate(currentOrder.buyer || walletAddress);
    panel.querySelector("[data-order-wallet]").title = currentOrder.buyer || walletAddress;
    const signatureTarget = panel.querySelector("[data-order-signature]");
    signatureTarget.textContent = "";
    const signature = currentOrder.paymentSignature || currentOrder.signature;
    if (isSignature(signature)) {
      const link = document.createElement("a");
      link.href = `https://explorer.solana.com/tx/${encodeURIComponent(signature)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = truncate(signature);
      link.title = signature;
      signatureTarget.appendChild(link);
    } else {
      signatureTarget.textContent = "—";
    }
    panel.querySelector("[data-order-note]").textContent = t(paid ? "paidNote" : "pendingNote");
  }

  function updateActions() {
    const create = q("[data-merchant-create-order]");
    const action = q("[data-merchant-payment-action]");
    const pay = q("[data-merchant-pay]");
    if (!create || !action || !pay) return;
    const confirmations = Boolean(q("[data-merchant-confirm-control]")?.checked && q("[data-merchant-confirm-terms]")?.checked);
    const readyToCreate = paymentReady() && isUuid(application?.id) && typeof application?.token === "string" &&
      application.token.length >= 32 && walletAddress && confirmations && !busy && !pendingMatches() &&
      currentOrder?.status !== "service_fee_paid";
    create.disabled = !readyToCreate;
    create.hidden = pendingMatches() || currentOrder?.status === "service_fee_paid";
    create.querySelector("span").textContent = t(busy === "prepare" ? "preparing" : "create");
    action.hidden = !pendingMatches();
    if (!action.hidden) {
      const enough = balanceCheck?.orderId === pendingPayment.orderId && balanceCheck.enough;
      pay.disabled = Boolean(busy);
      pay.querySelector("span").textContent = t(busy === "balance" ? "checkingBalance" : busy === "pay" ? "paying" : enough ? "pay" : "checkBalance");
    }
    renderOrderStatus();
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
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
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

  function expectedMemo(applicationId, orderId) {
    return `TURING MERCHANT SERVICE FEE | APPLICATION ${applicationId} | 1,400 USDT | ORDER ${orderId}`;
  }

  function validateCreatedOrder(order) {
    return Boolean(
      isUuid(order.orderId) && order.applicationId === application.id &&
      typeof order.customerToken === "string" && order.customerToken.length >= 32 &&
      typeof order.transactionBase64 === "string" && order.transactionBase64.length > 100 &&
      order.buyer === walletAddress && order.currency === "USDT" &&
      order.amountBaseUnits === "1400000000" && order.mint === config.token.mint &&
      order.treasuryOwner === config.treasuryOwner && order.treasuryAta === config.token.treasuryTokenAccount &&
      isAddress(order.buyerAta) && isAddress(order.reference) &&
      order.memo === expectedMemo(application.id, order.orderId) &&
      order.notice === config.settlementNotice
    );
  }

  async function prepareOrder() {
    if (!isUuid(application?.id)) return setMessage(t("appRequired"), "error");
    if (!walletAddress || !provider) return setMessage(t("walletRequired"), "error");
    if (!q("[data-merchant-confirm-control]").checked || !q("[data-merchant-confirm-terms]").checked) {
      return setMessage(t("confirmRequired"), "error");
    }
    busy = "prepare";
    updateActions();
    try {
      const timestamp = new Date().toISOString();
      const message = `TURING MERCHANT SERVICE FEE\nWallet: ${walletAddress}\nApplication: ${application.id}\nAmount: 1,400 USDT\nTimestamp: ${timestamp}\nOrigin: ${location.origin}`;
      const proofResult = await provider.signMessage(new TextEncoder().encode(message), "utf8");
      const signatureBase64 = bytesToBase64(proofSignatureBytes(proofResult));
      if (signatureBase64.length < 80) throw new Error("Invalid wallet proof");
      const order = await apiJson(config.api.create, {
        method: "POST",
        body: JSON.stringify({
          buyer: walletAddress,
          applicationId: application.id,
          applicationToken: application.token,
          walletProof: { timestamp, signatureBase64 }
        })
      });
      if (!validateCreatedOrder(order)) throw Object.assign(new Error("Order response mismatch"), { code: "ORDER_RESPONSE_MISMATCH" });
      currentOrder = {
        id: order.orderId,
        customerToken: order.customerToken,
        applicationId: order.applicationId,
        serviceId: order.serviceId,
        buyer: walletAddress,
        status: order.status,
        amount: order.amount,
        createdAt: new Date().toISOString(),
        expiresAt: order.expiresAt
      };
      pendingPayment = {
        orderId: order.orderId,
        applicationId: order.applicationId,
        buyer: walletAddress,
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
      balanceCheck = null;
      saveJson(config.recentOrderStorageKey, currentOrder);
      saveJson(config.pendingPaymentStorageKey, pendingPayment);
      setMessage(t("orderReady"), "success");
      await checkBalance(false);
    } catch (error) {
      console.warn("Merchant order preparation failed:", error?.code || error?.message || error);
      setMessage(error?.name === "AbortError" ? t("requestTimeout") : error?.code === "ORDER_RESPONSE_MISMATCH" ? t("orderInvalid") : t("paymentFailed"), "error");
    } finally {
      busy = "";
      updateActions();
    }
  }

  function balanceError(result) {
    if (!result.enoughUsdt) {
      return t("insufficientUsdt")
        .replace("{required}", formatUsdt(fromBaseUnits(result.requiredUsdtBaseUnits, result.decimals)))
        .replace("{available}", formatUsdt(fromBaseUnits(result.usdtBaseUnits, result.decimals)));
    }
    if (!result.enoughSol) {
      const required = (Number(result.requiredSolLamports || 0) / 1e9).toFixed(6).replace(/0+$/, "");
      const available = (Number(result.solLamports || 0) / 1e9).toFixed(6).replace(/0+$/, "");
      return t("insufficientSol").replace("{required}", required).replace("{available}", available);
    }
    return "";
  }

  async function checkBalance(showFeedback = true) {
    if (!pendingMatches()) return false;
    busy = "balance";
    updateActions();
    try {
      const result = await apiJson(config.api.balance, {
        method: "POST",
        body: JSON.stringify({ buyer: walletAddress })
      });
      if (!pendingPayment || result.buyer !== walletAddress || result.serviceId !== config.serviceId) {
        throw new Error("Balance response mismatch");
      }
      balanceCheck = { ...result, orderId: pendingPayment.orderId };
      const message = result.enough ? t("balanceReady") : balanceError(result);
      if (showFeedback || !result.enough) setMessage(message, result.enough ? "success" : "error");
      return Boolean(result.enough);
    } catch (error) {
      console.warn("Merchant balance check failed:", error?.message || error);
      balanceCheck = null;
      setMessage(t("balanceFailed"), "error");
      return false;
    } finally {
      busy = "";
      updateActions();
    }
  }

  async function refreshPendingBlockhash() {
    const refreshed = await window.TURING_USDT_PAYMENT.refreshBlockhash({
      transactionBase64: pendingPayment.transactionBase64,
      expected: pendingPayment.expected,
      refresh: {
        url: config.api.refresh,
        orderId: pendingPayment.orderId,
        customerToken: currentOrder.customerToken
      }
    });
    pendingPayment.transactionBase64 = refreshed.transactionBase64;
    pendingPayment.blockhashRefreshedAt = refreshed.refreshedAt;
    pendingPayment.lastValidBlockHeight = refreshed.lastValidBlockHeight;
    saveJson(config.pendingPaymentStorageKey, pendingPayment);
  }

  async function payOrder() {
    if (!pendingMatches()) return setMessage(t("orderInvalid"), "error");
    if (!balanceCheck?.enough) return checkBalance(true);
    busy = "pay";
    updateActions();
    try {
      if (Date.now() - Number(pendingPayment.blockhashRefreshedAt || 0) > 45_000) await refreshPendingBlockhash();
      const prepared = pendingPayment;
      window.TURING_USDT_PAYMENT.validate({
        transactionBase64: prepared.transactionBase64,
        expected: prepared.expected
      });
      prepared.paymentAttemptedAt = Date.now();
      saveJson(config.pendingPaymentStorageKey, prepared);
      const result = await Promise.race([
        window.TURING_USDT_PAYMENT.send({
          provider,
          connectedAddress: walletAddress,
          transactionBase64: prepared.transactionBase64,
          expected: prepared.expected,
          relay: {
            url: config.api.broadcast,
            orderId: prepared.orderId,
            customerToken: currentOrder.customerToken
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("Wallet request timeout"), { code: "WALLET_REQUEST_TIMEOUT" })), Number(config.walletRequestTimeoutMs || 45000)))
      ]);
      const signature = typeof result === "string" ? result : result?.signature;
      if (!isSignature(signature)) throw new Error("Invalid transaction signature");
      currentOrder.signature = signature;
      currentOrder.paymentSignature = signature;
      currentOrder.status = "payment_confirming";
      saveJson(config.recentOrderStorageKey, currentOrder);
      pendingPayment = null;
      saveJson(config.pendingPaymentStorageKey, null);
      setMessage(t("paymentSubmitted"), "info");
      renderOrderStatus();
      await verifyOrder();
      startPolling();
    } catch (error) {
      console.warn("Merchant USDT payment failed:", error?.code || error?.message || error);
      const uncertain = Boolean(pendingPayment?.paymentAttemptedAt && !/reject|cancel/i.test(String(error?.message || "")));
      setMessage(uncertain ? t("paymentUncertain") : t("paymentFailed"), uncertain ? "info" : "error");
      if (!uncertain && pendingPayment) {
        delete pendingPayment.paymentAttemptedAt;
        saveJson(config.pendingPaymentStorageKey, pendingPayment);
      }
    } finally {
      busy = "";
      updateActions();
    }
  }

  function mergeOrder(payload) {
    const order = payload?.order || payload || {};
    currentOrder = {
      ...(currentOrder || {}),
      ...order,
      id: order.id || currentOrder?.id,
      customerToken: currentOrder?.customerToken,
      signature: order.paymentSignature || currentOrder?.signature || ""
    };
    saveJson(config.recentOrderStorageKey, currentOrder);
    renderOrderStatus();
    if (currentOrder.status === "service_fee_paid") {
      setMessage(t("paymentVerified"), "success");
      persistReceipt();
      stopPolling();
    }
    return currentOrder;
  }

  async function verifyOrder() {
    const signature = currentOrder?.paymentSignature || currentOrder?.signature;
    if (!currentOrder?.id || !currentOrder?.customerToken || !isSignature(signature)) return null;
    const data = await apiJson(config.api.verify, {
      method: "POST",
      body: JSON.stringify({
        orderId: currentOrder.id,
        customerToken: currentOrder.customerToken,
        signature
      })
    });
    return mergeOrder(data);
  }

  async function refreshStatus() {
    if (!currentOrder?.id || !currentOrder?.customerToken) return;
    try {
      if (isSignature(currentOrder.paymentSignature || currentOrder.signature)) {
        await verifyOrder();
      } else {
        const data = await apiJson(config.api.status, {
          method: "POST",
          body: JSON.stringify({
            orderId: currentOrder.id,
            customerToken: currentOrder.customerToken,
            recoverPayment: Boolean(pendingPayment?.paymentAttemptedAt)
          })
        });
        mergeOrder(data);
        const recovered = data.paymentCandidates?.find(isSignature);
        if (recovered) {
          currentOrder.paymentSignature = recovered;
          currentOrder.signature = recovered;
          currentOrder.status = "payment_confirming";
          saveJson(config.recentOrderStorageKey, currentOrder);
          await verifyOrder();
        }
      }
    } catch (error) {
      console.warn("Merchant order status refresh failed:", error?.code || error?.message || error);
      setMessage(t("paymentUncertain"), "info");
    }
  }

  function startPolling() {
    stopPolling();
    if (currentOrder?.status === "service_fee_paid") return;
    pollTimer = setInterval(() => {
      if (!root?.isConnected) return stopPolling();
      refreshStatus();
    }, 5000);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  async function persistReceipt() {
    const signature = currentOrder?.paymentSignature || currentOrder?.signature;
    if (!isSignature(signature) || loadJson(config.receiptStorageKey)?.signature === signature) return;
    const body = new URLSearchParams({
      "form-name": "merchant-payment-receipt",
      application_id: currentOrder.applicationId || application?.id || "",
      order_id: currentOrder.id || "",
      payer_wallet: currentOrder.buyer || walletAddress,
      amount_usdt: currentOrder.amount || config.amountUsdt,
      network: "solana-mainnet",
      usdt_mint: config.token.mint,
      transaction_signature: signature,
      paid_at: currentOrder.paidAt || new Date().toISOString()
    });
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      saveJson(config.receiptStorageKey, { signature, recordedAt: new Date().toISOString() });
    } catch (error) {
      console.warn("Merchant payment receipt form failed:", error?.message || error);
    }
  }

  async function loadAvailability() {
    try {
      const result = await apiJson(config.api.publicConfig);
      if (
        result.network !== config.network || result.currency !== config.token.symbol ||
        result.amountBaseUnits !== "1400000000" || result.mint !== config.token.mint ||
        result.treasuryOwner !== config.treasuryOwner || result.treasuryAta !== config.token.treasuryTokenAccount ||
        result.settlementNotice !== config.settlementNotice
      ) throw new Error("Merchant checkout configuration mismatch");
      availability = { loaded: true, enabled: Boolean(result.enabled) };
    } catch (error) {
      console.warn("Merchant checkout status unavailable:", error?.message || error);
      availability = { loaded: true, enabled: false };
    }
    if (root?.isConnected) {
      renderMarkup();
      bindUi();
      renderApplication();
      renderWallet();
      renderOrderStatus();
      updateActions();
    }
  }

  function bindUi() {
    q("[data-merchant-wallet-connect]")?.addEventListener("click", () => {
      const picker = q("[data-merchant-wallet-picker]");
      picker.hidden = !picker.hidden;
      if (!picker.hidden) renderWalletPicker();
    });
    q("[data-merchant-wallet-picker] > div > button")?.addEventListener("click", () => {
      q("[data-merchant-wallet-picker]").hidden = true;
    });
    q("[data-merchant-wallet-connected] button")?.addEventListener("click", disconnectWallet);
    q("[data-merchant-confirm-control]")?.addEventListener("change", updateActions);
    q("[data-merchant-confirm-terms]")?.addEventListener("change", updateActions);
    q("[data-merchant-create-order]")?.addEventListener("click", prepareOrder);
    q("[data-merchant-pay]")?.addEventListener("click", payOrder);
    q("[data-merchant-order-status] button")?.addEventListener("click", refreshStatus);
  }

  function registerApplication(detail) {
    if (!isUuid(detail?.applicationId)) return;
    application = {
      id: detail.applicationId,
      token: String(detail.applicationToken || ""),
      businessName: String(detail.businessName || "").slice(0, 120),
      submittedAt: detail.submittedAt || new Date().toISOString()
    };
    saveJson(config.applicationStorageKey, application);
    if (root?.isConnected) {
      renderApplication();
      updateActions();
      root.querySelector("#merchant-service-fee")?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  function enhance(options = {}) {
    lang = options.lang === "en" ? "en" : "zh";
    root = options.root?.querySelector?.("#merchant-service-fee-mount") || document.getElementById("merchant-service-fee-mount");
    if (!root) return;
    if (!isUuid(application?.id) || typeof application?.token !== "string" || application.token.length < 32) application = null;
    if (!isUuid(currentOrder?.id) || currentOrder?.applicationId !== application?.id) currentOrder = null;
    if (!isUuid(pendingPayment?.orderId) || pendingPayment?.applicationId !== application?.id) pendingPayment = null;
    renderMarkup();
    bindUi();
    renderApplication();
    renderWallet();
    renderOrderStatus();
    updateActions();
    loadAvailability();
    if (currentOrder && currentOrder.status !== "service_fee_paid") {
      refreshStatus();
      startPolling();
    } else if (currentOrder?.status === "service_fee_paid") {
      persistReceipt();
    }
  }

  window.addEventListener("turing-merchant-application-submitted", event => registerApplication(event.detail));
  window.TURING_MERCHANT_PAYMENT = Object.freeze({ enhance, registerApplication });
})();
