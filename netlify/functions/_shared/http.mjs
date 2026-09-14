import { safeEqualText } from "./config.mjs";

export function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

export function methodNotAllowed(methods) {
  return json(405, { error: "METHOD_NOT_ALLOWED" }, { allow: methods.join(", ") });
}

export async function readJson(request, maxBytes = 8192) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) throw Object.assign(new Error("Request too large"), { status: 413, code: "PAYLOAD_TOO_LARGE" });
  const text = await request.text();
  if (text.length > maxBytes) throw Object.assign(new Error("Request too large"), { status: 413, code: "PAYLOAD_TOO_LARGE" });
  try { return text ? JSON.parse(text) : {}; }
  catch { throw Object.assign(new Error("Invalid JSON"), { status: 400, code: "INVALID_JSON" }); }
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  const allowed = process.env.ALLOWED_ORIGIN || process.env.URL;
  if (!origin || !allowed) return;
  try {
    if (new URL(origin).origin !== new URL(allowed).origin) {
      throw Object.assign(new Error("Origin not allowed"), { status: 403, code: "ORIGIN_NOT_ALLOWED" });
    }
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error("Origin not allowed"), { status: 403, code: "ORIGIN_NOT_ALLOWED" });
  }
}

export function requireAdmin(request) {
  const expected = process.env.ADMIN_TOKEN || "";
  const provided = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!expected || !provided || !safeEqualText(expected, provided)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401, code: "UNAUTHORIZED" });
  }
}

export function handleError(error) {
  console.error(error);
  return json(error.status || 500, {
    error: error.code || "INTERNAL_ERROR",
    message: error.status && error.status < 500 ? error.message : "Service temporarily unavailable"
  });
}
