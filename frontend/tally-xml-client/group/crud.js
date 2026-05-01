import { tallyPost } from "../client.js";
import { xs } from "../xml.js";

/**
 * @typedef {Object} GroupCtx
 * @property {string} [companyName] — Tally company (e.g. from your DB)
 * @property {string} groupName — Tally GROUP name
 */

export function envelopeGroup_create({
  companyName,
  groupName,
  parent,
  isSubLedger = "No",
  isBillWiseOn = "No",
  isCostCentresOn = "No",
  affectsGrossProfit = "No",
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
          <GROUP NAME="${xs(groupName)}" Action="Create">
            <NAME>${xs(groupName)}</NAME>
            <PARENT>${xs(parent)}</PARENT>
            <ISSUBLEDGER>${xs(isSubLedger)}</ISSUBLEDGER>
            <ISBILLWISEON>${xs(isBillWiseOn)}</ISBILLWISEON>
            <ISCOSTCENTRESON>${xs(isCostCentresOn)}</ISCOSTCENTRESON>
            <AFFECTSGROSSPROFIT>${xs(affectsGrossProfit)}</AFFECTSGROSSPROFIT>
          </GROUP>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeGroup_readSingle({ companyName, groupName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Object</TYPE>
    <SUBTYPE>Group</SUBTYPE>
    <ID TYPE="Name">${xs(groupName)}</ID>
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
        <FETCH>IsBillWiseOn</FETCH>
        <FETCH>IsCostCentresOn</FETCH>
        <FETCH>ClosingBalance</FETCH>
      </FETCHLIST>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeGroup_readAll({ companyName }) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Groups</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xs(companyName)}</SVCURRENTCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Groups" ISINITIALIZE="Yes">
            <TYPE>Group</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>Parent</NATIVEMETHOD>
            <NATIVEMETHOD>IsBillWiseOn</NATIVEMETHOD>
            <NATIVEMETHOD>IsRevenue</NATIVEMETHOD>
            <NATIVEMETHOD>IsDeemedPositive</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function envelopeGroup_update({
  companyName,
  groupName,
  parent,
  isBillWiseOn = "Yes",
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
          <GROUP NAME="${xs(groupName)}" Action="Alter">
            <PARENT>${xs(parent)}</PARENT>
            <ISBILLWISEON>${xs(isBillWiseOn)}</ISBILLWISEON>
          </GROUP>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function envelopeGroup_delete({ companyName, groupName }) {
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
          <GROUP NAME="${xs(groupName)}" Action="Delete"/>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function group_create(params) {
  return tallyPost(envelopeGroup_create(params));
}

export async function group_readSingle(params) {
  return tallyPost(envelopeGroup_readSingle(params));
}

export async function group_readAll(params) {
  return tallyPost(envelopeGroup_readAll(params));
}

export async function group_update(params) {
  return tallyPost(envelopeGroup_update(params));
}

export async function group_delete(params) {
  return tallyPost(envelopeGroup_delete(params));
}
