import { getWallets } from "@wallet-standard/app";
import {
  StandardConnect,
  StandardDisconnect,
  StandardEvents
} from "@wallet-standard/features";
import { SOLANA_MAINNET_CHAIN } from "@solana/wallet-standard-chains";
import {
  SolanaSignAndSendTransaction,
  SolanaSignMessage,
  SolanaSignTransaction
} from "@solana/wallet-standard-features";
import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

const registry = getWallets();
const listeners = new Set();

const hasTransactionFeature = wallet => Boolean(
  wallet?.features?.[SolanaSignAndSendTransaction] || wallet?.features?.[SolanaSignTransaction]
);

const supportsSolana = wallet => {
  if (!wallet?.features?.[StandardConnect] || !wallet?.features?.[SolanaSignMessage] || !hasTransactionFeature(wallet)) return false;
  const chains = Array.isArray(wallet.chains) ? wallet.chains : [];
  return !chains.length || chains.includes(SOLANA_MAINNET_CHAIN);
};

const iconValue = icon => typeof icon === "string" && (icon.startsWith("data:") || icon.startsWith("https://")) ? icon : "";

function describeWallet(wallet) {
  return {
    id: `standard:${String(wallet.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: wallet.name,
    icon: iconValue(wallet.icon),
    wallet,
    standard: true
  };
}

function list() {
  return registry.get().filter(supportsSolana).map(describeWallet);
}

function selectAccount(wallet, accounts = wallet.accounts) {
  const candidates = Array.from(accounts || []);
  const account = candidates.find(item => !item.chains?.length || item.chains.includes(SOLANA_MAINNET_CHAIN)) || candidates[0];
  if (!account?.address) throw new Error("钱包没有返回可用的 Solana 主网账户");
  return account;
}

class WalletStandardProvider {
  constructor(wallet, account) {
    this.wallet = wallet;
    this.account = account;
    this.publicKey = new PublicKey(account.address);
    this.isConnected = true;
    this.eventHandlers = new Map();
    const eventFeature = wallet.features?.[StandardEvents];
    this.unregister = eventFeature?.on?.("change", ({ accounts }) => {
      if (accounts) {
        try {
          this.account = selectAccount(wallet, accounts);
          this.publicKey = new PublicKey(this.account.address);
          this.emit("accountChanged", this.publicKey);
          this.emit("accountsChanged", [this.publicKey.toBase58()]);
        } catch {
          this.isConnected = false;
          this.emit("disconnect");
        }
      }
    });
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set());
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  emit(event, value) {
    this.eventHandlers.get(event)?.forEach(handler => handler(value));
  }

  async connect() {
    return { publicKey: this.publicKey };
  }

  async disconnect() {
    await this.wallet.features?.[StandardDisconnect]?.disconnect?.();
    this.unregister?.();
    this.isConnected = false;
    this.emit("disconnect");
  }

  async signMessage(message) {
    const feature = this.wallet.features?.[SolanaSignMessage];
    if (!feature?.signMessage) throw new Error("当前钱包不支持 Solana 消息签名");
    const [result] = await feature.signMessage({ account: this.account, message: new Uint8Array(message) });
    if (!result?.signature) throw new Error("钱包没有返回消息签名");
    return {
      signature: new Uint8Array(result.signature),
      signedMessage: result.signedMessage ? new Uint8Array(result.signedMessage) : new Uint8Array(message)
    };
  }

  serializeTransaction(transaction) {
    if (typeof transaction?.serialize !== "function") throw new Error("无法序列化付款交易");

    // The payment adapter and this bridge are separate browser bundles, so
    // each owns a different @solana/web3.js Transaction constructor. Never
    // use instanceof here: an unsigned legacy transaction from the payment
    // bundle would fail that check and serialize() would then demand an
    // already-present signature before the wallet can even open.
    return new Uint8Array(transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }));
  }

  async signTransaction(transaction) {
    const feature = this.wallet.features?.[SolanaSignTransaction];
    if (!feature?.signTransaction) throw new Error("当前钱包不支持仅签署 Solana 交易");
    const [result] = await feature.signTransaction({
      account: this.account,
      chain: SOLANA_MAINNET_CHAIN,
      transaction: this.serializeTransaction(transaction),
      options: { preflightCommitment: "confirmed" }
    });
    if (!result?.signedTransaction) throw new Error("钱包没有返回已签名交易");
    return Transaction.from(new Uint8Array(result.signedTransaction));
  }

  async signAndSendTransaction(transaction) {
    const feature = this.wallet.features?.[SolanaSignAndSendTransaction];
    if (!feature?.signAndSendTransaction) {
      const signedTransaction = await this.signTransaction(transaction);
      return { signedTransaction };
    }
    const [result] = await feature.signAndSendTransaction({
      account: this.account,
      chain: SOLANA_MAINNET_CHAIN,
      transaction: this.serializeTransaction(transaction),
      options: { commitment: "confirmed", preflightCommitment: "confirmed" }
    });
    if (!result?.signature) throw new Error("钱包没有返回交易签名");
    return { signature: bs58.encode(new Uint8Array(result.signature)) };
  }
}

async function connectWallet(wallet) {
  if (!supportsSolana(wallet)) throw new Error("该钱包暂不支持本次 Solana USDT 购买所需的签名能力");
  const output = await wallet.features[StandardConnect].connect();
  return new WalletStandardProvider(wallet, selectAccount(wallet, output?.accounts));
}

function subscribe(callback) {
  const offRegister = registry.on("register", () => {
    const wallets = list();
    listeners.forEach(listener => listener(wallets));
  });
  const offUnregister = registry.on("unregister", () => {
    const wallets = list();
    listeners.forEach(listener => listener(wallets));
  });
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
    offRegister();
    offUnregister();
  };
}

window.TURING_WALLET_STANDARD = Object.freeze({ list, connectWallet, subscribe });
