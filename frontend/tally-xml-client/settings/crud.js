import { tallyPost } from "../client.js";

/**
 * List companies loaded in Tally (onboarding — pick a name to store in your DB).
 */

export function envelopeListCompaniesLoaded() {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Companies</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVISCOMPFILTERREQUIRED>Yes</SVISCOMPFILTERREQUIRED>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Companies" ISINITIALIZE="Yes">
            <TYPE>Company</TYPE>
            <FETCH>Name</FETCH>
            <FETCH>StartingFrom</FETCH>
            <FETCH>EndingAt</FETCH>
            <FETCH>BooksFrom</FETCH>
            <FETCH>IsSelected</FETCH>
            <FETCH>IsLoaded</FETCH>
            <FETCH>CompanyNumber</FETCH>
            <FETCH>GUID</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export async function settings_listCompaniesLoaded() {
  return tallyPost(envelopeListCompaniesLoaded());
}
