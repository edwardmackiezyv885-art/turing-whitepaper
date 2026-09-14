import { randomUUID } from "node:crypto";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { envFlag, randomCustomerToken } from "./_shared/config.mjs";
import {
  MERCHANT_ORDER_TTL_MS,
  MERCHANT_SERVICE_FEE,
  NETWORK,
  TOKEN_PROGRAM_ID,
  TREASURY_OWNER,
  TREASURY_USDT_ATA,
  USDT_DECIMALS,
  USDT_MINT,
  buildMerchantOrderMemo,
  isApplicationId,
  requireMerchantPublicKey,
  sha256,
  verifyMerchantWalletProof
} from "./_shared/merchant-config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";
import { verifyApplicationToken } from "./_shared/merchant-application-config.mjs";
import { getMerchantApplication } from "./_shared/merchant-application-store.mjs";
import { claimMerchantWalletProof, createMerchantOrderRecord } from "./_shared/merchant-store.mjs";

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
    if (!envFlag("MERCHANT_FEE_ENABLED")) {
      throw Object.assign(new Error("Merchant service-fee checkout is not open"), { status: 403, code: "MERCHANT_FEE_CLOSED" });
    }
    const body = await readJson(request);
    const applicationId = String(body.applicationId || "");
    if (!isApplicationId(applicationId)) {
      throw Object.assign(new Error("A valid merchant application ID is required"), { status: 400, code: "INVALID_APPLICATION" });
    }
    const merchantApplication = await getMerchantApplication(applicationId);
    if (!merchantApplication || !["submitted", "under_review", "approved", "catalog_ready"].includes(merchantApplication.status)) {
      throw Object.assign(new Error("Merchant application must be submitted before payment"), { status: 409, code: "APPLICATION_NOT_SUBMITTED" });
    }
    verifyApplicationToken(merchantApplication, body.applicationToken);
    const buyer = requireMerchantPublicKey(body.buyer, "buyer wallet");
    const proofHash = verifyMerchantWalletProof(request, buyer, applicationId, body.walletProof);
    await claimMerchantWalletProof(proofHash, buyer, applicationId);

    const orderId = randomUUID();
    const customerToken = randomCustomerToken();
    const reference = Keypair.generate().publicKey;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + MERCHANT_ORDER_TTL_MS);
    const mint = new PublicKey(USDT_MINT);
    const treasuryOwner = new PublicKey(TREASURY_OWNER);
    const treasuryAta = associatedTokenAddress(mint, treasuryOwner);
    if (treasuryAta.toBase58() !== TREASURY_USDT_ATA) throw new Error("Treasury USDT account configuration mismatch");
    const buyerKey = new PublicKey(buyer);
    const buyerAta = associatedTokenAddress(mint, buyerKey);
    const memo = buildMerchantOrderMemo(applicationId, orderId);
    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

    const transaction = new Transaction({ feePayer: buyerKey, recentBlockhash: blockhash });
    transaction.add(
      createTreasuryAtaInstruction(buyerKey, treasuryAta, treasuryOwner, mint),
      new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(memo, "utf8") }),
      createUsdtTransferInstruction(
        buyerAta,
        mint,
        treasuryAta,
        buyerKey,
        MERCHANT_SERVICE_FEE.amount,
        reference
      )
    );

    const order = {
      id: orderId,
      version: 1,
      productType: "merchant_service_fee",
      status: "awaiting_payment",
      network: NETWORK,
      applicationId,
      merchantBusinessName: merchantApplication.business?.name || "",
      serviceId: MERCHANT_SERVICE_FEE.id,
      serviceNameZh: MERCHANT_SERVICE_FEE.zh,
      serviceNameEn: MERCHANT_SERVICE_FEE.en,
      amountBaseUnits: MERCHANT_SERVICE_FEE.amount,
      displayAmount: MERCHANT_SERVICE_FEE.displayAmount,
      referenceCny: MERCHANT_SERVICE_FEE.referenceCny,
      currency: "USDT",
      mint: USDT_MINT,
      decimals: USDT_DECIMALS,
      tokenProgram: TOKEN_PROGRAM_ID,
      treasuryOwner: TREASURY_OWNER,
      treasuryAta: TREASURY_USDT_ATA,
      buyer,
      buyerAta: buyerAta.toBase58(),
      reference: reference.toBase58(),
      memo,
      customerTokenHash: sha256(customerToken),
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      commercialTerms: "NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR"
    };
    await createMerchantOrderRecord(order);

    return json(201, {
      orderId,
      customerToken,
      applicationId,
      serviceId: order.serviceId,
      status: order.status,
      transactionBase64: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
      lastValidBlockHeight,
      expiresAt: order.expiresAt,
      amount: order.displayAmount,
      amountBaseUnits: order.amountBaseUnits,
      currency: "USDT",
      buyer,
      buyerAta: order.buyerAta,
      mint: USDT_MINT,
      treasuryOwner: TREASURY_OWNER,
      treasuryAta: TREASURY_USDT_ATA,
      reference: order.reference,
      memo: order.memo,
      notice: "COMMERCIAL_SERVICE_FEE_NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR"
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-orders/create",
  rateLimit: { windowLimit: 3, windowSize: 180, aggregateBy: ["ip", "domain"] }
};
