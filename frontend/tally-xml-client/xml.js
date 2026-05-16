import { XMLParser, XMLBuilder } from "fast-xml-parser";

/** Escape text so it’s safe inside Tally/XML element text nodes. */
export function xs(raw) {
  if (raw == null || raw === "") return "";
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PARSER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: false,
  trimValues: true,
};

const BUILDER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  suppressEmptyNode: true,
  format: false,
};

function isBlankString(value) {
  return value == null || String(value).trim() === "";
}

/** True when a parsed XML node has no meaningful content (empty text, empty object, empty array). */
export function isEmptyXmlValue(value) {
  if (value == null) return true;
  if (typeof value === "string") return isBlankString(value);
  if (typeof value === "number" || typeof value === "boolean") return false;
  if (Array.isArray(value)) {
    return value.filter((item) => !isEmptyXmlValue(item)).length === 0;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return true;
    return keys.every((key) => isEmptyXmlValue(value[key]));
  }
  return false;
}

/**
 * Recursively drop empty elements and blank attributes.
 * @param {unknown} value
 * @param {{ omitKeys?: string[] }} [opts] — element names to remove entirely (e.g. LANGUAGENAME.LIST)
 */
export function pruneEmptyXmlTree(value, { omitKeys = [] } = {}) {
  if (value == null) return undefined;

  if (Array.isArray(value)) {
    const next = value
      .map((item) => pruneEmptyXmlTree(item, { omitKeys }))
      .filter((item) => !isEmptyXmlValue(item));
    return next.length ? next : undefined;
  }

  if (typeof value === "object") {
    const out = {};
    for (const [key, raw] of Object.entries(value)) {
      if (omitKeys.includes(key)) continue;
      if (key.startsWith("@_")) {
        if (!isBlankString(raw)) out[key] = raw;
        continue;
      }
      const pruned = pruneEmptyXmlTree(raw, { omitKeys });
      if (!isEmptyXmlValue(pruned)) out[key] = pruned;
    }
    return Object.keys(out).length ? out : undefined;
  }

  if (typeof value === "string" && isBlankString(value)) return undefined;
  return value;
}

export function parseTallyXml(xml) {
  if (!xml || typeof xml !== "string") return null;
  try {
    return new XMLParser(PARSER_OPTS).parse(xml);
  } catch {
    return null;
  }
}

export function buildTallyXml(obj) {
  if (!obj) return "";
  return new XMLBuilder(BUILDER_OPTS).build(obj);
}

function isRecordNode(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function asRecordList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter(isRecordNode);
  return isRecordNode(value) ? [value] : [];
}

/** Records under BODY > DATA > COLLECTION (avoids CMPINFO count nodes like `<LEDGER>2</LEDGER>`). */
export function recordsFromDataCollection(parsed, recordTag) {
  const collection = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION;
  if (!collection) return null;
  return asRecordList(collection[recordTag]);
}

/** Voucher records from Day Book export (`DATA > TALLYMESSAGE > VOUCHER`). */
export function recordsFromDayBookData(parsed) {
  const data = parsed?.ENVELOPE?.BODY?.DATA;
  if (!data) return [];
  const message = data.TALLYMESSAGE;
  if (message) {
    if (Array.isArray(message)) {
      return message.flatMap((m) => asRecordList(m?.VOUCHER));
    }
    return asRecordList(message.VOUCHER);
  }
  return asRecordList(data.VOUCHER);
}

/** Collect record objects with `tagName` (fallback when response shape differs). */
export function findTallyRecordNodes(parsed, tagName) {
  const found = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(node, tagName)) {
      found.push(...asRecordList(node[tagName]));
    }
    for (const val of Object.values(node)) {
      if (val && typeof val === "object") walk(val);
    }
  };
  walk(parsed?.ENVELOPE?.BODY?.DATA ?? parsed);
  return found;
}

function collectionAttrsFromParsed(parsed) {
  const collection = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION;
  if (!collection || typeof collection !== "object") return {};
  return Object.fromEntries(Object.entries(collection).filter(([key]) => key.startsWith("@_")));
}

/**
 * Build a minimal ENVELOPE containing only DATA > COLLECTION > records with non-empty fields.
 */
export function buildTallyDataCollection(recordTag, records, collectionAttrs = {}) {
  const list = records.length === 1 ? records[0] : records;
  return buildTallyXml({
    ENVELOPE: {
      BODY: {
        DATA: {
          COLLECTION: {
            ...collectionAttrs,
            [recordTag]: list,
          },
        },
      },
    },
  });
}

/**
 * Selectively extract master records from a Tally collection read response.
 * @param {string} xml — raw Tally HTTP response body
 * @param {{ recordTag: string, omitKeys?: string[] }} opts
 */
export function extractTallyCollectionReadXml(xml, { recordTag, omitKeys = [] }) {
  if (!xml || typeof xml !== "string") return "";
  const parsed = parseTallyXml(xml);
  if (!parsed) return xml;

  const rawRecords = recordsFromDataCollection(parsed, recordTag) ?? findTallyRecordNodes(parsed, recordTag);
  const records = rawRecords
    .map((rec) => pruneEmptyXmlTree(rec, { omitKeys }))
    .filter((rec) => !isEmptyXmlValue(rec));

  if (!records.length) {
    return `<ENVELOPE><BODY><DATA><COLLECTION/></DATA></BODY></ENVELOPE>`;
  }

  return buildTallyDataCollection(recordTag, records, collectionAttrsFromParsed(parsed));
}

/**
 * Selectively extract vouchers from a Day Book export (drops empty tags and metadata).
 */
export function extractTallyVoucherDayBookXml(xml) {
  if (!xml || typeof xml !== "string") return "";
  const parsed = parseTallyXml(xml);
  if (!parsed) return xml;

  const vouchers = recordsFromDayBookData(parsed)
    .map((vch) => pruneEmptyXmlTree(vch))
    .filter((vch) => !isEmptyXmlValue(vch));

  if (!vouchers.length) {
    return `<ENVELOPE><BODY><DATA/></BODY></ENVELOPE>`;
  }

  const tallyMessage = parsed?.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE;
  const xmlns =
    tallyMessage && typeof tallyMessage === "object" && !Array.isArray(tallyMessage)
      ? Object.fromEntries(
          Object.entries(tallyMessage).filter(([key]) => key.startsWith("@_") && key.includes("xmlns"))
        )
      : { "@_xmlns:UDF": "TallyUDF" };

  return buildTallyXml({
    ENVELOPE: {
      BODY: {
        DATA: {
          TALLYMESSAGE: {
            ...xmlns,
            VOUCHER: vouchers.length === 1 ? vouchers[0] : vouchers,
          },
        },
      },
    },
  });
}
