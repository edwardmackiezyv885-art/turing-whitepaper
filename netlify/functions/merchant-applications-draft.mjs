import { randomUUID } from "node:crypto";
import { sha256 } from "./_shared/config.mjs";
import {
  MERCHANT_APPLICATION_SCHEMA,
  MERCHANT_DRAFT_TTL_MS,
  randomApplicationToken
} from "./_shared/merchant-application-config.mjs";
import { createMerchantApplicationDraft } from "./_shared/merchant-application-store.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    assertSameOrigin(request);
    const id = randomUUID();
    const applicationToken = randomApplicationToken();
    const createdAt = new Date();
    const draft = {
      schema: MERCHANT_APPLICATION_SCHEMA,
      id,
      version: 1,
      status: "draft",
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + MERCHANT_DRAFT_TTL_MS).toISOString(),
      applicationTokenHash: sha256(applicationToken),
      assets: []
    };
    await createMerchantApplicationDraft(draft);
    return json(201, {
      applicationId: id,
      applicationToken,
      status: draft.status,
      expiresAt: draft.expiresAt
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-applications/draft",
  rateLimit: { windowLimit: 5, windowSize: 300, aggregateBy: ["ip", "domain"] }
};

