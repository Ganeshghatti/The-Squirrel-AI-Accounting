import { tallyPost } from "../client.js";
import { extractTallyCollectionReadXml, xs } from "../xml.js";

/** @typedef {{ companyName?: string }} Co */

/** Create minimal Sundry Creditors-style ledger */
export function envelopeLedger_createBasic({ companyName, ledgerName, parent, isBillWiseOn = "Yes", openingBalance = "0" }) {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${xs(ledgerName)}" Action="Create">
            <NAME>${xs(ledgerName)}</NAME>
            <PARENT>${xs(parent)}</PARENT>
            <ISBILLWISEON>${xs(isBillWiseOn)}</ISBILLWISEON>
            <OPENINGBALANCE>${xs(openingBalance)}</OPENINGBALANCE>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Full ledger with postal + GST fields.
 * @param {{ mailingName?: string, addressLines?: string[], pincode?: string, country?: string,
 *   stateName?: string, email?: string, phone?: string, mobile?: string, partyGstin?: string,
 *   gstRegistrationType?: string, countryOfResidence?: string }} p
 */
export function envelopeLedger_createFull({
  companyName,
  ledgerName,
  parent,
  isBillWiseOn = "Yes",
  mailingName,
  addressLines = [],
  pincode = "",
  countryName = "India",
  ledStateName = "",
  email = "",
  ledgerPhone = "",
  ledgerMobile = "",
  partyGstin = "",
  gstRegistrationType = "Regular",
  countryOfResidence = "India",
  openingBalance = "0",
}) {
  const addr = addressLines.map((line) => `              <ADDRESS>${xs(line)}</ADDRESS>`).join("\n");
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${xs(ledgerName)}" Action="Create">
            <NAME>${xs(ledgerName)}</NAME>
            <PARENT>${xs(parent)}</PARENT>
            <ISBILLWISEON>${xs(isBillWiseOn)}</ISBILLWISEON>
            <MAILINGNAME.LIST TYPE="String">
              <MAILINGNAME>${xs(mailingName ?? ledgerName)}</MAILINGNAME>
            </MAILINGNAME.LIST>
            <ADDRESS.LIST TYPE="String">
${addr}
            </ADDRESS.LIST>
            <PINCODE>${xs(pincode)}</PINCODE>
            <COUNTRYNAME>${xs(countryName)}</COUNTRYNAME>
            <LEDSTATENAME>${xs(ledStateName)}</LEDSTATENAME>
            <EMAIL>${xs(email)}</EMAIL>
            <LEDGERPHONE>${xs(ledgerPhone)}</LEDGERPHONE>
            <LEDGERMOBILE>${xs(ledgerMobile)}</LEDGERMOBILE>
            <PARTYGSTIN>${xs(partyGstin)}</PARTYGSTIN>
            <GSTREGISTRATIONTYPE>${xs(gstRegistrationType)}</GSTREGISTRATIONTYPE>
            <COUNTRYOFRESIDENCE>${xs(countryOfResidence)}</COUNTRYOFRESIDENCE>
            <OPENINGBALANCE>${xs(openingBalance)}</OPENINGBALANCE>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/** Create GST ledger e.g. CGST under Duties & Taxes */
export function envelopeLedger_createGstTax({
  companyName,
  ledgerName,
  parent = "Duties & Taxes",
  taxType = "GST",
  gstDutyHead = "Central Tax",
  roundType = "Normal Rounding",
  roundLimit = "0",
}) {
  const parentEsc = xs(parent).replace(/&amp;/g, "&").replace(/&(?!lt;|gt;|quot;|amp;)/g, "&amp;");
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${xs(ledgerName)}" Action="Create">
            <NAME>${xs(ledgerName)}</NAME>
            <PARENT>${parentEsc}</PARENT>
            <TAXTYPE>${xs(taxType)}</TAXTYPE>
            <GSTDUTYHEAD>${xs(gstDutyHead)}</GSTDUTYHEAD>
            <ROUNDTYPE>${xs(roundType)}</ROUNDTYPE>
            <ROUNDLIMIT>${xs(roundLimit)}</ROUNDLIMIT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeLedger_readSingle({ companyName, ledgerName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>Ledger</SUBTYPE>
    <ID TYPE="Name">${xs(ledgerName)}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <FETCHLIST>
        <FETCH>Name</FETCH>
        <FETCH>Parent</FETCH>
        <FETCH>OpeningBalance</FETCH>
        <FETCH>ClosingBalance</FETCH>
        <FETCH>Email</FETCH>
        <FETCH>LedgerPhone</FETCH>
        <FETCH>LedgerMobile</FETCH>
        <FETCH>PartyGSTIN</FETCH>
        <FETCH>GSTRegistrationType</FETCH>
        <FETCH>LedStateName</FETCH>
        <FETCH>Pincode</FETCH>
      </FETCHLIST>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeLedger_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Ledgers" ISINITIALIZE="Yes">
            <TYPE>Ledger</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>Parent</NATIVEMETHOD>
            <NATIVEMETHOD>OpeningBalance</NATIVEMETHOD>
            <NATIVEMETHOD>ClosingBalance</NATIVEMETHOD>
            <NATIVEMETHOD>Email</NATIVEMETHOD>
            <NATIVEMETHOD>PartyGSTIN</NATIVEMETHOD>
            <NATIVEMETHOD>LedStateName</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeLedger_readUnderGroup({ companyName, parentGroup }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Ledgers" ISINITIALIZE="Yes">
            <TYPE>Ledger</TYPE>
            <CHILDOF>${xs(parentGroup)}</CHILDOF>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>Parent</NATIVEMETHOD>
            <NATIVEMETHOD>ClosingBalance</NATIVEMETHOD>
            <NATIVEMETHOD>PartyGSTIN</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeLedger_update({
  companyName,
  ledgerName,
  email,
  ledgerMobile,
  partyGstin,
}) {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${xs(ledgerName)}" Action="Alter">
            <EMAIL>${xs(email)}</EMAIL>
            <LEDGERMOBILE>${xs(ledgerMobile)}</LEDGERMOBILE>
            <PARTYGSTIN>${xs(partyGstin)}</PARTYGSTIN>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeLedger_rename({ companyName, ledgerName, newName }) {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${xs(ledgerName)}" Action="Alter">
            <NAME>${xs(newName)}</NAME>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeLedger_delete({ companyName, ledgerName }) {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${xs(ledgerName)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function ledger_createBasic(params) {
  return tallyPost(envelopeLedger_createBasic(params));
}

export async function ledger_createFull(params) {
  return tallyPost(envelopeLedger_createFull(params));
}

export async function ledger_createGstTax(params) {
  return tallyPost(envelopeLedger_createGstTax(params));
}

export async function ledger_readSingle(params) {
  return tallyPost(envelopeLedger_readSingle(params));
}

/** Strip empty Tally fields; keep only LEDGER records with data (for AI / API payloads). */
export function extractLedgerReadAllXml(xml) {
  return extractTallyCollectionReadXml(xml, {
    recordTag: "LEDGER",
    omitKeys: ["LANGUAGENAME.LIST"],
  });
}

export async function ledger_readAll(params) {
  const res = await tallyPost(envelopeLedger_readAll(params));
  if (res.body) res.body = extractLedgerReadAllXml(res.body);
  return res;
}

export async function ledger_readUnderGroup(params) {
  return tallyPost(envelopeLedger_readUnderGroup(params));
}

export async function ledger_update(params) {
  return tallyPost(envelopeLedger_update(params));
}

export async function ledger_rename(params) {
  return tallyPost(envelopeLedger_rename(params));
}

export async function ledger_delete(params) {
  return tallyPost(envelopeLedger_delete(params));
}
