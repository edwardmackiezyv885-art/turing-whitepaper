# 图灵白皮书正式部署

目标站点：`https://meta9898.shop`

## 1. 上线前检查

确认以下内容：

- Node.js 与 Netlify CLI 可用。
- 本地目录已链接到正确的 Netlify Project。
- Solana Mainnet RPC 稳定并支持 `getLatestBlockhash`、`getTransaction`、`getSignatureStatuses`。
- Treasury Owner、官方 USDT Mint 与 Treasury ATA 已由第二人复核。
- 管理员令牌至少包含 32 个随机字节，且只保存在 Netlify Secret 中。

## 2. 配置 Production 环境变量

```powershell
netlify.cmd env:set ALLOWED_ORIGIN https://meta9898.shop --context production
netlify.cmd env:set SALE_ENABLED true --context production
netlify.cmd env:set MERCHANT_FEE_ENABLED true --context production
netlify.cmd env:set CHAIN_MALL_SYNC_ENABLED false --context production
netlify.cmd env:set SOLANA_RPC_URL '<Solana Mainnet RPC>' --context production --secret
netlify.cmd env:set ADMIN_TOKEN '<高强度随机令牌>' --context production --secret
```

不要把私有 RPC URL、管理员令牌、助记词或私钥写入任何前端文件。部署和 NFT 发放均不需要收款钱包私钥进入网站服务器。

## 3. 构建和自动化校验

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
```

构建结果位于 `netlify-deploy/`。不要直接修改该目录；应修改根目录源码后重新构建。

## 4. Draft 检查

```powershell
netlify.cmd deploy --context production --message 'Turing production review'
```

Draft URL 与正式域名不同，因此创建订单会被 `ALLOWED_ORIGIN` 拒绝。Draft 只用于检查页面、图片、语言切换、响应式布局和 Functions 是否随部署上传。

## 5. 正式发布

```powershell
netlify.cmd deploy --context production --prod --message 'Turing production release'
```

正式发布后检查：

1. `https://meta9898.shop/api/node-orders/config` 返回 Mainnet、USDT、Treasury 与 `saleEnabled: true`。
2. 购买弹窗只显示 L1–L4。
3. 中英文切换、深色模式、移动端弹窗和邀请链接正常。
4. 无管理员令牌访问后台接口返回 `401`。
5. 使用不存在的档位创建订单返回 `400 INVALID_TIER`。
6. 不进行手工转账，也不要用生产高额档位做探活付款。
7. `https://meta9898.shop/api/merchant-orders/config` 返回 `enabled: true`、`mainnet-beta`、`1,400 USDT`、官方 USDT Mint 与 Treasury。
8. 商家页明确显示服务费不产生收益、本金返还、NFT 或 TUR 兑付，资料未提交或钱包未连接时不能创建订单。
9. 使用错误来源访问商家订单接口返回 `403 ORIGIN_NOT_ALLOWED`；不要使用真实 1,400 USDT 做探活付款。
10. 提交一条不含敏感证件的测试商家资料，确认店面图片、商品图片和商品信息在 `/admin-merchant-applications.html` 可见。
11. 管理后台可导出 `turing.chain-catalog.v1` JSON；调用 `/api/merchant-catalog/sync` 返回 `503 CHAIN_MALL_SYNC_DISABLED`，确认当前不会写链。

商家主网订单是一次性商业服务费订单，仅用于资料审核、数字店面方案、CBD 上线准备和基础运营接入。链上核验成功后，交易签名会写入 `merchant-payment-receipt` Netlify Form，并保存在独立的 `turing-merchant-fee-orders` 强一致订单存储中。

商家申请、图片和结构化商品资料保存在独立的强一致存储中。后台入口为 `https://meta9898.shop/admin-merchant-applications.html`，接口与未来链上商城字段见 `MERCHANT_CATALOG_API.md`。

## 6. 管理待发放订单

打开：

`https://meta9898.shop/admin-node-orders.html`

输入 Production `ADMIN_TOKEN` 后可查看：

- NFT 待发放订单；
- 需要人工复核的已付款订单；
- 付款交易、购买钱包与邀请归属；
- NFT Mint 与发放交易登记。

只有链上付款已核验的正式订单才能登记 NFT 发放。历史非正式订单会被服务端拒绝发放正式权益。

## 7. 紧急关闭与回滚

发现 RPC、订单、库存或收款异常时：

```powershell
netlify.cmd env:set SALE_ENABLED false --context production
netlify.cmd env:set MERCHANT_FEE_ENABLED false --context production
netlify.cmd env:set CHAIN_MALL_SYNC_ENABLED false --context production
netlify.cmd deploy --context production --prod --message 'Temporarily close node sale'
```

关闭后新订单会返回 `SALE_CLOSED`，已有链上交易和订单记录仍保留供核验。不要删除 Netlify Blobs 中的订单、Reservation 或交易签名记录。

商家服务费开关关闭后，新商家订单返回 `MERCHANT_FEE_CLOSED`；已有订单、付款签名和表单回执继续保留，不能删除或改写。
