window.TURING_MERCHANT_APPLICATION_CONFIG = Object.freeze({
  version: "1.0.0-catalog-reservation",
  applicationSchema: "turing.merchant-application.v1",
  catalogSchema: "turing.chain-catalog.v1",
  api: Object.freeze({
    config: "/api/merchant-applications/config",
    draft: "/api/merchant-applications/draft",
    upload: "/api/merchant-assets/upload",
    submit: "/api/merchant-applications/submit",
    admin: "/api/merchant-applications/admin",
    asset: "/api/merchant-assets/file",
    catalogExport: "/api/merchant-catalog/export",
    catalogSync: "/api/merchant-catalog/sync"
  }),
  acceptedTypes: Object.freeze(["image/jpeg", "image/png", "image/webp"]),
  maxInputBytes: 12 * 1024 * 1024,
  maxUploadedBytes: 4 * 1024 * 1024,
  maxDimension: 1600,
  limits: Object.freeze({ storefront: 6, product: 12 })
});

