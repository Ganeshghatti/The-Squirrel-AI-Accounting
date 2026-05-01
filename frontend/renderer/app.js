const loginScreen = document.getElementById("screen-login");
const appScreen = document.getElementById("screen-app");
const formLogin = document.getElementById("form-login");
const loginServerHint = document.getElementById("login-server-hint");
const inputApiKey = document.getElementById("input-api-key");
const loginError = document.getElementById("login-error");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const sidebarApiBase = document.getElementById("sidebar-api-base");

let publicConfig = { accountingApiBase: "" };

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

async function refreshPublicConfig() {
  const auth = window.appAuth;
  if (auth?.getPublicConfig) {
    publicConfig = await auth.getPublicConfig();
  }
  if (loginServerHint) {
    loginServerHint.textContent = `Server URL is configured in .env (${publicConfig.accountingApiBase || "—"}). Enter your API key below.`;
  }
  sidebarApiBase.textContent = `API: ${publicConfig.accountingApiBase || "—"}`;
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
});

btnLogout.addEventListener("click", async () => {
  await window.appAuth.clear();
  showLogin();
  await refreshPublicConfig();
});

init();
