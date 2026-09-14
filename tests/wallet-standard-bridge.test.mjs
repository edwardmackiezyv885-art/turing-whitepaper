import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  Keypair,
  SystemProgram,
  Transaction
} from "@solana/web3.js";

async function loadProductionSerializer() {
  const source = await readFile(new URL("../src/wallet-standard-bridge.js", import.meta.url), "utf8");
  const start = source.indexOf("  serializeTransaction(transaction) {");
  const end = source.indexOf("\n  async signTransaction", start);

  assert.notEqual(start, -1, "production serializeTransaction method must exist");
  assert.notEqual(end, -1, "production serializeTransaction method boundary must exist");

  const methodSource = source.slice(start, end);
  const BridgeProbe = Function(
    "Transaction",
    `"use strict"; return class BridgeProbe {\n${methodSource}\n};`
  )(Transaction);

  return new BridgeProbe();
}

test("serializes an unsigned transaction created by a different bundle constructor", async () => {
  const bridge = await loadProductionSerializer();
  const payer = Keypair.generate().publicKey;
  const recipient = Keypair.generate().publicKey;
  const unsigned = new Transaction({
    feePayer: payer,
    recentBlockhash: Keypair.generate().publicKey.toBase58()
  }).add(SystemProgram.transfer({ fromPubkey: payer, toPubkey: recipient, lamports: 1 }));

  class ForeignBundleTransaction {
    constructor(transaction) {
      this.transaction = transaction;
      this.serializeOptions = [];
    }

    serialize(options) {
      this.serializeOptions.push(options);
      return this.transaction.serialize(options);
    }
  }

  const foreignTransaction = new ForeignBundleTransaction(unsigned);
  assert.equal(foreignTransaction instanceof Transaction, false);

  const bytes = bridge.serializeTransaction(foreignTransaction);

  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 0);
  assert.deepEqual(foreignTransaction.serializeOptions, [{
    requireAllSignatures: false,
    verifySignatures: false
  }]);
});
