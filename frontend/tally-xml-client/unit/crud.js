import { tallyPost } from "../client.js";
import { extractTallyCollectionReadXml, xs } from "../xml.js";

export function envelopeUnit_createSimple({
  companyName,
  name,
  originalName,
  decimalPlaces = "0",
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
          <UNIT NAME="${xs(name)}" Action="Create">
            <NAME>${xs(name)}</NAME>
            <ISSIMPLEUNIT>Yes</ISSIMPLEUNIT>
            <ORIGINALNAME>${xs(originalName)}</ORIGINALNAME>
            <DECIMALPLACES>${xs(decimalPlaces)}</DECIMALPLACES>
          </UNIT>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeUnit_createCompound({
  companyName,
  baseUnits,
  additionalUnits,
  conversion,
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
          <UNIT Action="Create">
            <ISSIMPLEUNIT>No</ISSIMPLEUNIT>
            <BASEUNITS>${xs(baseUnits)}</BASEUNITS>
            <ADDITIONALUNITS>${xs(additionalUnits)}</ADDITIONALUNITS>
            <CONVERSION>${xs(conversion)}</CONVERSION>
          </UNIT>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeUnit_readSingle({ companyName, name }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>Unit</SUBTYPE>
    <ID TYPE="Name">${xs(name)}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeUnit_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Units</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Units" ISINITIALIZE="Yes">
            <TYPE>Unit</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>OriginalName</NATIVEMETHOD>
            <NATIVEMETHOD>IsSimpleUnit</NATIVEMETHOD>
            <NATIVEMETHOD>DecimalPlaces</NATIVEMETHOD>
            <NATIVEMETHOD>BaseUnits</NATIVEMETHOD>
            <NATIVEMETHOD>AdditionalUnits</NATIVEMETHOD>
            <NATIVEMETHOD>Conversion</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeUnit_update({ companyName, name, decimalPlaces }) {
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
          <UNIT NAME="${xs(name)}" Action="Alter">
            <DECIMALPLACES>${xs(decimalPlaces)}</DECIMALPLACES>
          </UNIT>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeUnit_delete({ companyName, name }) {
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
          <UNIT NAME="${xs(name)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function unit_createSimple(params) {
  return tallyPost(envelopeUnit_createSimple(params));
}

export async function unit_createCompound(params) {
  return tallyPost(envelopeUnit_createCompound(params));
}

export async function unit_readSingle(params) {
  return tallyPost(envelopeUnit_readSingle(params));
}

/** Strip empty Tally fields; keep only UNIT records with data. */
export function extractUnitReadAllXml(xml) {
  return extractTallyCollectionReadXml(xml, { recordTag: "UNIT" });
}

export async function unit_readAll(params) {
  const res = await tallyPost(envelopeUnit_readAll(params));
  if (res.body) res.body = extractUnitReadAllXml(res.body);
  return res;
}

export async function unit_update(params) {
  return tallyPost(envelopeUnit_update(params));
}

export async function unit_delete(params) {
  return tallyPost(envelopeUnit_delete(params));
}
