import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dir, "..", ".env") });

export function tallyApiBaseUrl() {
  return (process.env.TALLY_API_BASE || "http://localhost:9000").trim().replace(/\/$/, "");
}

/**
 * POST one Tally XML envelope.
 * Responses vary by envelope type; `body` is always raw text—parse only where you need it.
 */
export async function tallyPost(envelopeXml, { signal } = {}) {
  const res = await fetch(tallyApiBaseUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body: envelopeXml,
    signal,
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}
