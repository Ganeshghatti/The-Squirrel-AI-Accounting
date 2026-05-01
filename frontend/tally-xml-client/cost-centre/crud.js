import { tallyPost } from "../client.js";
import { xs } from "../xml.js";

export function envelopeCostCentre_create({
  companyName,
  name,
  parent = "",
  category = "Primary Cost Category",
  forPayroll = "No",
}) {
  const p = parent ? `<PARENT>${xs(parent)}</PARENT>` : "<PARENT/>";
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
          <COSTCENTRE NAME="${xs(name)}" Action="Create">
            <NAME>${xs(name)}</NAME>
            ${p}
            <CATEGORY>${xs(category)}</CATEGORY>
            <FORPAYROLL>${xs(forPayroll)}</FORPAYROLL>
          </COSTCENTRE>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCostCentre_readSingle({ companyName, name }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>CostCentre</SUBTYPE>
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

export function envelopeCostCentre_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Cost Centres</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Cost Centres" ISINITIALIZE="Yes">
            <TYPE>CostCentre</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>Parent</NATIVEMETHOD>
            <NATIVEMETHOD>Category</NATIVEMETHOD>
            <NATIVEMETHOD>ClosingBalance</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCostCentre_update({ companyName, name, category }) {
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
          <COSTCENTRE NAME="${xs(name)}" Action="Alter">
            <CATEGORY>${xs(category)}</CATEGORY>
          </COSTCENTRE>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCostCentre_delete({ companyName, name }) {
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
          <COSTCENTRE NAME="${xs(name)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function costCentre_create(params) {
  return tallyPost(envelopeCostCentre_create(params));
}

export async function costCentre_readSingle(params) {
  return tallyPost(envelopeCostCentre_readSingle(params));
}

export async function costCentre_readAll(params) {
  return tallyPost(envelopeCostCentre_readAll(params));
}

export async function costCentre_update(params) {
  return tallyPost(envelopeCostCentre_update(params));
}

export async function costCentre_delete(params) {
  return tallyPost(envelopeCostCentre_delete(params));
}
