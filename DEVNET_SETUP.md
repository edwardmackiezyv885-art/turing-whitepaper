# 图灵节点 Devnet 部署钱包创建指南

本文件只用于 **Solana Devnet 测试网**。不要把 Devnet 部署钱包用于 Mainnet，也不要向任何人发送私钥、助记词、BIP39 密码或 `*.json` 密钥文件。

## 0. 先重启 Windows

本机已经启用了 `VirtualMachinePlatform` 和 `Microsoft-Windows-Subsystem-Linux`，Windows 返回 `3010`，表示必须重启后才能完成安装。

## 1. 首次打开 Ubuntu

重启后，从开始菜单打开 **Ubuntu**。首次启动会要求创建一个 Linux 用户名和密码；这个密码只是本机 Ubuntu 的管理密码，不是钱包密码。

如果开始菜单没有 Ubuntu，以管理员身份打开 PowerShell，运行：

```powershell
wsl --install --distribution Ubuntu
```

完成后再打开 Ubuntu。

## 2. 安装 Solana 开发工具

在 Ubuntu 终端中运行 Solana 官方快速安装命令：

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

安装完成后关闭并重新打开 Ubuntu，然后检查：

```bash
rustc --version
solana --version
anchor --version
node --version
```

## 3. 创建专用 Devnet 部署钱包

以下命令必须由项目负责人亲自在 Ubuntu 终端运行。创建过程会显示助记词，**不要截图，不要复制到聊天窗口**。

```bash
mkdir -p ~/.config/solana
solana-keygen new --outfile ~/.config/solana/turing-devnet-authority.json
```

创建时：

1. 按提示设置或跳过 BIP39 附加密码。
2. 把助记词手写到纸上，离线保存。
3. 不要上传 `turing-devnet-authority.json`，不要放入网站或 Git 仓库。
4. 这个 JSON 密钥文件本身不是加密保险箱，应只保存在受控电脑中。

配置 Devnet 和默认签名钱包：

```bash
solana config set --url devnet
solana config set --keypair ~/.config/solana/turing-devnet-authority.json
solana address
```

`solana address` 输出的是可以公开的 **公钥**。只把这一串公钥发给 Codex，不要发送前一步出现的助记词。

## 4. 领取测试 SOL

```bash
solana airdrop 2
solana balance
```

如果命令行空投触发限流，可使用 Solana 官方 Devnet Faucet。测试 SOL 没有现金价值。

## 5. 接下来的部署顺序

拿到部署钱包公钥后：

1. 编译并运行节点购买程序的本地测试。
2. 把程序部署到 Devnet，并把升级权限设置为上述公钥。
3. 初始化四档库存 `350 / 40 / 20 / 5`、官方收款地址和暂停状态。
4. 测试实时 SOL 报价、最大支付滑点、邀请归属和 Token-2022 不可转让 TNODE 证书。
5. 将 Devnet Program ID 写入网站，在明显的“测试网”标识下开放测试购买。

Mainnet 上线前必须重新创建生产权限体系，使用多签、独立审计和生产 RPC；不得直接复用这个 Devnet 钱包或测试配置。
