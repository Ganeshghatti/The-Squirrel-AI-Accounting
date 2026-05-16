import {
  parseTallyXml,
  recordsFromDataCollection,
  recordsFromDayBookData,
  findTallyRecordNodes,
} from "./xml.js";

/** Tally export often wraps text in `{ "#text": "...", "@_TYPE": "..." }`. */
export function tallyText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "#text" in value) return String(value["#text"]).trim();
  return "";
}

function collectRecords(xml, recordTag) {
  const parsed = parseTallyXml(xml);
  if (!parsed) return [];
  return recordsFromDataCollection(parsed, recordTag) ?? findTallyRecordNodes(parsed, recordTag);
}

function ledgerSnapshot(l) {
  const name = l["@_NAME"] ?? tallyText(l.NAME);
  if (!name) return null;
  const row = {
    name,
    parent: tallyText(l.PARENT),
  };
  const gstin = tallyText(l.PARTYGSTIN);
  if (gstin) row.gstin = gstin;
  const closing = tallyText(l.CLOSINGBALANCE);
  if (closing) row.closing_balance = closing;
  const opening = tallyText(l.OPENINGBALANCE);
  if (opening && opening !== "0" && opening !== "0.00") row.opening_balance = opening;
  return row;
}

function stockItemSnapshot(s) {
  const name = s["@_NAME"] ?? tallyText(s.NAME);
  if (!name) return null;
  const row = {
    name,
    parent: tallyText(s.PARENT),
    base_units: tallyText(s.BASEUNITS),
  };
  const hsn = tallyText(s.HSNCODE);
  if (hsn) row.hsn = hsn;
  const closing = tallyText(s.CLOSINGBALANCE);
  if (closing) row.closing_balance = closing;
  return row;
}

function unitSnapshot(u) {
  const name = u["@_NAME"] ?? tallyText(u.NAME);
  if (!name) return null;
  return { name };
}

function asList(node) {
  if (node == null) return [];
  return Array.isArray(node) ? node : [node];
}

function voucherLedgerTotal(vch) {
  let total = 0;
  for (const entry of asList(vch["LEDGERENTRIES.LIST"])) {
    if (!entry || typeof entry !== "object") continue;
    const n = Number(tallyText(entry.AMOUNT));
    if (!Number.isNaN(n)) total += Math.abs(n);
  }
  return total;
}

function voucherSnapshot(v) {
  const voucher_number = tallyText(v.VOUCHERNUMBER);
  const reference = tallyText(v.REFERENCE);
  const party_ledger = tallyText(v.PARTYLEDGERNAME);
  const date = tallyText(v.DATE);
  if (!voucher_number && !reference && !party_ledger && !date) return null;

  let amount = Number(tallyText(v.AMOUNT));
  if (!amount) amount = voucherLedgerTotal(v);

  return {
    voucher_number,
    reference,
    party_ledger,
    party_name: tallyText(v.PARTYNAME) || undefined,
    date,
    voucher_type: tallyText(v.VOUCHERTYPENAME) || undefined,
    amount: amount || 0,
  };
}

function vouchersFromXml(xml) {
  const parsed = parseTallyXml(xml);
  if (!parsed) return [];
  return recordsFromDayBookData(parsed);
}

/**
 * Compact JSON for POST /analyze — only fields used by agents (no raw XML).
 * @param {{ ledgerXml?: string, stockItemXml?: string, unitXml?: string, voucherXml?: string }} bodies
 */
export function buildTallyAnalyzeSnapshot(bodies) {
  const { ledgerXml = "", stockItemXml = "", unitXml = "", voucherXml = "" } = bodies ?? {};

  const existing_ledgers = collectRecords(ledgerXml, "LEDGER")
    .map(ledgerSnapshot)
    .filter(Boolean);
  const existing_stock_items = collectRecords(stockItemXml, "STOCKITEM")
    .map(stockItemSnapshot)
    .filter(Boolean);
  const existing_units = collectRecords(unitXml, "UNIT")
    .map(unitSnapshot)
    .filter(Boolean);
  const existing_vouchers = vouchersFromXml(voucherXml)
    .map(voucherSnapshot)
    .filter(Boolean);

  return {
    existing_ledgers,
    existing_stock_items,
    existing_stock_categories: [],
    existing_units,
    existing_vouchers,
  };
}
