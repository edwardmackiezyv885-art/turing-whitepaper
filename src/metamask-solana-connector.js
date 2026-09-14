import { createSolanaClient } from "@metamask/connect-solana";

let clientPromise;

function getClient() {
  if (!clientPromise) {
    const origin = window.location.origin === "null" ? "https://meta9898.shop" : window.location.origin;
    clientPromise = createSolanaClient({
      dapp: {
        name: "Turing Official Whitepaper",
        url: origin,
        iconUrl: `${origin}/assets/nodes/tnode-l3-cocreator.png`
      },
      api: {
        supportedNetworks: {
          mainnet: "https://api.mainnet-beta.solana.com"
        }
      },
      analytics: { enabled: false }
    });
  }
  return clientPromise;
}

async function connect() {
  const bridge = window.TURING_WALLET_STANDARD;
  if (!bridge?.connectWallet) throw new Error("钱包连接组件尚未加载，请刷新页面后重试");
  const client = await getClient();
  return bridge.connectWallet(client.getWallet());
}

async function disconnect() {
  const client = await getClient();
  await client.disconnect();
}

const ready = getClient();
ready.catch(() => {});
window.TURING_METAMASK_SOLANA = Object.freeze({ connect, disconnect, ready });
