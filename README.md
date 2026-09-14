# 图灵白皮书官网

中英文链游白皮书与 Solana 主网节点购买站。正式购买仅支持 Solana 链官方 USDT，付款通过标准 SPL Token 交易完成；订单、邀请归属和 NFT 待发放状态由 Netlify Functions 与 Netlify Blobs 管理。

## 正式节点档位

| 档位 | 价格 | 数量 |
|---|---:|---:|
| L1 探索节点 | 1,000 USDT | 350 |
| L2 建设节点 | 5,000 USDT | 40 |
| L3 共创节点 | 10,000 USDT | 20 |
| L4 核心市场代理节点 | 50,000 USDT | 5 |

服务端是价格与库存的唯一可信来源。前端不能修改金额、收款地址或 USDT Mint。

## 技术结构

- 静态官网：`index.html`、`styles.css`、`app.js`、`data.js`
- 购买界面：`node-config.js`、`node-purchase.js`
- 安全交易适配器：`src/usdt-payment-adapter.js`
- 订单接口：`netlify/functions/`
- 节点订单后台：`admin-node-orders.html`
- 商家资料后台：`admin-merchant-applications.html`
- 商家申请与图片接口：`netlify/functions/merchant-applications-*.mjs`、`netlify/functions/merchant-assets-*.mjs`
- 链上商城预留协议：`MERCHANT_CATALOG_API.md`
- 正式构建目录：`netlify-deploy/`

收款配置：

- 网络：Solana Mainnet
- 官方 USDT Mint：`Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
- Treasury Owner：`FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8`
- Treasury USDT ATA：`DDeDE8pBjqDwQazgCwPMNuJGePjckgcWTn6wMtmcLXNg`

## 环境变量

参考 `.env.example`，在 Netlify Production 中配置：

```text
SOLANA_RPC_URL=<可靠的 Solana Mainnet RPC>
ADMIN_TOKEN=<至少 32 随机字节的私密令牌>
ALLOWED_ORIGIN=https://meta9898.shop
SALE_ENABLED=true
MERCHANT_FEE_ENABLED=true
CHAIN_MALL_SYNC_ENABLED=false
```

`ADMIN_TOKEN` 和私有 RPC URL 不得放入前端、源码仓库或公开部署包。

`MERCHANT_FEE_ENABLED` 只控制商家主网服务费订单入口。该入口固定收取 1,400 USDT（Solana Mainnet 官方 USDT），属于商家入驻商业服务费，不提供收益、本金返还、NFT 或 TUR 兑付。

`CHAIN_MALL_SYNC_ENABLED` 必须保持为 `false`，直到不可变图片存储、目录 URI、独立签名器和经过审计的商城合约适配器全部完成。当前系统只保存和审核商家图片、生成版本化商城目录 JSON，不执行链上写入。

## 构建与验证

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
```

部署细节、生产检查和回滚流程见 `DEPLOY.md`。

商家资料、图片、后台审核和商城目录接口可在本地 `netlify dev` 启动后运行：

```powershell
$env:QA_ORIGIN='http://localhost:8891'
$env:ADMIN_TOKEN='<本地管理员测试令牌>'
node scripts/qa-merchant-applications.mjs
```

## 付款与发放流程

1. 用户连接自托管 Solana 钱包。
2. 钱包先签署不扣款的归属证明。
3. 服务端生成金额、Mint、收款 ATA、Reference 和 Memo 均锁定的交易。
4. 钱包确认并广播 USDT 付款。
5. 服务端核验最终确认、签名人、金额、余额变化和唯一交易签名。
6. 已核验订单进入“已付款 · NFT 待发放”队列。
7. 管理员发放 NFT 后登记 Mint 与发放交易签名。

不要手工向收款地址转账；没有订单 Reference 的付款无法自动绑定节点与邀请归属。
