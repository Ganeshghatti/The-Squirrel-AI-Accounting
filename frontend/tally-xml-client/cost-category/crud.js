import { tallyPost } from "../client.js";
import { xs } from "../xml.js";

export function envelopeCostCategory_create({
  companyName,
  name,
  allocateRevenue = "Yes",
  allocateNonRevenue = "No",
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
          <COSTCATEGORY NAME="${xs(name)}" Action="Create">
            <NAME>${xs(name)}</NAME>
            <ALLOCATEREVENUE>${xs(allocateRevenue)}</ALLOCATEREVENUE>
            <ALLOCATENONREVENUE>${xs(allocateNonRevenue)}</ALLOCATENONREVENUE>
          </COSTCATEGORY>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCostCategory_readSingle({ companyName, name }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>CostCategory</SUBTYPE>
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

export function envelopeCostCategory_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Cost Categories</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Cost Categories" ISINITIALIZE="Yes">
            <TYPE>CostCategory</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>AllocateRevenue</NATIVEMETHOD>
            <NATIVEMETHOD>AllocateNonRevenue</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCostCategory_update({ companyName, name, allocateNonRevenue }) {
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
          <COSTCATEGORY NAME="${xs(name)}" Action="Alter">
            <ALLOCATENONREVENUE>${xs(allocateNonRevenue)}</ALLOCATENONREVENUE>
          </COSTCATEGORY>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCostCategory_delete({ companyName, name }) {
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
          <COSTCATEGORY NAME="${xs(name)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function costCategory_create(params) {
  return tallyPost(envelopeCostCategory_create(params));
}

export async function costCategory_readSingle(params) {
  return tallyPost(envelopeCostCategory_readSingle(params));
}

export async function costCategory_readAll(params) {
  return tallyPost(envelopeCostCategory_readAll(params));
}

export async function costCategory_update(params) {
  return tallyPost(envelopeCostCategory_update(params));
}

export async function costCategory_delete(params) {
  return tallyPost(envelopeCostCategory_delete(params));
}
