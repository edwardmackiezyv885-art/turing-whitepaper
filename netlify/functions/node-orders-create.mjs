import { randomUUID } from "node:crypto";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Connection
} from "@solana/web3.js";
import {
  NETWORK, ORDER_TTL_MS, TIERS, TOKEN_PROGRAM_ID, TREASURY_OWNER,
  TREASURY_USDT_ATA, USDT_DECIMALS, USDT_MINT, envFlag,
  buildOrderMemo, randomCustomerToken, requirePublicKey, sha256, verifyWalletProof
} from "./_shared/config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";
import { claimWalletProof, createOrderRecord, reserveTier } from "./_shared/store.mjs";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function associatedTokenAddress(mint, owner) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), new PublicKey(TOKEN_PROGRAM_ID).toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

function createTreasuryAtaInstruction(payer, ata, owner, mint) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false }
    ],
    data: Buffer.from([1])
  });
}

function createUsdtTransferInstruction(source, mint, destination, authority, amount, reference) {
  const data = Buffer.alloc(10);
  data[0] = 12;
  data.writeBigUInt64LE(BigInt(amount), 1);
  data[9] = USDT_DECIMALS;
  return new TransactionInstruction({
    programId: new PublicKey(TOKEN_PROGRAM_ID),
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: reference, isSigner: false, isWritable: false }
    ],
    data
  });
}

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const tier = TIERS[body.tierId];
    if (!tier) throw Object.assign(new Error("Unknown node tier"), { status: 400, code: "INVALID_TIER" });
    if (tier.isTest && (!envFlag("PAYMENT_TEST_ENABLED") || body.testMode !== true)) {
      throw Object.assign(new Error("Payment test is not available"), { status: 403, code: "PAYMENT_TEST_DISABLED" });
    }
    if (!envFlag("SALE_ENABLED")) throw Object.assign(new Error("Formal node sale is not open yet"), { status: 403, code: "SALE_CLOSED" });

    const buyer = requirePublicKey(body.buyer, "buyer wallet");
    let referrer = body.referrer ? requirePublicKey(body.referrer, "referrer wallet") : null;
    if (referrer === buyer) referrer = null;
    const proofHash = verifyWalletProof(request, buyer, tier.id, referrer, body.walletProof);
    await claimWalletProof(proofHash, buyer);

    const orderId = randomUUID();
    const memo = buildOrderMemo(tier, orderId);
    const customerToken = randomCustomerToken();
    const reference = Keypair.generate().publicKey;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ORDER_TTL_MS);
    const mint = new PublicKey(USDT_MINT);
    const treasuryOwner = new PublicKey(TREASURY_OWNER);
    const treasuryAta = associatedTokenAddress(mint, treasuryOwner);
    if (treasuryAta.toBase58() !== TREASURY_USDT_ATA) throw new Error("Treasury USDT account configuration mismatch");
    const buyerKey = new PublicKey(buyer);
    const buyerAta = associatedTokenAddress(mint, buyerKey);
    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    const reservationSlot = await reserveTier(tier, orderId, expiresAt.toISOString());

    const transfer = createUsdtTransferInstruction(buyerAta, mint, treasuryAta, buyerKey, tier.amount, reference);

    const transaction = new Transaction({ feePayer: buyerKey, recentBlockhash: blockhash });
    transaction.add(
      createTreasuryAtaInstruction(buyerKey, treasuryAta, treasuryOwner, mint),
      new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(memo, "utf8") }),
      transfer
    );

    const order = {
      id: orderId,
      version: 1,
      status: "awaiting_payment",
      network: NETWORK,
      tierId: tier.id,
      tierLevel: tier.level,
      tierNameZh: tier.zh,
      tierNameEn: tier.en,
      amountBaseUnits: tier.amount,
      displayAmount: tier.displayAmount,
      currency: "USDT",
      mint: USDT_MINT,
      decimals: USDT_DECIMALS,
      tokenProgram: TOKEN_PROGRAM_ID,
      treasuryOwner: TREASURY_OWNER,
      treasuryAta: TREASURY_USDT_ATA,
      buyer,
      buyerAta: buyerAta.toBase58(),
      referrer,
      referralStatus: referrer ? "claimed_at_order_pending_review" : "official_direct",
      reference: reference.toBase58(),
      memo,
      reservationSlot,
      customerTokenHash: sha256(customerToken),
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isTest: Boolean(tier.isTest)
    };
    await createOrderRecord(order);

    return json(201, {
      orderId,
      customerToken,
      status: order.status,
      transactionBase64: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
      lastValidBlockHeight,
      expiresAt: order.expiresAt,
      amount: tier.displayAmount,
      amountBaseUnits: tier.amount,
      currency: "USDT",
      buyer,
      buyerAta: buyerAta.toBase58(),
      mint: USDT_MINT,
      treasuryOwner: TREASURY_OWNER,
      treasuryAta: TREASURY_USDT_ATA,
      reference: order.reference,
      memo: order.memo,
      isTest: Boolean(tier.isTest)
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/node-orders/create",
  rateLimit: { windowLimit: 2, windowSize: 180, aggregateBy: ["ip", "domain"] }
};
