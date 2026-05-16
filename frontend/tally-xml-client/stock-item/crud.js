import { tallyPost } from "../client.js";
import { extractTallyCollectionReadXml, xs } from "../xml.js";

/** Minimal stock item */
export function envelopeStockItem_createMinimal({ companyName, name, parent, baseUnits }) {
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
          <STOCKITEM NAME="${xs(name)}" Action="Create">
            <NAME>${xs(name)}</NAME>
            <PARENT>${xs(parent)}</PARENT>
            <BASEUNITS>${xs(baseUnits)}</BASEUNITS>
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Full GST / HSN stock item sample — pass arrays & rates from your code.
 */
export function envelopeStockItem_createFull({
  companyName,
  name,
  parent,
  baseUnits = "Nos",
  aliasNames = [],
  mailingNames = [],
  gstApplicable = "&#4; Applicable",
  gstTypeOfSupply = "Goods",
  hsnCode = "",
  gstDetails = [{ applicableFrom: "20170701", hsnCode: "", taxability: "Taxable", igstRate: "", cgstRate: "", sgstRate: "" }],
  openingBalance = "",
  openingRate = "",
  openingValue = "",
  standardPrice = { date: "", rate: "" },
  standardCost = { date: "", rate: "" },
}) {
  const nameList = aliasNames.length
    ? aliasNames.map((n) => `              <NAME>${xs(n)}</NAME>`).join("\n")
    : `              <NAME>${xs(name)}</NAME>`;
  const mailList = mailingNames.map((n) => `              <MAILINGNAME>${xs(n)}</MAILINGNAME>`).join("\n");

  const gstBlocks = gstDetails
    .map(
      (g) => `
            <GSTDETAILS.LIST>
              <APPLICABLEFROM>${xs(g.applicableFrom)}</APPLICABLEFROM>
              <HSNCODE>${xs(g.hsnCode ?? hsnCode)}</HSNCODE>
              <TAXABILITY>${xs(g.taxability)}</TAXABILITY>
              <IGSTRATE>${xs(g.igstRate)}</IGSTRATE>
              <CGSTRATE>${xs(g.cgstRate)}</CGSTRATE>
              <SGSTRATE>${xs(g.sgstRate)}</SGSTRATE>
            </GSTDETAILS.LIST>`
    )
    .join("");

  const stdPrice =
    standardPrice.date && standardPrice.rate
      ? `
            <STANDARDPRICELIST.LIST>
              <DATE>${xs(standardPrice.date)}</DATE>
              <RATE>${xs(standardPrice.rate)}</RATE>
            </STANDARDPRICELIST.LIST>`
      : "";

  const stdCost =
    standardCost.date && standardCost.rate
      ? `
            <STANDARDCOSTLIST.LIST>
              <DATE>${xs(standardCost.date)}</DATE>
              <RATE>${xs(standardCost.rate)}</RATE>
            </STANDARDCOSTLIST.LIST>`
      : "";

  const obBal = openingBalance ? `            <OPENINGBALANCE>${xs(openingBalance)}</OPENINGBALANCE>` : "";
  const obRate = openingRate ? `            <OPENINGRATE>${xs(openingRate)}</OPENINGRATE>` : "";
  const obVal = openingValue ? `            <OPENINGVALUE>${xs(openingValue)}</OPENINGVALUE>` : "";

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
          <STOCKITEM NAME="${xs(name)}" Action="Create">
            <NAME>${xs(name)}</NAME>
            <PARENT>${xs(parent)}</PARENT>
            <CATEGORY/>
            <BASEUNITS>${xs(baseUnits)}</BASEUNITS>
            <NAME.LIST TYPE="String">
${nameList}
            </NAME.LIST>
            <MAILINGNAME.LIST TYPE="String">
${mailList || `              <MAILINGNAME>${xs(name)}</MAILINGNAME>`}
            </MAILINGNAME.LIST>
            <GSTAPPLICABLE>${gstApplicable}</GSTAPPLICABLE>
            <GSTTYPEOFSUPPLY>${xs(gstTypeOfSupply)}</GSTTYPEOFSUPPLY>
            <HSNCODE>${xs(hsnCode)}</HSNCODE>
            ${gstBlocks}
            ${obBal}
            ${obRate}
            ${obVal}
            ${stdPrice}
            ${stdCost}
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeStockItem_readSingle({ companyName, name }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>StockItem</SUBTYPE>
    <ID TYPE="Name">${xs(name)}</ID>
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
        <FETCH>BaseUnits</FETCH>
        <FETCH>HSNCode</FETCH>
        <FETCH>OpeningBalance</FETCH>
        <FETCH>OpeningRate</FETCH>
        <FETCH>OpeningValue</FETCH>
        <FETCH>ClosingBalance</FETCH>
        <FETCH>ClosingRate</FETCH>
        <FETCH>ClosingValue</FETCH>
      </FETCHLIST>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeStockItem_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Stock Items</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Stock Items" ISINITIALIZE="Yes">
            <TYPE>StockItem</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>Parent</NATIVEMETHOD>
            <NATIVEMETHOD>BaseUnits</NATIVEMETHOD>
            <NATIVEMETHOD>HSNCode</NATIVEMETHOD>
            <NATIVEMETHOD>ClosingBalance</NATIVEMETHOD>
            <NATIVEMETHOD>ClosingValue</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeStockItem_update({
  companyName,
  name,
  parent,
  standardPriceDate,
  standardPriceRate,
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
          <STOCKITEM NAME="${xs(name)}" Action="Alter">
            <PARENT>${xs(parent)}</PARENT>
            <STANDARDPRICELIST.LIST>
              <DATE>${xs(standardPriceDate)}</DATE>
              <RATE>${xs(standardPriceRate)}</RATE>
            </STANDARDPRICELIST.LIST>
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeStockItem_delete({ companyName, name }) {
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
          <STOCKITEM NAME="${xs(name)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function stockItem_createMinimal(params) {
  return tallyPost(envelopeStockItem_createMinimal(params));
}

export async function stockItem_createFull(params) {
  return tallyPost(envelopeStockItem_createFull(params));
}

export async function stockItem_readSingle(params) {
  return tallyPost(envelopeStockItem_readSingle(params));
}

/** Strip empty Tally fields; keep only STOCKITEM records with data. */
export function extractStockItemReadAllXml(xml) {
  return extractTallyCollectionReadXml(xml, {
    recordTag: "STOCKITEM",
    omitKeys: ["LANGUAGENAME.LIST"],
  });
}

export async function stockItem_readAll(params) {
  const res = await tallyPost(envelopeStockItem_readAll(params));
  if (res.body) res.body = extractStockItemReadAllXml(res.body);
  return res;
}

export async function stockItem_update(params) {
  return tallyPost(envelopeStockItem_update(params));
}

export async function stockItem_delete(params) {
  return tallyPost(envelopeStockItem_delete(params));
}
