import { Connection, PublicKey } from "@solana/web3.js";
import { envFlag } from "./_shared/config.mjs";
import {
  MERCHANT_SERVICE_FEE,
  TOKEN_PROGRAM_ID,
  TREASURY_USDT_ATA,
  USDT_DECIMALS,
  USDT_MINT,
  requireMerchantPublicKey
} from "./_shared/merchant-config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const TOKEN_ACCOUNT_SIZE = 165;
const BASE_FEE_BUFFER_LAMPORTS = 10_000;

function associatedTokenAddress(mint, owner) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), new PublicKey(TOKEN_PROGRAM_ID).toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    assertSameOrigin(request);
    if (!envFlag("MERCHANT_FEE_ENABLED")) {
      throw Object.assign(new Error("Merchant service-fee checkout is not open"), { status: 403, code: "MERCHANT_FEE_CLOSED" });
    }
    const body = await readJson(request);
    const buyer = requireMerchantPublicKey(body.buyer, "buyer wallet");
    const buyerKey = new PublicKey(buyer);
    const buyerAta = associatedTokenAddress(new PublicKey(USDT_MINT), buyerKey);
    const treasuryAta = new PublicKey(TREASURY_USDT_ATA);
    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
    const [buyerAtaInfo, treasuryAtaInfo, solLamports, tokenRentLamports] = await Promise.all([
      connection.getAccountInfo(buyerAta, "confirmed"),
      connection.getAccountInfo(treasuryAta, "confirmed"),
      connection.getBalance(buyerKey, "confirmed"),
      connection.getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_SIZE, "confirmed")
    ]);

    let usdtBaseUnits = "0";
    if (buyerAtaInfo) {
      const tokenBalance = await connection.getTokenAccountBalance(buyerAta, "confirmed");
      usdtBaseUnits = tokenBalance.value.amount;
    }
    const requiredSolLamports = BASE_FEE_BUFFER_LAMPORTS + (treasuryAtaInfo ? 0 : tokenRentLamports);
    const enoughUsdt = BigInt(usdtBaseUnits) >= BigInt(MERCHANT_SERVICE_FEE.amount);
    const enoughSol = solLamports >= requiredSolLamports;

    return json(200, {
      buyer,
      buyerAta: buyerAta.toBase58(),
      serviceId: MERCHANT_SERVICE_FEE.id,
      requiredUsdtBaseUnits: MERCHANT_SERVICE_FEE.amount,
      usdtBaseUnits,
      decimals: USDT_DECIMALS,
      solLamports: String(solLamports),
      requiredSolLamports: String(requiredSolLamports),
      treasuryAtaExists: Boolean(treasuryAtaInfo),
      enoughUsdt,
      enoughSol,
      enough: enoughUsdt && enoughSol
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-orders/balance",
  rateLimit: { windowLimit: 20, windowSize: 180, aggregateBy: ["ip", "domain"] }
};

