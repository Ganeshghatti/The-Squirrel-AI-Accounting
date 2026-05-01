import { tallyPost } from "../client.js";
import { xs } from "../xml.js";

export function envelopeVoucherType_create({
  companyName,
  name,
  parent,
  numberingMethod = "Automatic",
  isDeemedPositive = "No",
  affectsStock = "Yes",
  commonNarration = "Yes",
  preventDuplicates = "Yes",
  prefillZero = "No",
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
          <VOUCHERTYPE NAME="${xs(name)}" Action="Create">
            <NAME>${xs(name)}</NAME>
            <PARENT>${xs(parent)}</PARENT>
            <NUMBERINGMETHOD>${xs(numberingMethod)}</NUMBERINGMETHOD>
            <ISDEEMEDPOSITIVE>${xs(isDeemedPositive)}</ISDEEMEDPOSITIVE>
            <AFFECTSSTOCK>${xs(affectsStock)}</AFFECTSSTOCK>
            <COMMONNARRATION>${xs(commonNarration)}</COMMONNARRATION>
            <PREVENTDUPLICATES>${xs(preventDuplicates)}</PREVENTDUPLICATES>
            <PREFILLZERO>${xs(prefillZero)}</PREFILLZERO>
          </VOUCHERTYPE>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeVoucherType_readSingle({ companyName, name }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>VoucherType</SUBTYPE>
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

export function envelopeVoucherType_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of VoucherTypes</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of VoucherTypes" ISINITIALIZE="Yes">
            <TYPE>VoucherType</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>Parent</NATIVEMETHOD>
            <NATIVEMETHOD>NumberingMethod</NATIVEMETHOD>
            <NATIVEMETHOD>AffectsStock</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeVoucherType_update({ companyName, name, numberingMethod }) {
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
          <VOUCHERTYPE NAME="${xs(name)}" Action="Alter">
            <NUMBERINGMETHOD>${xs(numberingMethod)}</NUMBERINGMETHOD>
          </VOUCHERTYPE>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeVoucherType_delete({ companyName, name }) {
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
          <VOUCHERTYPE NAME="${xs(name)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function voucherType_create(params) {
  return tallyPost(envelopeVoucherType_create(params));
}

export async function voucherType_readSingle(params) {
  return tallyPost(envelopeVoucherType_readSingle(params));
}

export async function voucherType_readAll(params) {
  return tallyPost(envelopeVoucherType_readAll(params));
}

export async function voucherType_update(params) {
  return tallyPost(envelopeVoucherType_update(params));
}

export async function voucherType_delete(params) {
  return tallyPost(envelopeVoucherType_delete(params));
}
