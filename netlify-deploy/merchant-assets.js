(() => {
  "use strict";

  const config = window.TURING_MERCHANT_APPLICATION_CONFIG;
  if (!config) return;

  const copy = {
    zh: {
      storefront: "店面图片",
      product: "商品图片",
      cover: "封面",
      remove: "移除",
      caption: "图片说明（可选）",
      productName: "商品名称 *",
      priceLabel: "价格说明 *",
      description: "商品简介（可选）",
      emptyStorefront: "尚未选择店面图片。建议上传门头、室内环境和服务场景。",
      emptyProduct: "尚未选择商品图片。选择后请为每张图片填写商品名称与价格说明。",
      invalidType: "只支持 JPG、PNG 和 WebP 图片。",
      inputTooLarge: "单张原图不能超过 12 MB。",
      limitReached: "已达到该分组的图片数量上限。",
      duplicate: "这张图片已经添加。",
      selected: "图片已加入待上传列表，提交申请时会自动压缩并上传。",
      uploading: "正在优化并上传图片 {current}/{total}…",
      uploadComplete: "图片已安全保存到商家素材后台。",
      uploadFailed: "图片上传失败，请检查网络后重试。已选择的图片不会丢失。",
      metadataRequired: "请补全每张商品图片的商品名称和价格说明。",
      imageProcessFailed: "图片无法读取或压缩，请更换文件后重试。",
      serverMismatch: "素材服务配置不一致，当前没有上传任何图片。"
    },
    en: {
      storefront: "Storefront image",
      product: "Product image",
      cover: "Cover",
      remove: "Remove",
      caption: "Image note (optional)",
      productName: "Product name *",
      priceLabel: "Price label *",
      description: "Product summary (optional)",
      emptyStorefront: "No storefront images selected. Add the facade, interior, and service environment.",
      emptyProduct: "No product images selected. Each selected image requires a product name and price label.",
      invalidType: "Only JPG, PNG, and WebP images are accepted.",
      inputTooLarge: "Each source image must be 12 MB or smaller.",
      limitReached: "This image group has reached its limit.",
      duplicate: "This image is already selected.",
      selected: "Images are queued. They will be optimized and uploaded when the application is submitted.",
      uploading: "Optimizing and uploading image {current}/{total}…",
      uploadComplete: "Images are safely stored in the merchant asset backend.",
      uploadFailed: "Image upload failed. Check the network and retry; selected images are preserved.",
      metadataRequired: "Complete the product name and price label for every product image.",
      imageProcessFailed: "The image could not be read or optimized. Replace it and retry.",
      serverMismatch: "The asset-service configuration does not match. No images were uploaded."
    }
  };

  let lang = "zh";
  let form = null;
  let draft = null;
  const records = { storefront: [], product: [] };
  const t = key => copy[lang]?.[key] || copy.zh[key] || key;
  const uuid = () => crypto.randomUUID();

  function status(message, type = "") {
    const target = form?.querySelector("[data-merchant-assets-status]");
    if (!target) return;
    target.textContent = message;
    target.className = `merchant-assets-status${type ? ` ${type}` : ""}`;
  }

  function humanBytes(value) {
    return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
  }

  function duplicateFile(kind, file) {
    return records[kind].some(record =>
      record.file.name === file.name &&
      record.file.size === file.size &&
      record.file.lastModified === file.lastModified
    );
  }

  function addFiles(kind, files) {
    const limit = config.limits[kind];
    let added = 0;
    for (const file of [...files]) {
      if (!config.acceptedTypes.includes(file.type)) {
        status(t("invalidType"), "error");
        continue;
      }
      if (file.size < 1 || file.size > config.maxInputBytes) {
        status(t("inputTooLarge"), "error");
        continue;
      }
      if (records[kind].length >= limit) {
        status(t("limitReached"), "error");
        break;
      }
      if (duplicateFile(kind, file)) {
        status(t("duplicate"), "error");
        continue;
      }
      records[kind].push({
        id: uuid(),
        file,
        objectUrl: URL.createObjectURL(file),
        caption: "",
        productName: "",
        priceLabel: "",
        description: "",
        uploadedAsset: null
      });
      added += 1;
    }
    renderGroup(kind);
    if (added) status(t("selected"), "info");
  }

  function field(labelText, value, maxLength, onInput, required = false) {
    const label = document.createElement("label");
    label.className = "merchant-asset-field";
    const span = document.createElement("span");
    span.textContent = labelText;
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.maxLength = maxLength;
    input.required = required;
    input.addEventListener("input", () => onInput(input.value));
    label.append(span, input);
    return { label, input };
  }

  function removeRecord(kind, record) {
    const index = records[kind].indexOf(record);
    if (index < 0) return;
    URL.revokeObjectURL(record.objectUrl);
    records[kind].splice(index, 1);
    renderGroup(kind);
  }

  function renderCard(kind, record, index) {
    const card = document.createElement("article");
    card.className = "merchant-asset-card";
    card.dataset.assetId = record.id;
    const media = document.createElement("div");
    media.className = "merchant-asset-media";
    const image = document.createElement("img");
    image.src = record.objectUrl;
    image.alt = `${t(kind)} · ${record.file.name}`;
    image.loading = "lazy";
    image.decoding = "async";
    media.appendChild(image);
    if (kind === "storefront" && index === 0) {
      const cover = document.createElement("span");
      cover.textContent = t("cover");
      media.appendChild(cover);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "merchant-asset-remove";
    remove.setAttribute("aria-label", `${t("remove")} ${record.file.name}`);
    remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    remove.addEventListener("click", () => removeRecord(kind, record));
    media.appendChild(remove);

    const body = document.createElement("div");
    body.className = "merchant-asset-card-body";
    const fileMeta = document.createElement("div");
    fileMeta.className = "merchant-asset-file-meta";
    const name = document.createElement("strong");
    name.textContent = record.file.name;
    name.title = record.file.name;
    const size = document.createElement("small");
    size.textContent = humanBytes(record.file.size);
    fileMeta.append(name, size);
    body.appendChild(fileMeta);

    if (kind === "storefront") {
      body.appendChild(field(t("caption"), record.caption, 240, value => { record.caption = value; }).label);
    } else {
      const productName = field(t("productName"), record.productName, 120, value => { record.productName = value; }, true);
      const price = field(t("priceLabel"), record.priceLabel, 80, value => { record.priceLabel = value; }, true);
      const description = field(t("description"), record.description, 500, value => { record.description = value; });
      body.append(productName.label, price.label, description.label);
    }
    card.append(media, body);
    return card;
  }

  function renderGroup(kind) {
    const target = form?.querySelector(`[data-merchant-asset-preview="${kind}"]`);
    const count = form?.querySelector(`[data-merchant-asset-count="${kind}"]`);
    if (!target) return;
    target.textContent = "";
    if (count) count.textContent = `${records[kind].length}/${config.limits[kind]}`;
    if (!records[kind].length) {
      const empty = document.createElement("p");
      empty.className = "merchant-asset-empty";
      empty.textContent = t(kind === "storefront" ? "emptyStorefront" : "emptyProduct");
      target.appendChild(empty);
      return;
    }
    records[kind].forEach((record, index) => target.appendChild(renderCard(kind, record, index)));
  }

  async function apiJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.json ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      },
      body: options.json ? JSON.stringify(options.json) : options.body
    });
    const text = await response.text();
    let payload = {};
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = {}; }
    if (!response.ok) {
      const error = new Error(payload.message || `HTTP ${response.status}`);
      error.code = payload.error || "HTTP_ERROR";
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function ensureDraft() {
    if (draft?.applicationId && draft?.applicationToken) return draft;
    const result = await apiJson(config.api.draft, { method: "POST", json: {} });
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.applicationId) || typeof result.applicationToken !== "string" || result.applicationToken.length < 32) {
      throw Object.assign(new Error("Draft response mismatch"), { code: "DRAFT_RESPONSE_MISMATCH" });
    }
    draft = result;
    return draft;
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image decode failed"));
      };
      image.src = url;
    });
  }

  async function optimizeImage(file) {
    let source;
    try {
      source = typeof createImageBitmap === "function" ? await createImageBitmap(file) : await loadImage(file);
      const width = Number(source.width || source.naturalWidth);
      const height = Number(source.height || source.naturalHeight);
      if (!width || !height) throw new Error("Image dimensions unavailable");
      const scale = Math.min(1, config.maxDimension / Math.max(width, height));
      const outputWidth = Math.max(1, Math.round(width * scale));
      const outputHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d", { alpha: true });
      context.drawImage(source, 0, 0, outputWidth, outputHeight);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.84));
      source.close?.();
      if (!blob || blob.size > config.maxUploadedBytes) {
        if (file.size <= config.maxUploadedBytes) return { file, width, height };
        throw new Error("Optimized image exceeds upload limit");
      }
      const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "merchant-image";
      return {
        file: new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: file.lastModified }),
        width: outputWidth,
        height: outputHeight
      };
    } catch (error) {
      source?.close?.();
      if (file.size <= config.maxUploadedBytes) return { file, width: 0, height: 0 };
      throw error;
    }
  }

  async function uploadRecord(kind, record) {
    if (record.uploadedAsset) return record.uploadedAsset;
    const optimized = await optimizeImage(record.file);
    const payload = new FormData();
    payload.set("applicationId", draft.applicationId);
    payload.set("assetId", record.id);
    payload.set("kind", kind);
    payload.set("caption", kind === "storefront" ? record.caption : record.productName);
    payload.set("width", String(optimized.width || 0));
    payload.set("height", String(optimized.height || 0));
    payload.set("file", optimized.file);
    const result = await apiJson(config.api.upload, {
      method: "POST",
      headers: { "X-Application-Token": draft.applicationToken },
      body: payload
    });
    if (result.asset?.id !== record.id || result.asset?.kind !== kind) {
      throw Object.assign(new Error("Upload response mismatch"), { code: "UPLOAD_RESPONSE_MISMATCH" });
    }
    record.uploadedAsset = result.asset;
    return result.asset;
  }

  function validateProductMetadata() {
    for (const record of records.product) {
      if (!record.productName.trim() || !record.priceLabel.trim()) {
        status(t("metadataRequired"), "error");
        const card = form.querySelector(`[data-asset-id="${record.id}"]`);
        card?.querySelector("input:invalid")?.focus();
        return false;
      }
    }
    return true;
  }

  async function verifyServerConfig() {
    const result = await apiJson(config.api.config);
    if (
      result.applicationSchema !== config.applicationSchema ||
      result.catalogSchema !== config.catalogSchema ||
      Number(result.maxUploadedBytes) !== config.maxUploadedBytes ||
      Number(result.assetLimits?.storefront) !== config.limits.storefront ||
      Number(result.assetLimits?.product) !== config.limits.product
    ) throw Object.assign(new Error("Merchant asset configuration mismatch"), { code: "ASSET_CONFIG_MISMATCH" });
  }

  async function prepareSubmission(targetForm) {
    if (targetForm !== form) throw new Error("Merchant asset form is not active");
    if (!validateProductMetadata()) throw Object.assign(new Error(t("metadataRequired")), { code: "PRODUCT_METADATA_REQUIRED" });
    try {
      await verifyServerConfig();
      await ensureDraft();
      const queue = [
        ...records.storefront.map(record => ({ kind: "storefront", record })),
        ...records.product.map(record => ({ kind: "product", record }))
      ];
      for (let index = 0; index < queue.length; index += 1) {
        status(t("uploading").replace("{current}", String(index + 1)).replace("{total}", String(queue.length)), "info");
        await uploadRecord(queue[index].kind, queue[index].record);
      }
      if (queue.length) status(t("uploadComplete"), "success");
      return {
        applicationId: draft.applicationId,
        applicationToken: draft.applicationToken,
        assetIds: queue.map(item => item.record.id),
        storefrontAssetIds: records.storefront.map(record => record.id),
        productAssetIds: records.product.map(record => record.id),
        products: records.product.map((record, index) => ({
          id: record.id,
          assetId: record.id,
          sortOrder: index,
          name: record.productName.trim(),
          priceLabel: record.priceLabel.trim(),
          description: record.description.trim()
        }))
      };
    } catch (error) {
      console.warn("Merchant asset preparation failed:", error?.code || error?.message || error);
      status(error?.code === "ASSET_CONFIG_MISMATCH" ? t("serverMismatch") : error?.code === "PRODUCT_METADATA_REQUIRED" ? t("metadataRequired") : t("uploadFailed"), "error");
      throw error;
    }
  }

  function reset() {
    for (const kind of Object.keys(records)) {
      records[kind].forEach(record => URL.revokeObjectURL(record.objectUrl));
      records[kind] = [];
      renderGroup(kind);
    }
    draft = null;
    status("", "");
  }

  function bindUploader(kind) {
    const input = form.querySelector(`[data-merchant-file-input="${kind}"]`);
    const drop = form.querySelector(`[data-merchant-upload-drop="${kind}"]`);
    if (!input || !drop) return;
    input.addEventListener("change", () => {
      addFiles(kind, input.files || []);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach(type => drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.add("is-dragging");
    }));
    ["dragleave", "drop"].forEach(type => drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.remove("is-dragging");
    }));
    drop.addEventListener("drop", event => addFiles(kind, event.dataTransfer?.files || []));
  }

  function enhance(options = {}) {
    const nextForm = options.form;
    if (!nextForm || nextForm.dataset.assetUploaderEnhanced === "true") return;
    form = nextForm;
    lang = options.lang === "en" ? "en" : "zh";
    records.storefront = [];
    records.product = [];
    draft = null;
    form.dataset.assetUploaderEnhanced = "true";
    bindUploader("storefront");
    bindUploader("product");
    renderGroup("storefront");
    renderGroup("product");
  }

  window.TURING_MERCHANT_ASSETS = Object.freeze({ enhance, prepareSubmission, reset });
})();
