import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as anchor from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IDL_PATH = path.join(ROOT, "target", "idl", "turing_node_sale.json");
const SO_PATH = path.join(ROOT, "target", "deploy", "turing_node_sale.so");
const PROGRAM_KEYPAIR_PATH = path.join(
  ROOT,
  "target",
  "deploy",
  "turing_node_sale-keypair.json",
);

const PROGRAM_ID = new PublicKey("46z8HyP9StJs6SvPJGC2HgsUoFuH2snsSiWypWVzxdNF");
const TREASURY = new PublicKey("FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8");
const PYTH_SOL_USD = new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE");
const PYTH_RECEIVER = new PublicKey("rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ");
const SOL_USD_FEED_ID = "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";
const DEFAULT_AUTHORITY = "~/.config/solana/turing-mainnet-authority.json";
const SMOKE_TIER = 255;
const SMOKE_USD_CENTS = 100n;

function fail(message) {
  throw new Error(message);
}

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return path.resolve(value);
}

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) fail(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

function loadKeypair(keypairPath) {
  const resolved = expandHome(keypairPath);
  if (!fs.existsSync(resolved)) fail(`Keypair not found: ${resolved}`);
  const bytes = JSON.parse(fs.readFileSync(resolved, "utf8"));
  if (!Array.isArray(bytes) || bytes.length !== 64) fail(`Invalid keypair file: ${resolved}`);
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

function readIdl() {
  if (!fs.existsSync(IDL_PATH)) fail(`IDL not found. Build the program first: ${IDL_PATH}`);
  const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf8"));
  if (idl.address !== PROGRAM_ID.toBase58()) fail(`IDL address mismatch: ${idl.address}`);
  return idl;
}

function createProgram(connection, keypair) {
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  return {
    provider,
    program: new anchor.Program(readIdl(), provider),
  };
}

function createConnection(rpc) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const rpcFetch = proxy
    ? (url, options) => fetch(url, { ...options, agent: new HttpsProxyAgent(proxy) })
    : fetch;
  return new Connection(rpc, { commitment: "confirmed", fetch: rpcFetch });
}

function salePda() {
  return PublicKey.findProgramAddressSync([Buffer.from("sale")], PROGRAM_ID)[0];
}

function formatSol(lamports) {
  return `${(Number(lamports) / anchor.web3.LAMPORTS_PER_SOL).toFixed(9)} SOL`;
}

function ceilDiv(numerator, denominator) {
  return (numerator + denominator - 1n) / denominator;
}

function usdCentsToLamports(usdCents, price, exponent) {
  const priceValue = BigInt(price.toString());
  if (priceValue <= 0n) fail("Pyth returned a non-positive SOL/USD price");
  let numerator = usdCents * 1_000_000_000n;
  let denominator = 100n * priceValue;
  if (exponent < 0) numerator *= 10n ** BigInt(-exponent);
  if (exponent > 0) denominator *= 10n ** BigInt(exponent);
  return ceilDiv(numerator, denominator);
}

function jsonValue(value) {
  if (value instanceof PublicKey) return value.toBase58();
  if (anchor.BN.isBN(value)) return value.toString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonValue(item)]));
  }
  return value;
}

async function assertMainnet(connection) {
  const genesis = await connection.getGenesisHash();
  if (genesis !== MAINNET_GENESIS_HASH) {
    fail(`Refusing operation: RPC is not Solana Mainnet (genesis ${genesis})`);
  }
}

async function assertPythAccount(connection) {
  const account = await connection.getAccountInfo(PYTH_SOL_USD, "confirmed");
  if (!account) fail(`Pyth SOL/USD account not found: ${PYTH_SOL_USD}`);
  if (!account.owner.equals(PYTH_RECEIVER)) {
    fail(`Unexpected Pyth account owner: ${account.owner.toBase58()}`);
  }
  return account;
}

function decodePythPrice(program, account) {
  const update = program.coder.accounts.decode("priceUpdateV2", account.data);
  const feedId = Buffer.from(update.priceMessage.feedId).toString("hex");
  if (feedId !== SOL_USD_FEED_ID) fail(`Unexpected Pyth feed id: ${feedId}`);
  return update;
}

async function fetchSale(program) {
  return program.account.saleState.fetchNullable(salePda());
}

async function preflight(connection, authority, smokeBuyer) {
  await assertMainnet(connection);
  const pythAccount = await assertPythAccount(connection);
  const { program } = createProgram(connection, authority);
  const priceUpdate = decodePythPrice(program, pythAccount);
  if (!fs.existsSync(SO_PATH)) fail(`Program binary not found: ${SO_PATH}`);
  if (!fs.existsSync(PROGRAM_KEYPAIR_PATH)) fail(`Program keypair not found: ${PROGRAM_KEYPAIR_PATH}`);

  const programKeypair = loadKeypair(PROGRAM_KEYPAIR_PATH);
  if (!programKeypair.publicKey.equals(PROGRAM_ID)) fail("Program keypair does not match the fixed Program ID");

  const so = fs.readFileSync(SO_PATH);
  const soHash = crypto.createHash("sha256").update(so).digest("hex");
  const authorityBalance = await connection.getBalance(authority.publicKey, "confirmed");
  const programDataRent = await connection.getMinimumBalanceForRentExemption(so.length + 45);
  const temporaryBufferRent = await connection.getMinimumBalanceForRentExemption(so.length + 37);
  const programAccount = await connection.getAccountInfo(PROGRAM_ID, "confirmed");

  console.log(JSON.stringify(jsonValue({
    network: "Solana Mainnet",
    rpc: connection.rpcEndpoint,
    programId: PROGRAM_ID,
    treasury: TREASURY,
    authority: authority.publicKey,
    authorityBalanceLamports: authorityBalance,
    authorityBalance: formatSol(authorityBalance),
    smokeTestBuyer: smokeBuyer || null,
    publicSaleAfterInitialize: false,
    pythSolUsdAccount: PYTH_SOL_USD,
    pythOwner: PYTH_RECEIVER,
    pythFeedId: SOL_USD_FEED_ID,
    pythPrice: priceUpdate.priceMessage.price,
    pythExponent: priceUpdate.priceMessage.exponent,
    pythPublishTime: priceUpdate.priceMessage.publishTime,
    binaryBytes: so.length,
    binarySha256: soHash,
    estimatedPermanentProgramRent: formatSol(programDataRent),
    estimatedTemporaryBufferRent: formatSol(temporaryBufferRent),
    programAlreadyExists: Boolean(programAccount?.executable),
  }), null, 2));
}

async function initialize(connection, authority, smokeBuyer) {
  await assertMainnet(connection);
  await assertPythAccount(connection);
  if (!smokeBuyer) fail("initialize requires --smoke-buyer <public-key>");
  const { program } = createProgram(connection, authority);
  const deployed = await connection.getAccountInfo(PROGRAM_ID, "confirmed");
  if (!deployed?.executable) fail(`Program is not deployed: ${PROGRAM_ID.toBase58()}`);
  if (await fetchSale(program)) fail(`Sale state already exists: ${salePda().toBase58()}`);

  const signature = await program.methods
    .initializeSale(smokeBuyer)
    .accounts({
      sale: salePda(),
      authority: authority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const state = await fetchSale(program);
  if (!state || state.publicSaleEnabled || !state.smokeTestEnabled) {
    fail("Initialization transaction confirmed but state verification failed");
  }
  console.log(JSON.stringify(jsonValue({ signature, sale: salePda(), state }), null, 2));
}

async function status(connection) {
  await assertMainnet(connection);
  const { program } = createProgram(connection, Keypair.generate());
  const pythAccount = await assertPythAccount(connection);
  const priceUpdate = decodePythPrice(program, pythAccount);
  const priceMessage = priceUpdate.priceMessage;
  const programAccount = await connection.getAccountInfo(PROGRAM_ID, "confirmed");
  const state = await fetchSale(program);
  console.log(JSON.stringify(jsonValue({
    programId: PROGRAM_ID,
    programDeployed: Boolean(programAccount?.executable),
    salePda: salePda(),
    saleInitialized: Boolean(state),
    oracle: {
      account: PYTH_SOL_USD,
      owner: pythAccount.owner,
      price: priceMessage.price,
      exponent: priceMessage.exponent,
      confidence: priceMessage.conf,
      publishTime: priceMessage.publishTime,
      feedId: SOL_USD_FEED_ID,
      verificationLevel: priceUpdate.verificationLevel,
    },
    state,
  }), null, 2));
}

async function smokePurchase(connection, buyer, priorityFee) {
  await assertMainnet(connection);
  const pythAccount = await assertPythAccount(connection);
  const { program } = createProgram(connection, buyer);
  const state = await fetchSale(program);
  if (!state) fail("Sale is not initialized");
  if (state.publicSaleEnabled) fail("Refusing smoke test while public sale is enabled");
  if (!state.smokeTestEnabled || state.smokeTestRetired) fail("Smoke-test path is not active");
  if (!state.smokeTestBuyer.equals(buyer.publicKey)) {
    fail(`This wallet is not the designated smoke buyer: ${state.smokeTestBuyer.toBase58()}`);
  }
  if (Number(state.smokeTestSold) !== 0) fail("The one-supply smoke certificate is already sold");

  const priceUpdate = decodePythPrice(program, pythAccount);
  const message = priceUpdate.priceMessage;
  const expectedLamports = usdCentsToLamports(
    SMOKE_USD_CENTS,
    message.price,
    Number(message.exponent),
  );
  const maxLamports = ceilDiv(expectedLamports * 102n, 100n);
  const publishTime = Number(message.publishTime.toString());
  const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - publishTime);
  if (ageSeconds > Number(state.maxPriceAgeSeconds.toString())) {
    fail(`Pyth price is stale (${ageSeconds}s); wait for the next update`);
  }

  const buyerBalance = await connection.getBalance(buyer.publicKey, "confirmed");
  if (buyerBalance < 50_000_000) {
    fail(`Smoke buyer balance is ${formatSol(buyerBalance)}; fund at least 0.05 SOL first`);
  }

  const orderId = crypto.randomBytes(16);
  const [purchaseRecord] = PublicKey.findProgramAddressSync(
    [Buffer.from("purchase"), buyer.publicKey.toBuffer(), orderId],
    PROGRAM_ID,
  );
  const [certificateMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("certificate"), purchaseRecord.toBuffer()],
    PROGRAM_ID,
  );
  const certificateTokenAccount = getAssociatedTokenAddressSync(
    certificateMint,
    buyer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const treasuryBefore = await connection.getBalance(TREASURY, "confirmed");

  console.log(JSON.stringify(jsonValue({
    action: "1 U Mainnet smoke purchase",
    buyer: buyer.publicKey,
    expectedLamports,
    expectedPayment: formatSol(expectedLamports),
    maximumLamports: maxLamports,
    maximumPayment: formatSol(maxLamports),
    oraclePrice: message.price,
    oracleExponent: message.exponent,
    oraclePublishTime: publishTime,
    oracleAgeSeconds: ageSeconds,
    certificateRights: "TEST ONLY — no node, staking, referral, revenue, or economic rights",
  }), null, 2));

  if (process.env.TURING_MAINNET_SMOKE !== "I_UNDERSTAND_THIS_SPENDS_REAL_SOL") {
    fail("Preview only. Set TURING_MAINNET_SMOKE=I_UNDERSTAND_THIS_SPENDS_REAL_SOL to sign the purchase");
  }

  const signature = await program.methods
    .purchaseNode(
      SMOKE_TIER,
      new anchor.BN(maxLamports.toString()),
      [...orderId],
      PublicKey.default,
    )
    .accounts({
      sale: salePda(),
      purchaseRecord,
      certificateMint,
      certificateTokenAccount,
      buyer: buyer.publicKey,
      treasury: TREASURY,
      priceUpdate: PYTH_SOL_USD,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }),
    ])
    .rpc();

  const record = await program.account.purchaseRecord.fetch(purchaseRecord);
  const tokenBalance = await connection.getTokenAccountBalance(certificateTokenAccount, "confirmed");
  const treasuryAfter = await connection.getBalance(TREASURY, "confirmed");
  if (!record.isSmokeTest || Number(record.tier) !== SMOKE_TIER || tokenBalance.value.amount !== "1") {
    fail("Smoke transaction confirmed but certificate verification failed; keep public sale disabled");
  }
  console.log(JSON.stringify(jsonValue({
    signature,
    purchaseRecord,
    certificateMint,
    certificateTokenAccount,
    paidLamports: record.paidLamports,
    treasuryIncreaseLamports: BigInt(treasuryAfter) - BigInt(treasuryBefore),
    certificateAmount: tokenBalance.value.amount,
    verified: true,
  }), null, 2));
}

async function retireSmoke(connection, authority) {
  await assertMainnet(connection);
  const { program } = createProgram(connection, authority);
  const before = await fetchSale(program);
  if (!before) fail("Sale is not initialized");
  if (Number(before.smokeTestSold) !== 1) fail("The 1 U smoke purchase has not succeeded");
  if (before.smokeTestRetired) fail("Smoke-test path is already retired");

  const signature = await program.methods
    .retireSmokeTest()
    .accounts({ sale: salePda(), authority: authority.publicKey })
    .rpc();
  const after = await fetchSale(program);
  if (!after.smokeTestRetired || after.smokeTestEnabled || after.publicSaleEnabled) {
    fail("Retirement verification failed; public sale must remain disabled");
  }
  console.log(JSON.stringify(jsonValue({ signature, state: after }), null, 2));
}

async function pause(connection, authority) {
  await assertMainnet(connection);
  const { program } = createProgram(connection, authority);
  const signature = await program.methods
    .updateSaleStatus(true, false, false)
    .accounts({ sale: salePda(), authority: authority.publicKey })
    .rpc();
  const state = await fetchSale(program);
  if (!state?.emergencyPaused || state.publicSaleEnabled || state.smokeTestEnabled) {
    fail("Emergency pause verification failed");
  }
  console.log(JSON.stringify(jsonValue({ signature, state }), null, 2));
}

async function main() {
  const [command = "status", ...rawOptions] = process.argv.slice(2);
  const options = parseOptions(rawOptions);
  const rpc = options.rpc || process.env.SOLANA_RPC_URL || DEFAULT_RPC;
  const connection = createConnection(rpc);
  const smokeBuyer = options["smoke-buyer"] ? new PublicKey(options["smoke-buyer"]) : null;
  const authorityPath = options.keypair || process.env.AUTHORITY_KEYPAIR || DEFAULT_AUTHORITY;
  const priorityFee = Number(options["priority-fee"] || process.env.PRIORITY_FEE_MICROLAMPORTS || 5_000);

  if (command === "status") return status(connection);
  if (command === "smoke-purchase") {
    if (!options.keypair) fail("smoke-purchase requires --keypair <smoke-buyer-keypair.json>");
    return smokePurchase(connection, loadKeypair(options.keypair), priorityFee);
  }

  const authority = loadKeypair(authorityPath);
  if (command === "preflight") return preflight(connection, authority, smokeBuyer);
  if (command === "initialize") return initialize(connection, authority, smokeBuyer);
  if (command === "retire-smoke") return retireSmoke(connection, authority);
  if (command === "pause") return pause(connection, authority);
  fail(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message || error}`);
  process.exitCode = 1;
});
