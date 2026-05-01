import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Store from "electron-store";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const defaultAccountingBase =
  process.env.ACCOUNTING_API_BASE?.trim().replace(/\/$/, "") || "http://localhost:4000";

/** Only the API key is persisted. The server URL always comes from ACCOUNTING_API_BASE in .env */
const authStore = new Store({
  name: "auth",
  defaults: {
    apiKey: "",
  },
});

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 720,
    minHeight: 520,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  // Developer console (unpackaged runs, e.g. npm run dev)
  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("app:getPublicConfig", () => ({
  accountingApiBase: defaultAccountingBase,
  tallyApiBase: process.env.TALLY_API_BASE?.trim() || "http://localhost:9000",
}));

ipcMain.handle("auth:get", () => ({
  apiKey: authStore.get("apiKey"),
}));

ipcMain.handle("auth:set", (_event, { apiKey }) => {
  if (typeof apiKey === "string") {
    authStore.set("apiKey", apiKey.trim());
  }
});

ipcMain.handle("auth:clear", () => {
  authStore.set("apiKey", "");
});

ipcMain.handle("api:validate", async (_event, { apiKey }) => {
  const key = String(apiKey || "").trim();
  if (!key) {
    return { ok: false, error: "API key is required" };
  }
  try {
    const url = `${defaultAccountingBase}/api/auth/validate`;
    const res = await fetch(url, {
      headers: { "X-API-Key": key },
    });
    if (res.status === 401) {
      return { ok: false, error: "Invalid or expired API key" };
    }
    if (!res.ok) {
      return { ok: false, error: `Server returned ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: message };
  }
});
