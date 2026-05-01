import { tallyPost } from "../client.js";
import { xs } from "../xml.js";

/**
 * Read voucher by Master ID / GUID style identifier (Postman generic).
 */
export function envelopeVoucher_readSingleByMasterId({ companyName, masterId }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>Voucher</SUBTYPE>
    <ID TYPE="Master ID">${xs(masterId)}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <FETCHLIST>
        <FETCH>Date</FETCH>
        <FETCH>VoucherTypeName</FETCH>
        <FETCH>VoucherNumber</FETCH>
        <FETCH>Reference</FETCH>
        <FETCH>Narration</FETCH>
        <FETCH>Amount</FETCH>
        <FETCH>PartyLedgerName</FETCH>
      </FETCHLIST>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeVoucher_readDayBook({ companyName, fromDate, toDate }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>DayBook</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVFROMDATE TYPE="Date">${xs(fromDate)}</SVFROMDATE>
        <SVTODATE TYPE="Date">${xs(toDate)}</SVTODATE>
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * @param {{ voucherTypeName?: string, filterFormula?: string }} p — override filter if needed (default Sales)
 */
export function envelopeVoucher_readSalesFiltered({
  companyName,
  fromDate,
  toDate,
  voucherTypeName = "Sales",
}) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Sales Vouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVFROMDATE TYPE="Date">${xs(fromDate)}</SVFROMDATE>
        <SVTODATE TYPE="Date">${xs(toDate)}</SVTODATE>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Sales Vouchers" ISINITIALIZE="Yes">
            <TYPE>Voucher</TYPE>
            <FILTER>IsSalesFilter</FILTER>
            <NATIVEMETHOD>MasterID</NATIVEMETHOD>
            <NATIVEMETHOD>Date</NATIVEMETHOD>
            <NATIVEMETHOD>VoucherNumber</NATIVEMETHOD>
            <NATIVEMETHOD>VoucherTypeName</NATIVEMETHOD>
            <NATIVEMETHOD>PartyLedgerName</NATIVEMETHOD>
            <NATIVEMETHOD>Amount</NATIVEMETHOD>
            <NATIVEMETHOD>Reference</NATIVEMETHOD>
          </COLLECTION>
          <SYSTEM TYPE="Formulae" NAME="IsSalesFilter">$VoucherTypeName = "${xs(voucherTypeName)}"</SYSTEM>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeVoucher_update({
  companyName,
  date,
  masterId,
  voucherTypeName,
  narration,
}) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Import</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Vouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </DESC>
    <DATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER DATE="${xs(date)}" TAGNAME="MASTER ID" TAGVALUE="${xs(masterId)}"
                 ACTION="Alter" VCHTYPE="${xs(voucherTypeName)}">
          <NARRATION>${xs(narration)}</NARRATION>
        </VOUCHER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeVoucher_cancel({
  companyName,
  date,
  masterId,
  voucherTypeName,
  narration,
}) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Import</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Vouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </DESC>
    <DATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER DATE="${xs(date)}" TAGNAME="MASTER ID" TAGVALUE="${xs(masterId)}"
                 ACTION="Cancel" VCHTYPE="${xs(voucherTypeName)}">
          <NARRATION>${xs(narration)}</NARRATION>
        </VOUCHER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeVoucher_deleteHard({
  companyName,
  date,
  masterId,
  voucherTypeName,
}) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Import</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Vouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </DESC>
    <DATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER DATE="${xs(date)}" TAGNAME="MASTER ID" TAGVALUE="${xs(masterId)}"
                 ACTION="Delete" VCHTYPE="${xs(voucherTypeName)}"/>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`;
}

export async function voucher_readSingleByMasterId(params) {
  return tallyPost(envelopeVoucher_readSingleByMasterId(params));
}

export async function voucher_readDayBook(params) {
  return tallyPost(envelopeVoucher_readDayBook(params));
}

export async function voucher_readSalesFiltered(params) {
  return tallyPost(envelopeVoucher_readSalesFiltered(params));
}

export async function voucher_update(params) {
  return tallyPost(envelopeVoucher_update(params));
}

export async function voucher_cancel(params) {
  return tallyPost(envelopeVoucher_cancel(params));
}

export async function voucher_deleteHard(params) {
  return tallyPost(envelopeVoucher_deleteHard(params));
}
