/** Escape text so it’s safe inside Tally/XML element text nodes. */
export function xs(raw) {
  if (raw == null || raw === "") return "";
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
