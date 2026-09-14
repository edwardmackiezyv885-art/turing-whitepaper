(() => {
  "use strict";

  const config = window.TURING_NODE_CONFIG;
  if (!config?.api?.admin) return;

  const TOKEN_KEY = "turing-node-admin-token";
  const $ = id => document.getElementById(id);
  const tokenInput = $("admin-token");
  const loginButton = $("admin-login");
  const logoutButton = $("admin-logout");
  const sessionStatus = $("admin-session-status");
  const ordersSection = $("admin-orders");
  const orderList = $("admin-order-list");
  const statusFilter = $("admin-status-filter");
  const refreshButton = $("admin-refresh");
  let adminToken = sessionStorage.getItem(TOKEN_KEY) || "";

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

  function isAddress(value) {
    const decoded = decodeBase58((value || "").trim());
    return Boolean(decoded && decoded.length === 32);
  }

  function isSignature(value) {
    return /^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test((value || "").trim());
  }

  function truncate(value, head = 8, tail = 8) {
    return value ? `${value.slice(0, head)}…${value.slice(-tail)}` : "—";
  }

  function setSessionMessage(message, type = "") {
    sessionStatus.textContent = message;
    sessionStatus.className = `admin-session${type ? ` ${type}` : ""}`;
  }

  function showToast(message, type = "info") {
    const toast = $("toast");
    clearTimeout(showToast.timer);
    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("show");
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 4200);
  }

  async function adminRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${adminToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.code = data.error;
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function explorerLink(value, kind) {
    const link = document.createElement("a");
    link.href = `https://explorer.solana.com/${kind}/${encodeURIComponent(value)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = truncate(value);
    link.title = value;
    return link;
  }

  function metaCell(label, value, kind = "text") {
    const wrap = document.createElement("div");
    const title = document.createElement("span");
    title.textContent = label;
    wrap.appendChild(title);
    if (kind === "tx" && value) wrap.appendChild(explorerLink(value, "tx"));
    else if (kind === "address" && value) wrap.appendChild(explorerLink(value, "address"));
    else {
      const content = document.createElement(kind === "strong" ? "strong" : "code");
      content.textContent = value || "—";
      content.title = value || "";
      wrap.appendChild(content);
    }
    return wrap;
  }

  function buildIssueForm(order) {
    const form = document.createElement("form");
    form.className = "admin-issue-form";

    if (order.status === "nft_issued") {
      form.appendChild(metaCell("NFT Mint", order.nftMint, "address"));
      form.appendChild(metaCell("发放交易 / Issuance tx", order.issuanceSignature, "tx"));
      return form;
    }

    if (!["nft_pending", "paid_manual_review"].includes(order.status)) {
      const unavailable = document.createElement("p");
      unavailable.className = "admin-form-status";
      unavailable.textContent = "该订单尚未完成付款核验，不能登记 NFT 发放。";
      form.appendChild(unavailable);
      return form;
    }

    const mintLabel = document.createElement("label");
    mintLabel.className = "admin-field";
    const mintTitle = document.createElement("span");
    mintTitle.textContent = "NFT Mint";
    const mintInput = document.createElement("input");
    mintInput.className = "admin-input";
    mintInput.name = "nftMint";
    mintInput.required = true;
    mintInput.autocomplete = "off";
    mintInput.spellcheck = false;
    mintLabel.append(mintTitle, mintInput);

    const signatureLabel = document.createElement("label");
    signatureLabel.className = "admin-field";
    const signatureTitle = document.createElement("span");
    signatureTitle.textContent = "发放交易签名 / Issuance signature";
    const signatureInput = document.createElement("input");
    signatureInput.className = "admin-input";
    signatureInput.name = "issuanceSignature";
    signatureInput.required = true;
    signatureInput.autocomplete = "off";
    signatureInput.spellcheck = false;
    signatureLabel.append(signatureTitle, signatureInput);

    const submit = document.createElement("button");
    submit.className = "admin-button";
    submit.type = "submit";
    submit.textContent = "标记 NFT 已发放";
    const status = document.createElement("p");
    status.className = "admin-form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    form.append(mintLabel, signatureLabel, submit, status);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const nftMint = mintInput.value.trim();
      const issuanceSignature = signatureInput.value.trim();
      if (!isAddress(nftMint) || !isSignature(issuanceSignature)) {
        status.textContent = "请检查 NFT Mint 和发放交易签名。";
        status.className = "admin-form-status error";
        (!isAddress(nftMint) ? mintInput : signatureInput).focus();
        return;
      }
      const reviewWarning = order.status === "paid_manual_review" ? "\n\n警告：该订单处于人工复核状态，请先核对库存、付款与处理决定。" : "";
      if (!window.confirm(`确认订单 ${order.id} 的 NFT 已发放？此操作会写入正式订单记录。${reviewWarning}`)) return;
      submit.disabled = true;
      status.textContent = "正在保存…";
      status.className = "admin-form-status";
      try {
        await adminRequest(config.api.admin, {
          method: "POST",
          body: JSON.stringify({ action: "mark_nft_issued", orderId: order.id, nftMint, issuanceSignature })
        });
        status.textContent = "已标记为 NFT 已发放。";
        status.className = "admin-form-status success";
        showToast("NFT 发放记录已保存", "success");
        await loadOrders();
      } catch (error) {
        status.textContent = error.status === 401 ? "管理员令牌无效或已更换。" : `保存失败：${error.message}`;
        status.className = "admin-form-status error";
        if (error.status === 401) logout(false);
      } finally {
        submit.disabled = false;
      }
    });
    return form;
  }

  function renderOrders(orders) {
    orderList.textContent = "";
    if (!orders.length) {
      const empty = document.createElement("div");
      empty.className = "admin-empty";
      empty.textContent = "当前筛选条件下没有订单。";
      orderList.appendChild(empty);
      return;
    }

    for (const order of orders) {
      const card = document.createElement("article");
      card.className = "admin-order-card";
      const meta = document.createElement("div");
      meta.className = "admin-order-meta";
      const title = document.createElement("div");
      title.className = "admin-order-title";
      const heading = document.createElement("h3");
      heading.textContent = `${order.tierLevel || order.tierId} · ${order.displayAmount || order.amount || "—"} USDT`;
      const badge = document.createElement("span");
      badge.className = `admin-status-badge${order.status === "nft_issued" ? " issued" : ""}${order.status === "paid_manual_review" ? " review" : ""}`;
      badge.textContent = order.status || "unknown";
      title.append(heading, badge);

      const grid = document.createElement("div");
      grid.className = "admin-meta-grid";
      grid.append(
        metaCell("订单号 / Order ID", order.id),
        metaCell("付款时间 / Paid at", order.paidAt || order.createdAt),
        metaCell("购买钱包 / Buyer", order.buyer, "address"),
        metaCell("邀请人 / Referrer", order.referrer || "官方直购"),
        metaCell("付款交易 / Payment tx", order.paymentSignature, "tx"),
        metaCell("类型 / Type", order.isTest ? "历史非正式 / NON-PRODUCTION" : "PRODUCTION", "strong")
      );
      meta.append(title, grid);
      card.append(meta, buildIssueForm(order));
      orderList.appendChild(card);
    }
  }

  async function loadOrders() {
    if (!adminToken) return;
    refreshButton.disabled = true;
    orderList.innerHTML = '<div class="admin-empty">正在读取订单…</div>';
    try {
      const url = new URL(config.api.admin, location.origin);
      url.searchParams.set("status", statusFilter.value);
      const data = await adminRequest(url.toString());
      renderOrders(Array.isArray(data) ? data : (data.orders || []));
      setSessionMessage(`已连接管理 API · ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      orderList.innerHTML = '<div class="admin-empty">无法读取订单，请检查管理员令牌或服务状态。</div>';
      setSessionMessage(error.status === 401 ? "管理员令牌无效。" : `读取失败：${error.message}`, "error");
      if (error.status === 401) logout(false);
    } finally {
      refreshButton.disabled = false;
    }
  }

  async function login() {
    const token = tokenInput.value.trim();
    if (!token) {
      tokenInput.focus();
      return setSessionMessage("请输入管理员令牌。", "error");
    }
    adminToken = token;
    sessionStorage.setItem(TOKEN_KEY, token);
    loginButton.disabled = true;
    try {
      ordersSection.hidden = false;
      logoutButton.hidden = false;
      tokenInput.value = "";
      await loadOrders();
      if (!adminToken) throw new Error("Unauthorized");
      loginButton.hidden = true;
      tokenInput.disabled = true;
    } catch (error) {
      if (adminToken) setSessionMessage(`登录失败：${error.message}`, "error");
    } finally {
      loginButton.disabled = false;
    }
  }

  function logout(showMessage = true) {
    adminToken = "";
    sessionStorage.removeItem(TOKEN_KEY);
    tokenInput.disabled = false;
    tokenInput.value = "";
    loginButton.hidden = false;
    logoutButton.hidden = true;
    ordersSection.hidden = true;
    orderList.textContent = "";
    if (showMessage) setSessionMessage("已退出管理台。令牌已从本标签页清除。");
  }

  loginButton.addEventListener("click", login);
  logoutButton.addEventListener("click", () => logout(true));
  refreshButton.addEventListener("click", loadOrders);
  statusFilter.addEventListener("change", loadOrders);
  tokenInput.addEventListener("keydown", event => { if (event.key === "Enter") login(); });

  if (adminToken) {
    ordersSection.hidden = false;
    logoutButton.hidden = false;
    loginButton.hidden = true;
    tokenInput.disabled = true;
    loadOrders();
  }
})();
