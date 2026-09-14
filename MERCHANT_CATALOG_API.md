# 商家资料与链上商城预留 API

当前版本负责收集、存储和审核商家店面图片、商品图片与结构化商品资料。链上商城同步端点已经预留，但默认关闭，不会签名、广播交易或写入任何合约。

## 数据版本

- 商家申请：`turing.merchant-application.v1`
- 商城目录：`turing.chain-catalog.v1`
- 图片格式：JPEG、PNG、WebP
- 浏览器原图上限：12 MB；上传前压缩为最长边不超过 1600 px、单张不超过 4 MB
- 店面图片：最多 6 张，第一张作为默认封面
- 商品图片：最多 12 张，每张绑定商品名称、价格展示文本和可选介绍

版本字段必须作为兼容边界处理。后续增加字段时保留 `v1` 读取能力；破坏性变更使用新的 schema 名称。

## 商家端流程

### 1. 创建草稿

`POST /api/merchant-applications/draft`

返回：

```json
{
  "applicationId": "uuid",
  "applicationToken": "一次性申请令牌",
  "status": "draft",
  "expiresAt": "ISO-8601"
}
```

草稿有效期为 48 小时。`applicationToken` 仅返回一次，浏览器在随后上传、提交和创建服务费订单时通过请求头或请求体携带；服务端只保存令牌哈希。

### 2. 上传图片

`POST /api/merchant-assets/upload`

请求为 `multipart/form-data`，请求头带 `X-Application-Token`。字段：

- `applicationId`
- `assetId`：客户端生成 UUID，用于重试幂等
- `kind`：`storefront` 或 `product`
- `file`
- `width`、`height`
- `caption`

服务端检查文件大小、MIME、真实文件签名、图片归属和数量上限。二进制文件与申请记录分别写入强一致存储。

### 3. 提交申请

`POST /api/merchant-applications/submit`

请求头带 `X-Application-Token`，JSON 中包含表单字段、`assetIds` 与结构化 `products`。商品示例：

```json
{
  "id": "uuid",
  "assetId": "uuid",
  "name": "招牌商品",
  "priceLabel": "68 CNY / 9.5 USDT",
  "description": "可选商品介绍"
}
```

服务端以草稿中的资产清单为准，拒绝引用其他申请的图片。成功后申请进入 `submitted`，并生成商城目录准备状态。

## 管理后台

页面：`/admin-merchant-applications.html`

所有管理接口都要求：

```text
Authorization: Bearer <ADMIN_TOKEN>
```

- `GET /api/merchant-applications/admin?status=submitted`：读取申请
- `POST /api/merchant-applications/admin`：更新 `under_review`、`changes_requested`、`approved`、`catalog_ready`、`rejected`
- `GET /api/merchant-assets/file?applicationId=...&assetId=...`：读取私有图片
- `GET /api/merchant-catalog/export?applicationId=...`：导出商城目录 JSON

后台返回值不会包含申请令牌哈希。联系人、联系方式和门店地址不会进入公开商城目录。

## 链上商城预留接口

`POST /api/merchant-catalog/sync`

请求：

```json
{
  "applicationId": "uuid"
}
```

当前规则：

1. 仅管理员可调用。
2. 申请必须经审核进入 `catalog_ready`。
3. `CHAIN_MALL_SYNC_ENABLED=false` 时返回 `503 CHAIN_MALL_SYNC_DISABLED`。
4. 即使临时打开开关，在签名器、内容存储和已审计合约适配器接入前仍返回 `501 CHAIN_MALL_ADAPTER_NOT_CONFIGURED`。

未来适配器应完成以下步骤后才允许写链：

1. 将审核后的图片上传到不可变内容存储，回填每个资产的 `contentUri`。
2. 固化目录 JSON，计算内容哈希并生成目录 `contentUri`。
3. 校验商家 ID、目标网络、合约地址、幂等键和当前目录版本。
4. 由独立签名服务提交交易，网站与 Netlify Functions 不保存收款钱包私钥。
5. 等待最终确认，保存交易签名、区块高度、内容 URI、重试记录和审计日志。

商城目录不会包含联系方式等非展示信息，基础结构如下：

```json
{
  "schema": "turing.chain-catalog.v1",
  "applicationId": "uuid",
  "merchantId": null,
  "storefront": {
    "name": "商家名称",
    "category": "行业",
    "introduction": "店面介绍",
    "launchRegion": "turing-metaverse-city",
    "cover": { "assetId": "uuid", "sha256": "hex", "contentUri": null },
    "gallery": []
  },
  "products": [
    {
      "id": "uuid",
      "name": "商品名称",
      "priceLabel": "展示价格",
      "description": "商品介绍",
      "image": { "assetId": "uuid", "sha256": "hex", "contentUri": null }
    }
  ],
  "chain": {
    "target": "turing-chain-marketplace",
    "contentUri": null,
    "transactionSignature": null,
    "syncStatus": "not_configured"
  }
}
```

