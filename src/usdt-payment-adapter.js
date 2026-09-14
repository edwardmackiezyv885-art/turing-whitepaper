import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

const PROGRAMS = Object.freeze({
  token: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  associated: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  memo: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
});
const MAINNET_USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const TURING_TREASURY_OWNER = "FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8";
const TURING_TREASURY_USDT_ATA = "DDeDE8pBjqDwQazgCwPMNuJGePjckgcWTn6wMtmcLXNg";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";

const key = value => new PublicKey(value).toBase58();
const bytesFromBase64 = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
const base64FromBytes = bytes => {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
};
const unwrapWalletResult = value => Array.isArray(value) && value.length === 1 ? value[0] : value;
const signatureString = value => {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return bs58.encode(value);
  if (ArrayBuffer.isView(value)) return bs58.encode(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  return "";
};
const signedBytes = value => {
  const result = unwrapWalletResult(value);
  const signed = result?.signedTransaction || result;
  if (signed instanceof Uint8Array) return signed;
  if (ArrayBuffer.isView(signed)) return new Uint8Array(signed.buffer, signed.byteOffset, signed.byteLength);
  if (typeof signed?.serialize === "function") return new Uint8Array(signed.serialize());
  return null;
};
const paymentError = (value, paymentMayHaveBeenSubmitted) => {
  const error = value instanceof Error ? value : new Error(String(value || "钱包请求失败"));
  error.paymentMayHaveBeenSubmitted = paymentMayHaveBeenSubmitted;
  return error;
};

async function rpcRequest(rpcUrl, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error(payload.error?.message || "Solana RPC 请求失败");
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Solana RPC 响应超时");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function broadcastSignedTransaction(bytes, rpcUrl, relay) {
  if (!bytes?.length) throw new Error("钱包未返回已签名交易");
  let payload;
  try {
    if (relay?.url && relay?.orderId && relay?.customerToken) {
      const response = await fetch(relay.url, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          orderId: relay.orderId,
          customerToken: relay.customerToken,
          signedTransactionBase64: base64FromBytes(bytes)
        })
      });
      payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.signature) {
        const error = new Error(payload.message || "交易广播失败");
        if (payload.error === "TRANSACTION_REJECTED" || payload.error === "ORDER_EXPIRED") error.paymentMayHaveBeenSubmitted = false;
        throw error;
      }
      return { signature: payload.signature };
    }
    payload = await rpcRequest(rpcUrl, {
        jsonrpc: "2.0",
        id: 1,
        method: "sendTransaction",
        params: [base64FromBytes(bytes), { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" }]
      });
  } catch (error) {
    if (typeof error?.paymentMayHaveBeenSubmitted === "boolean") throw error;
    throw paymentError(error, true);
  }
  if (!payload.result) {
    const error = new Error("交易广播失败");
    error.paymentMayHaveBeenSubmitted = true;
    throw error;
  }
  return { signature: payload.result };
}

async function refreshBlockhash({ transactionBase64, expected, refresh, rpcUrl = "https://api.mainnet-beta.solana.com" }) {
  const transaction = Transaction.from(bytesFromBase64(transactionBase64));
  assertServerTransaction(transaction, expected);
  let value;
  if (refresh?.url && refresh?.orderId && refresh?.customerToken) {
    const response = await fetch(refresh.url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ orderId: refresh.orderId, customerToken: refresh.customerToken })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "无法更新付款交易，请稍后重试");
    value = payload;
  } else {
    const payload = await rpcRequest(rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "getLatestBlockhash",
      params: [{ commitment: "confirmed" }]
    }, 10000);
    value = payload?.result?.value;
  }
  if (typeof value?.blockhash !== "string") throw new Error("无法更新付款交易，请稍后重试");
  transaction.recentBlockhash = value.blockhash;
  const bytes = new Uint8Array(transaction.serialize({ requireAllSignatures: false, verifySignatures: false }));
  return {
    transactionBase64: base64FromBytes(bytes),
    blockhash: value.blockhash,
    lastValidBlockHeight: Number(value.lastValidBlockHeight || 0),
    refreshedAt: Date.now()
  };
}

function assertServerTransaction(transaction, expected) {
  const buyer = key(expected.buyer);
  if (key(expected.mint) !== MAINNET_USDT_MINT || key(expected.treasuryOwner) !== TURING_TREASURY_OWNER || key(expected.treasuryAta) !== TURING_TREASURY_USDT_ATA) {
    throw new Error("订单不是图灵官方 Solana USDT 收款配置");
  }
  if (key(transaction.feePayer) !== buyer) throw new Error("付款钱包与订单不一致");
  if (transaction.instructions.length !== 3) throw new Error("订单交易包含非预期指令");

  const [ata, memo, transfer] = transaction.instructions;
  if (key(ata.programId) !== PROGRAMS.associated || key(memo.programId) !== PROGRAMS.memo || key(transfer.programId) !== PROGRAMS.token) {
    throw new Error("订单交易程序不在允许列表中");
  }
  const ataKeys = ata.keys.map(item => key(item.pubkey));
  if (ata.data.length !== 1 || ata.data[0] !== 1 || ataKeys.length !== 6 ||
    ataKeys[0] !== buyer || ataKeys[1] !== key(expected.treasuryAta) || ataKeys[2] !== key(expected.treasuryOwner) || ataKeys[3] !== key(expected.mint) ||
    ataKeys[4] !== SYSTEM_PROGRAM || ataKeys[5] !== PROGRAMS.token || !ata.keys[0].isSigner || !ata.keys[0].isWritable || !ata.keys[1].isWritable) {
    throw new Error("USDT 收款账户验证失败");
  }
  if (memo.keys.length !== 0 || new TextDecoder().decode(memo.data) !== expected.memo) throw new Error("订单编号验证失败");

  const transferKeys = transfer.keys.map(item => key(item.pubkey));
  if (transfer.data.length !== 10 || transfer.data[0] !== 12 || transferKeys.length !== 5 ||
    transferKeys[0] !== key(expected.buyerAta) || transferKeys[1] !== MAINNET_USDT_MINT || transferKeys[2] !== TURING_TREASURY_USDT_ATA || transferKeys[3] !== buyer || transferKeys[4] !== key(expected.reference) ||
    !transfer.keys[0].isWritable || !transfer.keys[2].isWritable || !transfer.keys[3].isSigner || transfer.keys[4].isSigner || transfer.keys[4].isWritable) {
    throw new Error("USDT 转账指令验证失败");
  }
  const data = new DataView(transfer.data.buffer, transfer.data.byteOffset, transfer.data.byteLength);
  const amount = data.getBigUint64(1, true).toString();
  if (amount !== String(expected.amountBaseUnits) || transfer.data[9] !== 6) throw new Error("USDT 付款金额验证失败");
}

function validate({ transactionBase64, expected }) {
  const transaction = Transaction.from(bytesFromBase64(transactionBase64));
  assertServerTransaction(transaction, expected);
  return true;
}

async function send({ provider, connectedAddress, transactionBase64, expected, relay, rpcUrl = "https://api.mainnet-beta.solana.com" }) {
  if (!provider) {
    const error = new Error("请先连接 Solana 钱包");
    error.paymentMayHaveBeenSubmitted = false;
    throw error;
  }
  let transaction;
  try {
    transaction = Transaction.from(bytesFromBase64(transactionBase64));
    const connected = key(provider.publicKey || connectedAddress);
    if (connected !== key(expected.buyer)) throw new Error("钱包账户已经切换，请重新创建订单");
    assertServerTransaction(transaction, expected);
  } catch (error) {
    throw paymentError(error, false);
  }

  // Prefer wallet-managed broadcasting. Mobile wallet webviews can sign a
  // transaction successfully while blocking the website's direct public-RPC
  // request, leaving the payment signed but never submitted.
  if (typeof provider.signAndSendTransaction === "function") {
    let result;
    try {
      result = unwrapWalletResult(await provider.signAndSendTransaction(transaction));
    } catch (error) {
      throw paymentError(error, true);
    }
    const signature = signatureString(typeof result === "string" || ArrayBuffer.isView(result) ? result : result?.signature);
    if (signature) return { signature };
    const bytes = signedBytes(result);
    if (bytes) return broadcastSignedTransaction(bytes, rpcUrl, relay);
    throw paymentError("钱包未返回交易签名", true);
  }

  // Sign-only wallets use the authenticated same-origin relay. The relay
  // validates the complete order transaction before server-side broadcasting.
  if (typeof provider.signTransaction === "function") {
    let signed;
    try {
      signed = await provider.signTransaction(transaction);
    } catch (error) {
      throw paymentError(error, false);
    }
    const bytes = signedBytes(signed);
    if (!bytes) {
      const error = new Error("钱包未返回已签名交易");
      error.paymentMayHaveBeenSubmitted = false;
      throw error;
    }
    return broadcastSignedTransaction(bytes, rpcUrl, relay);
  }

  const error = new Error("当前钱包不支持 Solana 交易签名，请改用列表中的兼容钱包");
  error.paymentMayHaveBeenSubmitted = false;
  throw error;
}

window.TURING_USDT_PAYMENT = Object.freeze({ send, refreshBlockhash, validate, programs: PROGRAMS });
