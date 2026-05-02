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

let publicConfig = { accountingApiBase: "" };

const chevronSvg = `<svg class="card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "company-card";
    btn.dataset.id = String(id);
    const tallyLine =
      c.tallyGuid || c.tallyCompanyNumber
        ? `Tally · ${escapeHtml(c.tallyCompanyNumber || "—")} · ${escapeHtml((c.tallyGuid || "").slice(0, 8))}…`
        : "Not linked to Tally";
    btn.innerHTML = `
      <div class="card-title">${escapeHtml(c.name)}</div>
      <p class="card-meta">${escapeHtml(c.desc || "No description")}</p>
      ${chevronSvg}
      <div class="card-detail">
        <div><strong>ID</strong> ${escapeHtml(id)}</div>
        <div><strong>Tally</strong> ${tallyLine}</div>
        ${c.tallyBooksFrom ? `<div><strong>Books from</strong> ${escapeHtml(c.tallyBooksFrom)}</div>` : ""}
      </div>
    `;
    btn.addEventListener("click", () => btn.classList.toggle("is-open"));
    dashDbCompanies.appendChild(btn);
  }
}

function renderTallyCompanies(tallyResult, dbCompanies) {
  dashTallyCompanies.innerHTML = "";
  const dbGuids = new Set(dbCompanies.map((c) => c.tallyGuid).filter(Boolean));

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

  dashTallyEmpty.hidden = true;

  for (const c of list) {
    const guid = c.guid || "";
    const added = guid && dbGuids.has(guid);
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
        ${
          added
            ? `<span class="badge">In your database</span>`
            : `<button type="button" class="primary js-add-tally" data-guid="${escapeHtml(guid)}">Add to database</button>`
        }
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

init();
