(() => {
  "use strict";

  const DATA = window.WHITEPAPER_DATA;
  const root = document.documentElement;
  const article = document.getElementById("article");
  const sidebarNav = document.getElementById("sidebar-nav");
  const pageNav = document.getElementById("page-nav");
  const tocNav = document.getElementById("toc-nav");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("drawer-scrim");
  const menuButton = document.getElementById("menu-button");
  const langButton = document.getElementById("lang-button");
  const themeButton = document.getElementById("theme-button");
  const copyLinkButton = document.getElementById("copy-link");
  const searchDialog = document.getElementById("search-dialog");
  const searchTrigger = document.getElementById("search-trigger");
  const searchClose = document.getElementById("search-close");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const toast = document.getElementById("toast");

  let currentLang = "zh";
  let currentSlug = "introduction";
  let tocObserver = null;
  let toastTimer = null;
  const expandedNav = new Set(["gameplay"]);

  function parseRoute() {
    const cleaned = location.hash.replace(/^#\/?/, "").split("?")[0];
    const [lang, slug] = cleaned.split("/");
    const safeLang = DATA[lang] ? lang : (localStorage.getItem("turing-lang") || "zh");
    const safeSlug = DATA[safeLang].pages[slug] ? slug : "introduction";
    return { lang: safeLang, slug: safeSlug };
  }

  function allPageSlugs(lang) {
    const slugs = [];
    const walk = items => items.forEach(item => {
      if (item.slug && !slugs.includes(item.slug)) slugs.push(item.slug);
      if (item.children) walk(item.children);
    });
    walk(DATA[lang].navigation);
    return slugs;
  }

  function route(lang, slug) {
    return `#/${lang}/${slug}`;
  }

  function applyUi(lang) {
    const ui = DATA[lang].ui;
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach(node => {
      const value = ui[node.dataset.i18n];
      if (value) node.textContent = value;
    });
    searchInput.placeholder = ui.searchPlaceholder;
    searchTrigger.setAttribute("aria-label", ui.search);
    const brand = document.querySelector(".brand");
    brand.setAttribute("aria-label", lang === "zh" ? "图灵白皮书首页" : "Turing whitepaper home");
    brand.setAttribute("href", route(lang, "introduction"));
    themeButton.setAttribute("aria-label", lang === "zh" ? "切换深色模式" : "Toggle color theme");
    menuButton.setAttribute("aria-label", lang === "zh" ? "打开目录" : "Open table of contents");
    searchClose.setAttribute("aria-label", lang === "zh" ? "关闭搜索" : "Close search");
    document.getElementById("search-title").textContent = ui.search;
    langButton.querySelector("span:first-child").style.color = lang === "zh" ? "var(--primary)" : "var(--faint)";
    langButton.querySelector("span:last-child").style.color = lang === "en" ? "var(--primary)" : "var(--faint)";
  }

  function renderSidebar(lang, slug) {
    const data = DATA[lang];
    const containsSlug = item => item.slug === slug || (item.children || []).some(containsSlug);
    const renderItem = (item, depth = 0) => {
      const page = data.pages[item.slug];
      const hasChildren = Boolean(item.children?.length);
      const isActive = item.slug === slug;
      const branchActive = containsSlug(item);
      const isExpanded = hasChildren && (expandedNav.has(item.slug) || branchActive);
      if (branchActive && hasChildren) expandedNav.add(item.slug);
      return `<div class="nav-tree-item depth-${Math.min(depth, 3)} ${branchActive ? "branch-active" : ""}" data-nav-id="${item.slug}">
        <div class="nav-row">
          <a class="nav-link ${isActive ? "active" : ""}" href="${route(lang, item.slug)}" ${isActive ? 'aria-current="page"' : ""}>
            <span>${page.nav}</span>
          </a>
          ${hasChildren ? `<button class="nav-toggle" type="button" aria-label="${data.ui.toggleSection}: ${page.nav}" aria-expanded="${isExpanded}">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>
          </button>` : ""}
        </div>
        ${hasChildren ? `<div class="nav-children ${isExpanded ? "expanded" : ""}">${item.children.map(child => renderItem(child, depth + 1)).join("")}</div>` : ""}
      </div>`;
    };
    sidebarNav.innerHTML = `<div class="nav-tree">${data.navigation.map(item => renderItem(item)).join("")}</div>`;

    sidebarNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeDrawer));
    sidebarNav.querySelectorAll(".nav-toggle").forEach(button => button.addEventListener("click", () => {
      const item = button.closest(".nav-tree-item");
      const children = item.querySelector(":scope > .nav-children");
      const id = item.dataset.navId;
      const next = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(next));
      children.classList.toggle("expanded", next);
      if (next) expandedNav.add(id); else expandedNav.delete(id);
    }));
  }

  function responsiveImageMarkup(source, alt, { eager = false } = {}) {
    const webpMatch = String(source || "").match(/^(.*)\.webp$/i);
    const loading = eager ? "eager" : "lazy";
    const priority = eager ? ' fetchpriority="high"' : "";
    if (!webpMatch) {
      return `<img src="${source}" alt="${alt}" width="1600" height="900" loading="${loading}" decoding="async"${priority}>`;
    }

    const base = webpMatch[1];
    const sizes = "(max-width: 820px) calc(100vw - 34px), 760px";
    return `<picture>
      <source type="image/webp" srcset="${base}-800.webp 800w, ${source} 1600w" sizes="${sizes}">
      <img src="${base}.jpg" srcset="${base}-800.jpg 800w, ${base}.jpg 1600w" sizes="${sizes}" alt="${alt}" width="1600" height="900" loading="${loading}" decoding="async"${priority}>
    </picture>`;
  }

  function heroMediaMarkup(page, lang) {
    if (!page.heroVideo) {
      return responsiveImageMarkup(page.hero, page.heroAlt, { eager: true });
    }
    const fallback = lang === "zh" ? "您的浏览器暂不支持视频播放。" : "Your browser does not support video playback.";
    return `<video class="hero-video" controls muted loop playsinline preload="metadata" poster="${page.hero}" aria-label="${page.heroVideoLabel || page.heroAlt}" data-autoplay-media><source src="${page.heroVideo}" type="video/mp4">${fallback}</video>`;
  }

  function activateAutoplayMedia() {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    article.querySelectorAll("video[data-autoplay-media]").forEach(video => {
      if (prefersReducedMotion) {
        video.autoplay = false;
        video.pause();
        return;
      }
      video.autoplay = true;
      video.play().catch(() => {});
    });
  }

  function enhanceContentMedia() {
    article.querySelectorAll('img[src$=".webp"]').forEach(image => {
      if (image.closest("picture")) return;
      const source = image.getAttribute("src");
      const wrapper = document.createElement("div");
      wrapper.innerHTML = responsiveImageMarkup(source, image.getAttribute("alt") || "");
      const picture = wrapper.firstElementChild;
      const generatedImage = picture.querySelector("img");
      [...image.attributes].forEach(attribute => {
        if (!["src", "alt", "loading", "decoding", "width", "height"].includes(attribute.name)) {
          generatedImage.setAttribute(attribute.name, attribute.value);
        }
      });
      image.replaceWith(picture);
    });

    article.querySelectorAll('video[poster$=".webp"]').forEach(video => {
      video.poster = video.getAttribute("poster").replace(/\.webp$/i, "-800.jpg");
    });
  }

  function formatEconomyMetric(value, lang) {
    if (value === null || value === undefined || value === "") return "—";
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-US", {
      maximumFractionDigits: 2
    }).format(number);
  }

  function formatDashboardTime(value, lang) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  async function hydrateEconomyDashboard(lang, slug) {
    if (slug !== "economy-dashboard") return;
    const dashboard = article.querySelector("[data-economy-dashboard]");
    if (!dashboard) return;
    const statusWrap = dashboard.querySelector("[data-dashboard-status-wrap]");
    const status = dashboard.querySelector("[data-dashboard-status]");
    const updated = dashboard.querySelector("[data-dashboard-updated]");

    try {
      const response = await fetch("./assets/data/economy-dashboard.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Economy data request failed: ${response.status}`);
      const payload = await response.json();
      if (!dashboard.isConnected) return;

      article.querySelectorAll("[data-metric]").forEach(element => {
        const value = payload.metrics?.[element.dataset.metric];
        element.textContent = formatEconomyMetric(value, lang);
        element.closest(".economy-metric-card, .economy-summary-grid article, .rwa-metric-card")
          ?.classList.toggle("is-unavailable", value === null || value === undefined || value === "");
      });

      const isLive = payload.status === "live";
      const displayTime = formatDashboardTime(payload.asOf, lang);
      status.textContent = isLive
        ? (lang === "zh" ? "正式数据已接入" : "Verified data is live")
        : (lang === "zh" ? "数据源待接入" : "Data source pending");
      updated.textContent = displayTime
        ? (lang === "zh" ? `统计截至 ${displayTime}` : `Reported through ${displayTime}`)
        : (lang === "zh" ? "尚无正式统计时间" : "No official reporting time yet");
      statusWrap.classList.toggle("is-live", isLive);
      statusWrap.classList.toggle("is-pending", !isLive);
      statusWrap.setAttribute("aria-busy", "false");
    } catch (error) {
      if (!dashboard.isConnected) return;
      status.textContent = lang === "zh" ? "数据暂时无法加载" : "Data temporarily unavailable";
      updated.textContent = lang === "zh" ? "请稍后重试" : "Please try again later";
      statusWrap.classList.add("is-error");
      statusWrap.setAttribute("aria-busy", "false");
      console.warn(error);
    }
  }

  function enhanceMerchantOnboarding(lang, slug) {
    if (slug !== "merchant-onboarding") return;
    const form = article.querySelector("#merchant-onboarding-form");
    const status = form?.querySelector("[data-merchant-form-status]");
    const submit = form?.querySelector('button[type="submit"]');
    if (!form || !status || !submit) return;
    window.TURING_MERCHANT_ASSETS?.enhance?.({ form, lang });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const originalLabel = submit.querySelector("span")?.textContent || submit.textContent;
      submit.disabled = true;
      form.setAttribute("aria-busy", "true");
      submit.querySelector("span").textContent = lang === "zh" ? "正在提交…" : "Submitting…";
      status.textContent = lang === "zh" ? "正在保存商家资料与图片…" : "Saving merchant information and images…";
      status.className = "merchant-form-status";

      try {
        if (typeof window.TURING_MERCHANT_ASSETS?.prepareSubmission !== "function") {
          throw new Error("Merchant asset service is unavailable");
        }
        const prepared = await window.TURING_MERCHANT_ASSETS.prepareSubmission(form);
        const applicationId = prepared.applicationId;
        const applicationToken = prepared.applicationToken;
        const applicationIdInput = form.elements.namedItem("application_id");
        if (applicationIdInput) applicationIdInput.value = applicationId;
        const formData = new FormData(form);
        const businessName = String(formData.get("business_name") || "");
        const applicationPayload = {
          applicationId,
          locale: String(formData.get("locale") || lang),
          sourcePage: String(formData.get("source_page") || "whitepaper-merchant-onboarding"),
          businessName,
          entityType: String(formData.get("entity_type") || ""),
          registrationRegion: String(formData.get("registration_region") || ""),
          contactName: String(formData.get("contact_name") || ""),
          contactMethod: String(formData.get("contact_method") || ""),
          storeAddress: String(formData.get("store_address") || ""),
          businessCategory: String(formData.get("business_category") || ""),
          launchRegion: String(formData.get("launch_region") || ""),
          businessIntro: String(formData.get("business_intro") || ""),
          productsServices: String(formData.get("products_services") || ""),
          playerOffer: String(formData.get("player_offer") || ""),
          gemPreference: String(formData.get("gem_preference") || ""),
          officialWebsite: String(formData.get("official_website") || ""),
          assetLinks: String(formData.get("asset_links") || ""),
          authorizationConfirmed: formData.get("authorization_confirmed") === "yes",
          termsAcknowledged: formData.get("terms_acknowledged") === "yes",
          privacyAcknowledged: formData.get("privacy_acknowledged") === "yes",
          assetIds: prepared.assetIds,
          products: prepared.products
        };
        const response = await fetch(window.TURING_MERCHANT_APPLICATION_CONFIG.api.submit, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Application-Token": applicationToken
          },
          body: JSON.stringify(applicationPayload)
        });
        const responseBody = await response.json().catch(() => ({}));
        if (!response.ok || responseBody.application?.id !== applicationId) {
          throw new Error(responseBody.message || `HTTP ${response.status}`);
        }
        if (!form.isConnected) return;

        const archiveData = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
          if (typeof value === "string") archiveData.append(key, value);
        }
        const submittedAt = responseBody.application.submittedAt || new Date().toISOString();
        archiveData.set("form-name", "merchant-onboarding");
        archiveData.set("submitted_at", submittedAt);
        archiveData.set("application_id", applicationId);
        archiveData.set("store_asset_ids", prepared.storefrontAssetIds.join(","));
        archiveData.set("product_asset_ids", prepared.productAssetIds.join(","));
        archiveData.set("catalog_schema", window.TURING_MERCHANT_APPLICATION_CONFIG.catalogSchema);
        fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: archiveData.toString()
        }).catch(error => console.warn("Merchant form archive failed:", error?.message || error));

        window.TURING_MERCHANT_ASSETS.reset();
        form.reset();
        status.textContent = lang === "zh"
          ? `资料与图片已进入商家审核后台。申请编号：${applicationId}。商品目录已按链上商城接口结构保存，下方已解锁 1,400 USDT 主网服务费订单。`
          : `Application and images are saved to the review backend. Application ID: ${applicationId}. The catalog uses the reserved chain-marketplace schema, and the 1,400 USDT Mainnet service-fee order is unlocked below.`;
        status.className = "merchant-form-status success";
        window.dispatchEvent(new CustomEvent("turing-merchant-application-submitted", {
          detail: { applicationId, applicationToken, businessName, submittedAt }
        }));
      } catch (error) {
        if (!form.isConnected) return;
        console.warn("Merchant onboarding form failed:", error?.message || error);
        status.textContent = lang === "zh"
          ? "提交暂未成功，请检查网络后重试；不要通过私聊转账或发送敏感证件。"
          : "Submission did not complete. Check your connection and retry; do not transfer funds or send sensitive documents through private messages.";
        status.className = "merchant-form-status error";
      } finally {
        if (!form.isConnected) return;
        submit.disabled = false;
        form.setAttribute("aria-busy", "false");
        submit.querySelector("span").textContent = originalLabel;
      }
    });
  }

  function renderArticle(lang, slug) {
    const page = DATA[lang].pages[slug];
    const ui = DATA[lang].ui;
    article.innerHTML = `
      <header class="article-header">
        <span class="eyebrow">${page.eyebrow}</span>
        <h1>${page.title}</h1>
        ${page.deck ? `<p class="article-deck">${page.deck}</p>` : ""}
        <div class="update-line">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          <span>${ui.lastUpdated}</span>
        </div>
      </header>
      ${page.hero ? `<figure class="hero-figure${page.heroVideo ? " hero-video-figure" : ""}">${heroMediaMarkup(page, lang)}<figcaption>${page.heroCaption}</figcaption></figure>` : ""}
      ${page.content}`;
    enhanceContentMedia();
    activateAutoplayMedia();
    hydrateEconomyDashboard(lang, slug);
    enhanceMerchantOnboarding(lang, slug);
    window.TURING_MERCHANT_PAYMENT?.enhance?.({ lang, root: article });
    document.title = `${page.title} · ${lang === "zh" ? "图灵白皮书" : "Turing Whitepaper"}`;
  }

  function renderToc(lang, slug) {
    const headings = [...article.querySelectorAll("h2[id]")];
    tocNav.innerHTML = headings.map(heading => `<a href="#${heading.id}" data-target="${heading.id}">${heading.textContent}</a>`).join("");
    tocNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        const target = document.getElementById(link.dataset.target);
        if (!target) return;
        target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", route(lang, slug));
      });
    });

    if (tocObserver) tocObserver.disconnect();
    if (!("IntersectionObserver" in window)) return;
    tocObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        tocNav.querySelectorAll("a").forEach(link => link.classList.toggle("active", link.dataset.target === entry.target.id));
      });
    }, { rootMargin: "-18% 0px -70% 0px" });
    headings.forEach(heading => tocObserver.observe(heading));
  }

  function renderPageNav(lang, slug) {
    const data = DATA[lang];
    const pages = allPageSlugs(lang);
    const index = pages.indexOf(slug);
    const prevSlug = pages[index - 1];
    const nextSlug = pages[index + 1];
    pageNav.innerHTML = `
      ${prevSlug ? `<a href="${route(lang, prevSlug)}"><small>← ${data.ui.prev}</small><b>${data.pages[prevSlug].nav}</b></a>` : "<span></span>"}
      ${nextSlug ? `<a class="next" href="${route(lang, nextSlug)}"><small>${data.ui.next} →</small><b>${data.pages[nextSlug].nav}</b></a>` : ""}`;
  }

  function render({ preserveScroll = false } = {}) {
    const parsed = parseRoute();
    currentLang = parsed.lang;
    currentSlug = parsed.slug;
    localStorage.setItem("turing-lang", currentLang);
    applyUi(currentLang);
    renderSidebar(currentLang, currentSlug);
    renderArticle(currentLang, currentSlug);
    renderToc(currentLang, currentSlug);
    renderPageNav(currentLang, currentSlug);
    if (!preserveScroll) window.scrollTo({ top: 0, behavior: "auto" });
  }

  function switchLanguage() {
    const nextLang = currentLang === "zh" ? "en" : "zh";
    location.hash = route(nextLang, currentSlug);
  }

  function toggleTheme() {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("turing-theme", next);
    document.querySelector('meta[name="theme-color"]').content = next === "dark" ? "#0b1220" : "#f7faff";
  }

  function openDrawer() {
    sidebar.classList.add("open");
    scrim.classList.add("open");
    document.body.classList.add("nav-open");
    menuButton.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    sidebar.classList.remove("open");
    scrim.classList.remove("open");
    document.body.classList.remove("nav-open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  function openSearch() {
    if (!searchDialog.open) searchDialog.showModal();
    searchInput.value = "";
    renderSearchResults("");
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch() {
    if (searchDialog.open) searchDialog.close();
  }

  function plainText(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || "").replace(/\s+/g, " ").trim();
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function renderSearchResults(query) {
    const data = DATA[currentLang];
    const normalized = query.trim().toLocaleLowerCase();
    const pages = allPageSlugs(currentLang).map(slug => {
      const page = data.pages[slug];
      const body = plainText(page.content);
      return { slug, page, body, haystack: `${page.title} ${page.deck} ${body}`.toLocaleLowerCase() };
    });
    const matches = normalized ? pages.filter(item => item.haystack.includes(normalized)).slice(0, 10) : pages.slice(0, 7);
    if (!matches.length) {
      searchResults.innerHTML = `<div class="empty-search">${data.ui.noResults}</div>`;
      return;
    }
    searchResults.innerHTML = matches.map(({ slug, page, body }) => {
      let snippet = page.deck;
      if (normalized) {
        const index = body.toLocaleLowerCase().indexOf(normalized);
        if (index >= 0) snippet = `${index > 34 ? "…" : ""}${body.slice(Math.max(0, index - 34), index + normalized.length + 76)}${index + normalized.length + 76 < body.length ? "…" : ""}`;
      }
      return `<a class="search-result" href="${route(currentLang, slug)}"><b>${page.title}</b><span>${snippet}</span></a>`;
    }).join("");
    searchResults.querySelectorAll("a").forEach(link => link.addEventListener("click", closeSearch));
  }

  async function copyPageLink() {
    const value = `${location.origin}${location.pathname}${route(currentLang, currentSlug)}`;
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast(DATA[currentLang].ui.copied);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  const storedTheme = localStorage.getItem("turing-theme");
  const initialTheme = storedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = initialTheme;
  document.querySelector('meta[name="theme-color"]').content = initialTheme === "dark" ? "#0b1220" : "#f7faff";

  menuButton.addEventListener("click", () => sidebar.classList.contains("open") ? closeDrawer() : openDrawer());
  scrim.addEventListener("click", closeDrawer);
  langButton.addEventListener("click", switchLanguage);
  themeButton.addEventListener("click", toggleTheme);
  copyLinkButton.addEventListener("click", copyPageLink);
  searchTrigger.addEventListener("click", openSearch);
  searchClose.addEventListener("click", closeSearch);
  searchInput.addEventListener("input", event => renderSearchResults(event.target.value));
  searchDialog.addEventListener("click", event => { if (event.target === searchDialog) closeSearch(); });
  document.querySelector(".skip-link").addEventListener("click", event => {
    event.preventDefault();
    const main = document.getElementById("main-content");
    main.focus();
    main.scrollIntoView({ behavior: "auto", block: "start" });
  });
  window.addEventListener("hashchange", () => render());
  window.addEventListener("resize", () => { if (innerWidth > 820) closeDrawer(); });
  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && searchDialog.open) {
      closeSearch();
      searchTrigger.focus();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
  });

  if (!location.hash) {
    const preferred = localStorage.getItem("turing-lang") || (navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en");
    history.replaceState(null, "", route(preferred, "introduction"));
  }
  render();
})();
