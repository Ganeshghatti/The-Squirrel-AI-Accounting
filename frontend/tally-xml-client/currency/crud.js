import { tallyPost } from "../client.js";
import { xs } from "../xml.js";

export function envelopeCurrency_create({
  companyName,
  name,
  expandedSymbol,
  isSuffix = "No",
  hasSpace = "Yes",
  decimalPlaces = "2",
  inMillions = "Yes",
  subUnit,
  decimalSymbol = ".",
  decimalPlacesForPrinting = "2",
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
          <CURRENCY NAME="${xs(name)}" Action="Create">
            <NAME>${xs(name)}</NAME>
            <EXPANDEDSYMBOL>${xs(expandedSymbol)}</EXPANDEDSYMBOL>
            <ISSUFFIX>${xs(isSuffix)}</ISSUFFIX>
            <HASSPACE>${xs(hasSpace)}</HASSPACE>
            <DECIMALPLACES>${xs(decimalPlaces)}</DECIMALPLACES>
            <INMILLIONS>${xs(inMillions)}</INMILLIONS>
            <SUBUNIT>${xs(subUnit)}</SUBUNIT>
            <DECIMALSYMBOL>${xs(decimalSymbol)}</DECIMALSYMBOL>
            <DECIMALPLACESFORPRINTING>${xs(decimalPlacesForPrinting)}</DECIMALPLACESFORPRINTING>
          </CURRENCY>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCurrency_readSingle({ companyName, name }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>Currency</SUBTYPE>
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

export function envelopeCurrency_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Currencies</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Currencies" ISINITIALIZE="Yes">
            <TYPE>Currency</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>ExpandedSymbol</NATIVEMETHOD>
            <NATIVEMETHOD>DecimalPlaces</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCurrency_update({ companyName, name, decimalPlaces }) {
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
          <CURRENCY NAME="${xs(name)}" Action="Alter">
            <DECIMALPLACES>${xs(decimalPlaces)}</DECIMALPLACES>
          </CURRENCY>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeCurrency_delete({ companyName, name }) {
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
          <CURRENCY NAME="${xs(name)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function currency_create(params) {
  return tallyPost(envelopeCurrency_create(params));
}

export async function currency_readSingle(params) {
  return tallyPost(envelopeCurrency_readSingle(params));
}

export async function currency_readAll(params) {
  return tallyPost(envelopeCurrency_readAll(params));
}

export async function currency_update(params) {
  return tallyPost(envelopeCurrency_update(params));
}

export async function currency_delete(params) {
  return tallyPost(envelopeCurrency_delete(params));
}
