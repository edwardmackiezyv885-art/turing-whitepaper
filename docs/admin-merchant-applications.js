(() => {
  "use strict";

  const config = window.TURING_MERCHANT_APPLICATION_CONFIG;
  if (!config?.api?.admin) return;

  const TOKEN_KEY = "turing-merchant-admin-token";
  const $ = id => document.getElementById(id);
  const tokenInput = $("merchant-admin-token");
  const loginButton = $("merchant-admin-login");
  const logoutButton = $("merchant-admin-logout");
  const sessionStatus = $("merchant-admin-session");
  const applicationsSection = $("merchant-admin-applications");
  const list = $("merchant-admin-list");
  const statusFilter = $("merchant-admin-status-filter");
  const searchInput = $("merchant-admin-search");
  const refreshButton = $("merchant-admin-refresh");
  let adminToken = sessionStorage.getItem(TOKEN_KEY) || "";
  let applications = [];
  let objectUrls = [];
  let assetObserver = null;
  let renderGeneration = 0;
  const assetRequests = new WeakMap();

  function setSession(message, type = "") {
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

  function truncate(value, head = 8, tail = 8) {
    const text = String(value || "");
    return text.length > head + tail + 1 ? `${text.slice(0, head)}…${text.slice(-tail)}` : text || "—";
  }

  function dateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN", { hour12: false });
  }

  async function requestJson(url, options = {}) {
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
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = data.error;
      throw error;
    }
    return data;
  }

  function meta(label, value) {
    const item = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = label;
    const content = document.createElement("strong");
    content.textContent = value || "—";
    content.title = value || "";
    item.append(name, content);
    return item;
  }

  async function hydrateAsset(image, applicationId, asset, generation) {
    try {
      const url = new URL(config.api.asset, location.origin);
      url.searchParams.set("applicationId", applicationId);
      url.searchParams.set("assetId", asset.id);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      if (!image.isConnected || generation !== renderGeneration) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      objectUrls.push(objectUrl);
      image.src = objectUrl;
      image.classList.add("is-loaded");
    } catch {
      image.alt = `${image.alt} · 图片读取失败`;
      image.closest("figure")?.classList.add("is-error");
    }
  }

  function queueAsset(image, applicationId, asset, generation) {
    assetRequests.set(image, { applicationId, asset, generation });
    if (!("IntersectionObserver" in window)) {
      hydrateAsset(image, applicationId, asset, generation);
      return;
    }
    if (!assetObserver) {
      assetObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          assetObserver.unobserve(entry.target);
          const pending = assetRequests.get(entry.target);
          if (pending) hydrateAsset(entry.target, pending.applicationId, pending.asset, pending.generation);
        }
      }, { rootMargin: "320px 0px" });
    }
    assetObserver.observe(image);
  }

  function assetFigure(application, asset, product, generation) {
    const figure = document.createElement("figure");
    figure.className = "merchant-admin-asset";
    const image = document.createElement("img");
    image.alt = product ? `商品：${product.name}` : `店面素材：${asset.caption || asset.originalName}`;
    image.loading = "lazy";
    image.width = asset.width || 400;
    image.height = asset.height || 300;
    const caption = document.createElement("figcaption");
    const title = document.createElement("strong");
    title.textContent = product?.name || asset.caption || asset.originalName || "店面图片";
    const detail = document.createElement("span");
    detail.textContent = product ? `${product.priceLabel}${product.description ? ` · ${product.description}` : ""}` : `${asset.mimeType} · ${Math.ceil((asset.bytes || 0) / 1024)} KB`;
    caption.append(title, detail);
    figure.append(image, caption);
    queueAsset(image, application.id, asset, generation);
    return figure;
  }

  function gallery(application, generation) {
    const wrap = document.createElement("div");
    wrap.className = "merchant-admin-galleries";
    const assets = application.assets || [];
    const assetById = new Map(assets.map(asset => [asset.id, asset]));

    const storefront = document.createElement("section");
    const storefrontTitle = document.createElement("h4");
    storefrontTitle.textContent = `店面图库 · ${application.storefront?.galleryAssetIds?.length || 0}`;
    const storefrontGrid = document.createElement("div");
    storefrontGrid.className = "merchant-admin-gallery";
    for (const id of application.storefront?.galleryAssetIds || []) {
      const asset = assetById.get(id);
      if (asset) storefrontGrid.appendChild(assetFigure(application, asset, null, generation));
    }
    if (!storefrontGrid.children.length) storefrontGrid.innerHTML = '<p class="admin-empty">未上传店面图片。</p>';
    storefront.append(storefrontTitle, storefrontGrid);

    const products = document.createElement("section");
    const productsTitle = document.createElement("h4");
    productsTitle.textContent = `商品目录 · ${application.offering?.products?.length || 0}`;
    const productsGrid = document.createElement("div");
    productsGrid.className = "merchant-admin-gallery";
    for (const product of application.offering?.products || []) {
      const asset = assetById.get(product.assetId);
      if (asset) productsGrid.appendChild(assetFigure(application, asset, product, generation));
    }
    if (!productsGrid.children.length) productsGrid.innerHTML = '<p class="admin-empty">未创建结构化商品图片。</p>';
    products.append(productsTitle, productsGrid);
    wrap.append(storefront, products);
    return wrap;
  }

  async function exportCatalog(applicationId, button) {
    button.disabled = true;
    try {
      const url = new URL(config.api.catalogExport, location.origin);
      url.searchParams.set("applicationId", applicationId);
      const payload = await requestJson(url.toString());
      const blob = new Blob([JSON.stringify(payload.catalog, null, 2)], { type: "application/json" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `turing-merchant-catalog-${applicationId}.json`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      showToast("商城目录 JSON 已导出", "success");
    } catch (error) {
      showToast(`导出失败：${error.message}`, "error");
    } finally {
      button.disabled = false;
    }
  }

  function reviewControls(application) {
    const form = document.createElement("form");
    form.className = "merchant-admin-review";
    const select = document.createElement("select");
    select.className = "admin-select";
    for (const [value, label] of [
      ["submitted", "已提交"],
      ["under_review", "审核中"],
      ["changes_requested", "待补充"],
      ["approved", "已批准"],
      ["catalog_ready", "商城待同步"],
      ["rejected", "未通过"]
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = application.status === value;
      select.appendChild(option);
    }
    const note = document.createElement("input");
    note.className = "admin-input";
    note.maxLength = 1000;
    note.placeholder = "审核备注（内部）";
    note.value = application.review?.note || "";
    const save = document.createElement("button");
    save.className = "admin-button";
    save.type = "submit";
    save.textContent = "保存审核状态";
    const exportButton = document.createElement("button");
    exportButton.className = "admin-button secondary";
    exportButton.type = "button";
    exportButton.textContent = "导出商城 JSON";
    exportButton.addEventListener("click", () => exportCatalog(application.id, exportButton));
    const sync = document.createElement("button");
    sync.className = "admin-button secondary";
    sync.type = "button";
    sync.disabled = true;
    sync.textContent = "同步链上商城（预留）";
    sync.title = "合约与同步适配器尚未配置，不执行链上写入";
    form.append(select, note, save, exportButton, sync);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!window.confirm(`确认将申请 ${application.id} 更新为 ${select.options[select.selectedIndex].textContent}？`)) return;
      save.disabled = true;
      try {
        await requestJson(config.api.admin, {
          method: "POST",
          body: JSON.stringify({
            action: "set_status",
            applicationId: application.id,
            status: select.value,
            note: note.value
          })
        });
        showToast("商家审核状态已保存", "success");
        await loadApplications();
      } catch (error) {
        showToast(`保存失败：${error.message}`, "error");
      } finally {
        save.disabled = false;
      }
    });
    return form;
  }

  function renderApplication(application, generation) {
    const card = document.createElement("article");
    card.className = "merchant-admin-card";
    const header = document.createElement("div");
    header.className = "merchant-admin-card-head";
    const title = document.createElement("div");
    const kicker = document.createElement("span");
    kicker.textContent = application.business?.category || "MERCHANT";
    const heading = document.createElement("h3");
    heading.textContent = application.business?.name || "未命名商家";
    const identifier = document.createElement("code");
    identifier.textContent = application.id;
    title.append(kicker, heading, identifier);
    const badge = document.createElement("span");
    badge.className = `admin-status-badge merchant-status-${application.status}`;
    badge.textContent = application.status;
    header.append(title, badge);

    const grid = document.createElement("div");
    grid.className = "merchant-admin-meta";
    grid.append(
      meta("提交时间", dateTime(application.submittedAt || application.createdAt)),
      meta("主体类型", application.business?.entityType),
      meta("经营地区", application.business?.registrationRegion),
      meta("联系人", application.contact?.name),
      meta("联系方式", application.contact?.method),
      meta("门店 / 服务区域", application.storefront?.address)
    );

    const text = document.createElement("div");
    text.className = "merchant-admin-copy";
    text.innerHTML = `<section><span>店面与品牌</span><p></p></section><section><span>主营商品与服务</span><p></p></section><section><span>玩家专属权益</span><p></p></section>`;
    const paragraphs = text.querySelectorAll("p");
    paragraphs[0].textContent = application.storefront?.introduction || "—";
    paragraphs[1].textContent = application.offering?.summary || "—";
    paragraphs[2].textContent = application.offering?.playerOffer || "—";

    const catalogState = document.createElement("div");
    catalogState.className = "merchant-admin-catalog-state";
    catalogState.innerHTML = `<span>CHAIN CATALOG</span><strong></strong><p></p>`;
    catalogState.querySelector("strong").textContent = application.chainCatalog?.readiness || "missing_assets";
    catalogState.querySelector("p").textContent = `Schema: ${application.chainCatalog?.schema || config.catalogSchema} · Sync: ${application.chainCatalog?.syncStatus || "not_configured"}`;

    card.append(header, grid, text, gallery(application, generation), catalogState, reviewControls(application));
    return card;
  }

  function render() {
    renderGeneration += 1;
    assetObserver?.disconnect();
    assetObserver = null;
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = [];
    list.textContent = "";
    const query = searchInput.value.trim().toLowerCase();
    const filtered = applications.filter(application =>
      !query ||
      application.id.toLowerCase().includes(query) ||
      String(application.business?.name || "").toLowerCase().includes(query)
    );
    if (!filtered.length) {
      list.innerHTML = '<div class="admin-empty">当前筛选条件下没有商家申请。</div>';
      return;
    }
    const generation = renderGeneration;
    filtered.forEach(application => list.appendChild(renderApplication(application, generation)));
  }

  async function loadApplications() {
    if (!adminToken) return;
    refreshButton.disabled = true;
    list.innerHTML = '<div class="admin-empty">正在读取商家资料与商品目录…</div>';
    try {
      const url = new URL(config.api.admin, location.origin);
      if (statusFilter.value) url.searchParams.set("status", statusFilter.value);
      const data = await requestJson(url.toString());
      applications = Array.isArray(data.applications) ? data.applications : [];
      render();
      setSession(`已连接商家管理 API · ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`);
    } catch (error) {
      list.innerHTML = '<div class="admin-empty">无法读取商家申请，请检查管理员令牌或服务状态。</div>';
      setSession(error.status === 401 ? "管理员令牌无效。" : `读取失败：${error.message}`, "error");
      if (error.status === 401) logout(false);
    } finally {
      refreshButton.disabled = false;
    }
  }

  async function login() {
    const token = tokenInput.value.trim();
    if (!token) {
      tokenInput.focus();
      return setSession("请输入管理员令牌。", "error");
    }
    adminToken = token;
    sessionStorage.setItem(TOKEN_KEY, token);
    loginButton.disabled = true;
    applicationsSection.hidden = false;
    logoutButton.hidden = false;
    try {
      await loadApplications();
      if (!adminToken) throw new Error("Unauthorized");
      loginButton.hidden = true;
      tokenInput.disabled = true;
      tokenInput.value = "";
    } catch (error) {
      if (adminToken) setSession(`登录失败：${error.message}`, "error");
    } finally {
      loginButton.disabled = false;
    }
  }

  function logout(showMessage = true) {
    adminToken = "";
    sessionStorage.removeItem(TOKEN_KEY);
    renderGeneration += 1;
    assetObserver?.disconnect();
    assetObserver = null;
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = [];
    applications = [];
    tokenInput.disabled = false;
    tokenInput.value = "";
    loginButton.hidden = false;
    logoutButton.hidden = true;
    applicationsSection.hidden = true;
    list.textContent = "";
    if (showMessage) setSession("已退出商家后台。令牌已从本标签页清除。");
  }

  loginButton.addEventListener("click", login);
  logoutButton.addEventListener("click", () => logout(true));
  refreshButton.addEventListener("click", loadApplications);
  statusFilter.addEventListener("change", loadApplications);
  searchInput.addEventListener("input", render);
  tokenInput.addEventListener("keydown", event => { if (event.key === "Enter") login(); });

  if (adminToken) {
    applicationsSection.hidden = false;
    logoutButton.hidden = false;
    loginButton.hidden = true;
    tokenInput.disabled = true;
    loadApplications();
  }
})();
