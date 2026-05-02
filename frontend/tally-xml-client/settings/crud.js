import { tallyPost } from "../client.js";

/**
 * List companies loaded in Tally (onboarding — pick a name to store in your DB).
 */
export function envelopeListCompaniesLoaded() {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Companies</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVISCOMPFILTERREQUIRED>Yes</SVISCOMPFILTERREQUIRED>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Companies" ISINITIALIZE="Yes">
            <TYPE>Company</TYPE>
            <FETCH>Name</FETCH>
            <FETCH>StartingFrom</FETCH>
            <FETCH>EndingAt</FETCH>
            <FETCH>BooksFrom</FETCH>
            <FETCH>IsSelected</FETCH>
            <FETCH>IsLoaded</FETCH>
            <FETCH>CompanyNumber</FETCH>
            <FETCH>GUID</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

function matchAttr(attrString, attrName) {
  const r = attrString.match(new RegExp(`${attrName}="([^"]*)"`, "i"));
  return r ? r[1] : "";
}

/** First `STATUS` element under `HEADER` in the response (e.g. `"1"` = success). */
function parseTallyEnvelopeHeaderStatus(xml) {
  if (!xml || typeof xml !== "string") return null;
  const headerMatch = xml.match(/<HEADER>([\s\S]*?)<\/HEADER>/i);
  const block = headerMatch ? headerMatch[1] : xml;
  const m = block.match(/<STATUS>([^<]*)<\/STATUS>/i);
  return m ? m[1].trim() : null;
}

/** Parse Tally "List of Companies" export XML into plain objects. */
function parseTallyListCompaniesXml(xml) {
  if (!xml || typeof xml !== "string") {
    return { companies: [] };
  }

  const companies = [];
  const re = /<COMPANY\s+([^>]*?)>([\s\S]*?)<\/COMPANY>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrPart = m[1];
    const inner = m[2];

    const nameAttr = matchAttr(attrPart, "NAME");
    const reservedName = matchAttr(attrPart, "RESERVEDNAME");

    const textTag = (tag) => {
      const r = inner.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      return r ? String(r[1]).trim() : "";
    };

    const name = textTag("NAME") || nameAttr;

    companies.push({
      name,
      nameAttr,
      reservedName,
      endingAt: textTag("ENDINGAT"),
      startingFrom: textTag("STARTINGFROM"),
      booksFrom: textTag("BOOKSFROM"),
      guid: textTag("GUID"),
      companyNumber: textTag("COMPANYNUMBER"),
    });
  }

  return { companies };
}

/**
 * POST list-companies envelope to Tally and return JSON-friendly rows + raw metadata.
 */
export async function settings_listCompaniesLoaded() {
  const envelope = envelopeListCompaniesLoaded();
  const { ok, status, body } = await tallyPost(envelope);
  const rawBody = typeof body === "string" ? body : String(body ?? "");

  if (!ok) {
    return {
      ok: false,
      httpStatus: status,
      tallyStatus: null,
      companies: [],
      rawBody,
      error: `Tally HTTP ${status}`,
    };
  }

  const tallyStatus = parseTallyEnvelopeHeaderStatus(rawBody);
  const { companies } = parseTallyListCompaniesXml(rawBody);

  if (tallyStatus !== null && tallyStatus !== "1") {
    return {
      ok: false,
      httpStatus: status,
      tallyStatus,
      companies,
      rawBody,
      error: `Tally reported STATUS ${tallyStatus}`,
    };
  }

  return {
    ok: true,
    httpStatus: status,
    tallyStatus,
    companies,
    rawBody,
  };
}
