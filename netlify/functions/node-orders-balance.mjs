import { Connection, PublicKey } from "@solana/web3.js";
import {
  TIERS, TOKEN_PROGRAM_ID, TREASURY_USDT_ATA, USDT_DECIMALS, USDT_MINT,
  envFlag, requirePublicKey
} from "./_shared/config.mjs";
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
    const body = await readJson(request);
    const tier = TIERS[body.tierId];
    if (!tier) throw Object.assign(new Error("Unknown node tier"), { status: 400, code: "INVALID_TIER" });
    if (!envFlag("SALE_ENABLED")) throw Object.assign(new Error("Formal node sale is not open yet"), { status: 403, code: "SALE_CLOSED" });
    if (tier.isTest && (!envFlag("PAYMENT_TEST_ENABLED") || body.testMode !== true)) {
      throw Object.assign(new Error("Payment test is not available"), { status: 403, code: "PAYMENT_TEST_DISABLED" });
    }

    const buyer = requirePublicKey(body.buyer, "buyer wallet");
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
    const enoughUsdt = BigInt(usdtBaseUnits) >= BigInt(tier.amount);
    const enoughSol = solLamports >= requiredSolLamports;

    return json(200, {
      buyer,
      buyerAta: buyerAta.toBase58(),
      tierId: tier.id,
      requiredUsdtBaseUnits: tier.amount,
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
  path: "/api/node-orders/balance",
  rateLimit: { windowLimit: 20, windowSize: 180, aggregateBy: ["ip", "domain"] }
};
