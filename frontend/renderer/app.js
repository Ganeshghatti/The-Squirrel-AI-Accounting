const loginScreen = document.getElementById("screen-login");
const appScreen = document.getElementById("screen-app");
const formLogin = document.getElementById("form-login");
const loginServerHint = document.getElementById("login-server-hint");
const inputApiKey = document.getElementById("input-api-key");
const loginError = document.getElementById("login-error");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const dashboardStatus = document.getElementById("dashboard-status");
const dashDbCompanies = document.getElementById("dash-db-companies");
const dashDbEmpty = document.getElementById("dash-db-empty");
const dashTallyCompanies = document.getElementById("dash-tally-companies");
const dashTallyEmpty = document.getElementById("dash-tally-empty");
const viewHome = document.getElementById("view-home");
const viewCompany = document.getElementById("view-company");
const mainTitle = document.getElementById("main-title");
const btnCompanyBack = document.getElementById("btn-company-back");
const navHome = document.querySelector('nav .nav-item[data-view="home"]');
const companyPageMsg = document.getElementById("company-page-msg");
const companyPageDesc = document.getElementById("company-page-desc");
const companyPageTally = document.getElementById("company-page-tally");
const companyMailboxesList = document.getElementById("company-mailboxes-list");
const companyMailboxesEmpty = document.getElementById("company-mailboxes-empty");
const formMailboxConnect = document.getElementById("form-mailbox-connect");
const modalMailbox = document.getElementById("modal-mailbox");
const modalMailboxBackdrop = document.getElementById("modal-mailbox-backdrop");
const modalMailboxSummary = document.getElementById("modal-mailbox-summary");
const btnModalMailboxClose = document.getElementById("btn-modal-mailbox-close");
const btnModalMailboxCancel = document.getElementById("btn-modal-mailbox-cancel");
const btnAddMailbox = document.getElementById("btn-add-mailbox");
const btnAnalyze = document.getElementById("btn-analyze");
const inputFromDate = document.getElementById("input-from-date");
const inputToDate = document.getElementById("input-to-date");

const MAILBOX_ERR_IDS = {
  emailAddress: "mailbox-err-email",
  imapHost: "mailbox-err-imapHost",
  imapPort: "mailbox-err-imapPort",
  username: "mailbox-err-username",
  password: "mailbox-err-password",
};

const MAILBOX_VALIDATE_FIELD_ORDER = ["emailAddress", "imapHost", "imapPort", "username", "password"];

let publicConfig = { accountingApiBase: "" };
/** @type {string | null} */
let currentCompanyId = null;
/** @type {object | null} */
let currentCompany = null;
/** Lowercased emails already connected for the open company (duplicate check). */
let connectedMailboxEmails = new Set();

const chevronSvg = `<svg class="card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeCompanyName(s) {
  if (s == null || s === "") return "";
  return String(s).trim().replace(/\s+/g, " ").toLowerCase();
}

/** True if this Tally row is already represented in the DB (same GUID or same display name). */
function isTallyCompanyAlreadyInDb(tallyCo, dbCompanies) {
  const guid = (tallyCo.guid || "").trim();
  if (guid && dbCompanies.some((d) => d.tallyGuid && String(d.tallyGuid).trim() === guid)) {
    return true;
  }
  const tallyName = normalizeCompanyName(tallyCo.name || tallyCo.nameAttr);
  if (!tallyName) return false;
  return dbCompanies.some((d) => normalizeCompanyName(d.name) === tallyName);
}

function showLogin() {
  loginScreen.hidden = false;
  appScreen.hidden = true;
}

function showApp() {
  loginScreen.hidden = true;
  appScreen.hidden = false;
}

function setLoginError(message) {
  if (!message) {
    loginError.hidden = true;
    loginError.textContent = "";
    return;
  }
  loginError.hidden = false;
  loginError.textContent = message;
}

function setDashboardStatus(message, isError) {
  if (!message) {
    dashboardStatus.hidden = true;
    dashboardStatus.textContent = "";
    return;
  }
  dashboardStatus.hidden = false;
  dashboardStatus.textContent = message;
  dashboardStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function setCompanyPageMsg(message, kind) {
  if (!message) {
    companyPageMsg.hidden = true;
    companyPageMsg.textContent = "";
    companyPageMsg.classList.remove("is-error", "is-ok");
    return;
  }
  companyPageMsg.hidden = false;
  companyPageMsg.textContent = message;
  companyPageMsg.classList.toggle("is-error", kind === "error");
  companyPageMsg.classList.toggle("is-ok", kind === "ok");
}

function showDashboard() {
  closeMailboxModal();
  currentCompanyId = null;
  currentCompany = null;
  connectedMailboxEmails = new Set();
  viewHome.hidden = false;
  viewCompany.hidden = true;
  btnCompanyBack.hidden = true;
  mainTitle.textContent = "Dashboard";
  navHome?.classList.add("active");
  setCompanyPageMsg("", "");
  loadDashboard();
}

/**
 * @param {string} companyId
 */
function showCompanyPage(companyId) {
  closeMailboxModal();
  currentCompanyId = companyId;
  viewHome.hidden = true;
  viewCompany.hidden = false;
  btnCompanyBack.hidden = false;
  navHome?.classList.remove("active");
  mainTitle.textContent = "…";
  setCompanyPageMsg("", "");
  loadCompanyDetail(companyId);
}

function clearMailboxFormErrors() {
  modalMailboxSummary.hidden = true;
  modalMailboxSummary.textContent = "";
  for (const name of MAILBOX_VALIDATE_FIELD_ORDER) {
    const errId = MAILBOX_ERR_IDS[name];
    const el = errId ? document.getElementById(errId) : null;
    if (el) {
      el.hidden = true;
      el.textContent = "";
    }
    const input = formMailboxConnect?.querySelector(`[name="${name}"]`);
    if (input) input.classList.remove("input-invalid");
  }
}

function setMailboxFieldError(field, message) {
  const errId = MAILBOX_ERR_IDS[field];
  const el = errId ? document.getElementById(errId) : null;
  const input = formMailboxConnect?.querySelector(`[name="${field}"]`);
  if (el) {
    el.textContent = message;
    el.hidden = !message;
  }
  if (input) input.classList.toggle("input-invalid", !!message);
}

/**
 * @param {object} body
 * @param {string} body.label
 * @param {string} body.emailAddress
 * @param {string} body.imapHost
 * @param {number} body.imapPort
 * @param {boolean} body.tls
 * @param {string} body.username
 * @param {string} body.password
 */
function validateMailboxPayload(body) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (body.label.length > 120) {
    errors.label = "Label must be 120 characters or less.";
  }

  const email = body.emailAddress.trim();
  if (!email) errors.emailAddress = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.emailAddress = "Enter a valid email address.";
  } else if (connectedMailboxEmails.has(email.toLowerCase())) {
    errors.emailAddress = "This email is already connected for this company.";
  }

  const host = body.imapHost.trim();
  if (!host) errors.imapHost = "IMAP host is required.";
  else if (/\s/.test(host)) errors.imapHost = "Host cannot contain spaces.";
  else if (host.length > 253) errors.imapHost = "Host is too long.";

  if (!Number.isInteger(body.imapPort) || body.imapPort < 1 || body.imapPort > 65535) {
    errors.imapPort = "Port must be a whole number between 1 and 65535.";
  }

  const user = body.username.trim();
  if (!user) errors.username = "Username is required.";

  if (!body.password) errors.password = "Password is required.";

  return errors;
}

function showMailboxValidationErrors(errors) {
  clearMailboxFormErrors();
  for (const [key, msg] of Object.entries(errors)) {
    if (MAILBOX_ERR_IDS[key]) setMailboxFieldError(key, msg);
  }
  if (errors.label) {
    modalMailboxSummary.textContent = errors.label;
    modalMailboxSummary.hidden = false;
  } else if (Object.keys(errors).length) {
    const n = Object.keys(errors).length;
    modalMailboxSummary.textContent = `Fix the highlighted field${n > 1 ? "s" : ""} (${n} issue${n > 1 ? "s" : ""}).`;
    modalMailboxSummary.hidden = false;
  }
  for (const k of MAILBOX_VALIDATE_FIELD_ORDER) {
    if (errors[k]) {
      formMailboxConnect?.querySelector(`[name="${k}"]`)?.focus();
      break;
    }
  }
}

function openMailboxModal() {
  if (!modalMailbox || !formMailboxConnect) return;
  clearMailboxFormErrors();
  formMailboxConnect.reset();
  const portInput = formMailboxConnect.querySelector('[name="imapPort"]');
  if (portInput) portInput.value = "993";
  const tlsInput = formMailboxConnect.querySelector('[name="tls"]');
  if (tlsInput) tlsInput.checked = true;
  modalMailbox.hidden = false;
  modalMailbox.setAttribute("aria-hidden", "false");
  queueMicrotask(() => formMailboxConnect.querySelector('[name="emailAddress"]')?.focus());
}

function closeMailboxModal() {
  if (!modalMailbox) return;
  modalMailbox.hidden = true;
  modalMailbox.setAttribute("aria-hidden", "true");
  clearMailboxFormErrors();
  formMailboxConnect?.reset();
}

async function loadCompanyDetail(companyId) {
  const auth = window.appAuth;
  if (!auth?.apiRequest) return;

  companyMailboxesList.innerHTML = "";
  companyPageDesc.textContent = "";
  companyPageTally.hidden = true;

  const res = await auth.apiRequest({ method: "GET", path: `/api/companies/${companyId}` });
  if (!res.ok) {
    const err = res.data?.error || `Could not load company (HTTP ${res.status})`;
    setCompanyPageMsg(err, "error");
    mainTitle.textContent = "Company";
    return;
  }

  const c = res.data;
  currentCompany = c;
  mainTitle.textContent = c.name || "Company";
  companyPageDesc.textContent = c.desc?.trim() ? c.desc : "No description.";

  if (c.tallyGuid || c.tallyCompanyNumber) {
    companyPageTally.hidden = false;
    companyPageTally.textContent = [
      c.tallyCompanyNumber ? `Tally #${c.tallyCompanyNumber}` : "",
      c.tallyGuid ? `GUID ${c.tallyGuid}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const mailboxes = Array.isArray(c.connectedMailboxes) ? c.connectedMailboxes : [];
  connectedMailboxEmails = new Set(
    mailboxes.map((m) => (m.emailAddress || "").trim().toLowerCase()).filter(Boolean)
  );
  renderCompanyMailboxes(mailboxes);
}

function renderCompanyMailboxes(mailboxes) {
  companyMailboxesList.innerHTML = "";
  if (!mailboxes.length) {
    companyMailboxesEmpty.hidden = false;
    return;
  }
  companyMailboxesEmpty.hidden = true;

  for (const m of mailboxes) {
    const row = document.createElement("div");
    row.className = "mailbox-row";
    const email = m.emailAddress || "—";
    const label = m.label?.trim();
    const sub = [
      label ? `Label: ${label}` : "",
      `${m.imapHost || "—"}:${m.imapPort ?? "—"}`,
      m.tls === false ? "TLS off" : "TLS on",
    ]
      .filter(Boolean)
      .join(" · ");
    row.innerHTML = `
      <label class="mailbox-radio-label">
        <input type="radio" name="selected-mailbox" value="${escapeHtml(m._id)}" class="mailbox-radio" />
      </label>
      <div class="mailbox-row-info">
        <div class="mailbox-row-title">${escapeHtml(email)}</div>
        <p class="mailbox-row-meta">${escapeHtml(sub)}</p>
      </div>
    `;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost btn-small-ghost";
    del.textContent = "Disconnect";
    del.addEventListener("click", async () => {
      if (!currentCompanyId || !m._id) return;
      del.disabled = true;
      const res = await window.appAuth.apiRequest({
        method: "DELETE",
        path: `/api/companies/${currentCompanyId}/mailboxes/${m._id}`,
      });
      if (!res.ok) {
        setCompanyPageMsg(res.data?.error || `HTTP ${res.status}`, "error");
        del.disabled = false;
        return;
      }
      setCompanyPageMsg("Mailbox disconnected.", "ok");
      await loadCompanyDetail(currentCompanyId);
    });
    row.appendChild(del);
    companyMailboxesList.appendChild(row);
  }
}

function stripEmptyXmlTags(xml) {
  if (typeof xml !== "string") return "";
  return xml
    .replace(/<[A-Z][A-Z0-9.]*\/>/g, "")
    .replace(/<[A-Z][A-Z0-9.]*><\/[A-Z][A-Z0-9.]*>/g, "");
}

async function handleAnalyze() {
  const radio = companyMailboxesList.querySelector('input[name="selected-mailbox"]:checked');
  if (!radio) {
    setCompanyPageMsg("Select a mailbox first.", "error");
    return;
  }
  if (!inputFromDate.value || !inputToDate.value) {
    setCompanyPageMsg("Both dates are required.", "error");
    return;
  }

  const fromTally = inputFromDate.value.slice(0, 10).replace(/-/g, "");
  const toTally = inputToDate.value.slice(0, 10).replace(/-/g, "");
  const companyName = currentCompany?.tallyReservedName || currentCompany?.name || "";

  btnAnalyze.disabled = true;
  setCompanyPageMsg("Fetching Tally data…", "");

  const [ledgerRes, stockItemRes, unitRes, voucherRes] = await Promise.all([
    window.appAuth.tallyReadLedgers({ companyName }),
    window.appAuth.tallyReadStockItems({ companyName }),
    window.appAuth.tallyReadUnits({ companyName }),
    window.appAuth.tallyReadDayBook({ companyName, fromDate: fromTally, toDate: toTally }),
  ]);

  setCompanyPageMsg("Sending to backend…", "");

  const res = await window.appAuth.apiRequest({
    method: "POST",
    path: `/api/companies/${currentCompanyId}/analyze`,
    body: {
      mailboxId: radio.value,
      fromDate: inputFromDate.value.slice(0, 10),
      toDate: inputToDate.value.slice(0, 10),
      ledgerXml: stripEmptyXmlTags(ledgerRes?.body),
      stockItemXml: stripEmptyXmlTags(stockItemRes?.body),
      unitXml: stripEmptyXmlTags(unitRes?.body),
      voucherXml: stripEmptyXmlTags(voucherRes?.body),
    },
  });

  btnAnalyze.disabled = false;
  if (res.ok) {
    setCompanyPageMsg(`Analysis complete. ${res.data?.emailCount ?? 0} emails fetched.`, "ok");
  } else {
    setCompanyPageMsg(res.data?.error || `Analysis failed (HTTP ${res.status})`, "error");
  }
}

async function refreshPublicConfig() {
  const auth = window.appAuth;
  if (auth?.getPublicConfig) {
    publicConfig = await auth.getPublicConfig();
  }
  if (loginServerHint) {
    loginServerHint.textContent = `Server URL is configured in .env (${publicConfig.accountingApiBase || "—"}). Enter your API key below.`;
  }
}

function renderDbCompanies(companies) {
  dashDbCompanies.innerHTML = "";
  if (!companies.length) {
    dashDbEmpty.hidden = false;
    return;
  }
  dashDbEmpty.hidden = true;

  for (const c of companies) {
    const id = c._id ?? c.id;
    if (!id) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "company-card";
    btn.innerHTML = `
      <div class="card-title">${escapeHtml(c.name)}</div>
      <p class="card-meta">${escapeHtml(c.desc || "No description")}</p>
      ${chevronSvg}
    `;
    btn.addEventListener("click", () => showCompanyPage(String(id)));
    dashDbCompanies.appendChild(btn);
  }
}

function renderTallyCompanies(tallyResult, dbCompanies) {
  dashTallyCompanies.innerHTML = "";

  if (!tallyResult.ok) {
    dashTallyEmpty.hidden = false;
    dashTallyEmpty.textContent =
      tallyResult.error ||
      "Could not load Tally companies. Is Tally running with the XML server (see TALLY_API_BASE in .env)?";
    return;
  }

  const list = tallyResult.companies || [];
  if (!list.length) {
    dashTallyEmpty.hidden = false;
    dashTallyEmpty.textContent = "Tally returned no companies (or none are loaded).";
    return;
  }

  const toShow = list.filter((c) => !isTallyCompanyAlreadyInDb(c, dbCompanies));
  if (!toShow.length) {
    dashTallyEmpty.hidden = false;
    dashTallyEmpty.textContent =
      "No new companies to add — every Tally company here already matches one in your database.";
    return;
  }

  dashTallyEmpty.hidden = true;

  for (const c of toShow) {
    const guid = c.guid || "";
    const wrap = document.createElement("div");
    wrap.className = "company-card tally-card";
    const meta = [
      c.companyNumber ? `#${escapeHtml(c.companyNumber)}` : "",
      c.booksFrom ? `Books ${escapeHtml(c.booksFrom)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    wrap.innerHTML = `
      <div class="card-title">${escapeHtml(c.name || c.nameAttr || "—")}</div>
      <p class="card-meta">${meta || "Tally company"}</p>
      ${guid ? `<p class="card-meta" style="margin-top:6px">GUID ${escapeHtml(guid)}</p>` : ""}
      <div class="card-actions">
        <button type="button" class="primary js-add-tally">Add to database</button>
      </div>
    `;

    const addBtn = wrap.querySelector(".js-add-tally");
    if (addBtn) {
      addBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        addBtn.disabled = true;
        const body = {
          name: c.name || c.nameAttr,
          desc: "Imported from Tally",
          tallyGuid: c.guid || "",
          tallyCompanyNumber: c.companyNumber || "",
          tallyReservedName: c.reservedName || "",
          tallyBooksFrom: c.booksFrom || "",
          tallyStartingFrom: c.startingFrom || "",
          tallyEndingAt: c.endingAt || "",
        };
        const res = await window.appAuth.apiRequest({
          method: "POST",
          path: "/api/companies",
          body,
        });
        if (!res.ok) {
          const err = res.data?.error || `HTTP ${res.status}`;
          setDashboardStatus(err, true);
          addBtn.disabled = false;
          return;
        }
        setDashboardStatus(`Added “${body.name}” to your database.`, false);
        await loadDashboard();
      });
    }

    dashTallyCompanies.appendChild(wrap);
  }
}

async function loadDashboard() {
  const auth = window.appAuth;
  if (!auth?.apiRequest || !auth?.tallyListCompanies) return;

  setDashboardStatus("Loading…", false);
  dashDbCompanies.innerHTML = "";
  dashTallyCompanies.innerHTML = "";
  dashDbEmpty.hidden = true;
  dashTallyEmpty.hidden = true;

  const [apiRes, tallyRes] = await Promise.all([
    auth.apiRequest({ method: "GET", path: "/api/companies" }),
    auth.tallyListCompanies(),
  ]);

  let dbCompanies = [];
  if (!apiRes.ok) {
    setDashboardStatus(apiRes.data?.error || `Could not load companies (HTTP ${apiRes.status})`, true);
  } else if (Array.isArray(apiRes.data)) {
    dbCompanies = apiRes.data;
    setDashboardStatus("", false);
  } else {
    setDashboardStatus("Unexpected response from server.", true);
  }

  renderDbCompanies(dbCompanies);
  renderTallyCompanies(tallyRes, dbCompanies);
}

async function init() {
  const auth = window.appAuth;
  if (!auth) {
    setLoginError("Electron preload failed to load.");
    showLogin();
    return;
  }

  await refreshPublicConfig();

  const saved = await auth.get();

  if (saved.apiKey) {
    const check = await auth.validate({ apiKey: saved.apiKey });
    if (check.ok) {
      inputApiKey.value = "";
      showApp();
      await loadDashboard();
      return;
    }
    await auth.clear();
  }

  inputApiKey.value = "";
  showLogin();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoginError("");
  if (!window.appAuth) {
    setLoginError("Electron preload failed to load.");
    return;
  }
  const apiKey = inputApiKey.value.trim();
  btnLogin.disabled = true;

  const result = await window.appAuth.validate({ apiKey });

  if (!result.ok) {
    setLoginError(result.error || "Could not connect");
    btnLogin.disabled = false;
    return;
  }

  await window.appAuth.set({ apiKey });
  inputApiKey.value = "";
  await refreshPublicConfig();
  showApp();
  btnLogin.disabled = false;
  await loadDashboard();
});

btnLogout.addEventListener("click", async () => {
  await window.appAuth.clear();
  showLogin();
  await refreshPublicConfig();
});

btnCompanyBack.addEventListener("click", () => showDashboard());

navHome?.addEventListener("click", () => showDashboard());

btnAddMailbox?.addEventListener("click", () => openMailboxModal());
btnAnalyze?.addEventListener("click", handleAnalyze);
btnModalMailboxClose?.addEventListener("click", () => closeMailboxModal());
btnModalMailboxCancel?.addEventListener("click", () => closeMailboxModal());
modalMailboxBackdrop?.addEventListener("click", () => closeMailboxModal());

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !modalMailbox || modalMailbox.hidden) return;
  e.preventDefault();
  closeMailboxModal();
});

formMailboxConnect?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentCompanyId) return;
  setCompanyPageMsg("", "");

  const fd = new FormData(formMailboxConnect);
  const rawPort = fd.get("imapPort");
  const parsedPort = parseInt(String(rawPort ?? ""), 10);

  const body = {
    label: String(fd.get("label") || "").trim(),
    emailAddress: String(fd.get("emailAddress") || "").trim(),
    imapHost: String(fd.get("imapHost") || "").trim(),
    imapPort: Number.isFinite(parsedPort) ? parsedPort : NaN,
    tls: fd.get("tls") === "on",
    username: String(fd.get("username") || "").trim(),
    password: String(fd.get("password") || ""),
  };

  const errors = validateMailboxPayload(body);
  if (Object.keys(errors).length) {
    showMailboxValidationErrors(errors);
    return;
  }

  const submitBtn = formMailboxConnect.querySelector(".btn-mailbox-submit");
  if (submitBtn) submitBtn.disabled = true;
  const res = await window.appAuth.apiRequest({
    method: "POST",
    path: `/api/companies/${currentCompanyId}/mailboxes`,
    body: {
      label: body.label,
      emailAddress: body.emailAddress.trim(),
      imapHost: body.imapHost.trim(),
      imapPort: body.imapPort,
      tls: body.tls,
      username: body.username.trim(),
      password: body.password,
    },
  });
  if (submitBtn) submitBtn.disabled = false;
  if (!res.ok) {
    clearMailboxFormErrors();
    modalMailboxSummary.textContent = res.data?.error || `Request failed (HTTP ${res.status}).`;
    modalMailboxSummary.hidden = false;
    return;
  }
  closeMailboxModal();
  setCompanyPageMsg("Mailbox connected.", "ok");
  await loadCompanyDetail(currentCompanyId);
});

init();
