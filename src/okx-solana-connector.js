import { OKXUniversalProvider } from "@okxconnect/universal-provider";
import { OKXSolanaProvider } from "@okxconnect/solana-provider";
import { PublicKey } from "@solana/web3.js";

const CHAIN = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
let universalPromise;

function getUniversal() {
  if (!universalPromise) {
    const origin = window.location.origin === "null" ? "https://meta9898.shop" : window.location.origin;
    universalPromise = OKXUniversalProvider.init({
      dappMetaData: {
        name: "Turing Official Whitepaper",
        icon: `${origin}/assets/nodes/tnode-l3-cocreator.png`
      }
    });
  }
  return universalPromise;
}

class OKXProviderAdapter {
  constructor(universal, provider) {
    this.universal = universal;
    this.provider = provider;
    this.isConnected = true;
    this.handlers = new Map();
    const account = provider.getAccount(CHAIN);
    if (!account?.address) throw new Error("OKX Wallet 没有返回 Solana 主网账户");
    this.publicKey = account.publicKey || new PublicKey(account.address);
    this.handleSessionDelete = () => {
      this.isConnected = false;
      this.emit("disconnect");
    };
    this.handleSessionUpdate = () => {
      const next = provider.getAccount(CHAIN);
      if (!next?.address) {
        this.isConnected = false;
        this.emit("disconnect");
        return;
      }
      const nextPublicKey = next.publicKey || new PublicKey(next.address);
      if (nextPublicKey.toBase58() === this.publicKey.toBase58()) return;
      this.publicKey = nextPublicKey;
      this.emit("accountChanged", this.publicKey);
      this.emit("accountsChanged", [this.publicKey.toBase58()]);
    };
    universal.on("session_delete", this.handleSessionDelete);
    universal.on("session_update", this.handleSessionUpdate);
  }

  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(handler);
  }

  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event, value) {
    this.handlers.get(event)?.forEach(handler => handler(value));
  }

  async connect() {
    return { publicKey: this.publicKey };
  }

  async disconnect() {
    this.universal.removeListener?.("session_delete", this.handleSessionDelete);
    this.universal.removeListener?.("session_update", this.handleSessionUpdate);
    await this.universal.disconnect();
    this.isConnected = false;
    this.emit("disconnect");
  }

  async signMessage(message) {
    const result = await this.provider.signMessage(new TextDecoder().decode(message), CHAIN);
    if (!result?.signature) throw new Error("OKX Wallet 没有返回消息签名");
    return { signature: result.signature, signedMessage: new Uint8Array(message) };
  }

  async signTransaction(transaction) {
    return this.provider.signTransaction(transaction, CHAIN);
  }

  async signAndSendTransaction(transaction) {
    const signature = await this.provider.signAndSendTransaction(transaction, CHAIN);
    return { signature: typeof signature === "string" ? signature : signature?.signature };
  }
}

async function connect() {
  const universal = await getUniversal();
  await universal.connect({
    namespaces: {
      solana: {
        chains: [CHAIN],
        defaultChain: CHAIN,
        rpcMap: { [CHAIN]: "https://api.mainnet-beta.solana.com" }
      }
    }
  });
  return new OKXProviderAdapter(universal, new OKXSolanaProvider(universal));
}

async function disconnect() {
  const universal = await getUniversal();
  await universal.disconnect();
}

const ready = getUniversal();
ready.catch(() => {});
window.TURING_OKX_SOLANA = Object.freeze({ connect, disconnect, ready });
