import { tallyPost } from "../client.js";
import { extractTallyVoucherDayBookXml, xs } from "../xml.js";

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

/** Strip empty Tally fields; keep only VOUCHER nodes with data (Day Book export). */
export function extractVoucherDayBookXml(xml) {
  return extractTallyVoucherDayBookXml(xml);
}

export async function voucher_readDayBook(params) {
  const res = await tallyPost(envelopeVoucher_readDayBook(params));
  if (res.body) res.body = extractVoucherDayBookXml(res.body);
  return res;
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

export function envelopeVoucher_createPurchase({
  companyName,
  voucher_mode = "item_invoice",
  posting_date,
  supplier_invoice_number,
  supplier_invoice_date,
  party_ledger,
  item_entries = [],
  accounting_entries = [],
  tax_entries = [],
  additional_charges = [],
  grand_total,
  bill_type = "New Ref",
  narration = "",
}) {
  const fmt = (n) => Math.abs(Number(n)).toFixed(2);

  let inventoryXml = "";
  if (voucher_mode === "item_invoice") {
    for (const item of item_entries) {
      inventoryXml += `
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${xs(item.stock_item_name)}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <ACTUALQTY>${xs(String(item.quantity))} ${xs(item.unit)}</ACTUALQTY>
            <BILLEDQTY>${xs(String(item.quantity))} ${xs(item.unit)}</BILLEDQTY>
            <RATE>${xs(String(item.rate))}/${xs(item.unit)}</RATE>
            <AMOUNT>-${xs(fmt(item.amount))}</AMOUNT>
            <ACCOUNTINGALLOCATIONS.LIST>
              <LEDGERNAME>${xs(item.purchase_ledger || "Purchase")}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-${xs(fmt(item.amount))}</AMOUNT>
            </ACCOUNTINGALLOCATIONS.LIST>
          </ALLINVENTORYENTRIES.LIST>`;
    }
  }

  let ledgerXml = "";

  if (voucher_mode === "accounting_invoice") {
    for (const ae of accounting_entries) {
      ledgerXml += `
          <LEDGERENTRIES.LIST>
            <LEDGERNAME>${xs(ae.ledger_name)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>-${xs(fmt(ae.amount))}</AMOUNT>
          </LEDGERENTRIES.LIST>`;
    }
  }

  for (const tax of tax_entries) {
    ledgerXml += `
          <LEDGERENTRIES.LIST>
            <LEDGERNAME>${xs(tax.ledger_name)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>-${xs(fmt(tax.amount))}</AMOUNT>
          </LEDGERENTRIES.LIST>`;
  }

  for (const ac of additional_charges) {
    const isCredit = Number(ac.amount) < 0;
    ledgerXml += `
          <LEDGERENTRIES.LIST>
            <LEDGERNAME>${xs(ac.ledger_name)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>${isCredit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
            <AMOUNT>${isCredit ? "" : "-"}${xs(fmt(ac.amount))}</AMOUNT>
          </LEDGERENTRIES.LIST>`;
  }

  ledgerXml += `
          <LEDGERENTRIES.LIST>
            <LEDGERNAME>${xs(party_ledger)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>${xs(fmt(grand_total))}</AMOUNT>
            <BILLALLOCATIONS.LIST>
              <NAME>${xs(supplier_invoice_number)}</NAME>
              <BILLTYPE>${xs(bill_type)}</BILLTYPE>
              <AMOUNT>${xs(fmt(grand_total))}</AMOUNT>
            </BILLALLOCATIONS.LIST>
          </LEDGERENTRIES.LIST>`;

  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${xs(posting_date)}</DATE>
            <NARRATION>${xs(narration)}</NARRATION>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <REFERENCE>${xs(supplier_invoice_number)}</REFERENCE>
            <REFERENCEDATE>${xs(supplier_invoice_date)}</REFERENCEDATE>
            <PARTYLEDGERNAME>${xs(party_ledger)}</PARTYLEDGERNAME>
            <ISINVOICE>Yes</ISINVOICE>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            ${inventoryXml}
            ${ledgerXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function voucher_createPurchase(params) {
  return tallyPost(envelopeVoucher_createPurchase(params));
}
