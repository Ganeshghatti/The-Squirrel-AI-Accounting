import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Store from "electron-store";
import { settings_listCompaniesLoaded } from "../tally-xml-client/settings/crud.js";
import { ledger_readAll, ledger_createFull } from "../tally-xml-client/ledger/crud.js";
import { stockItem_readAll, stockItem_createFull } from "../tally-xml-client/stock-item/crud.js";
import { unit_readAll } from "../tally-xml-client/unit/crud.js";
import { voucher_readDayBook, voucher_createPurchase } from "../tally-xml-client/voucher/crud.js";
import { stockGroup_create } from "../tally-xml-client/stock-group/crud.js";

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

ipcMain.handle("tally:listCompanies", async () => {
  try {
    return await settings_listCompaniesLoaded();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tally request failed";
    return {
      ok: false,
      httpStatus: 0,
      tallyStatus: null,
      companies: [],
      rawBody: "",
      error: message,
    };
  }
});

ipcMain.handle("tally:readLedgers", async (_e, { companyName }) => {
  try {
    return await ledger_readAll({ companyName });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

ipcMain.handle("tally:readStockItems", async (_e, { companyName }) => {
  try {
    return await stockItem_readAll({ companyName });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

ipcMain.handle("tally:readUnits", async (_e, { companyName }) => {
  try {
    return await unit_readAll({ companyName });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

ipcMain.handle("tally:readDayBook", async (_e, { companyName, fromDate, toDate }) => {
  try {
    return await voucher_readDayBook({ companyName, fromDate, toDate });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

ipcMain.handle("tally:createLedger", async (_e, { companyName, params }) => {
  try {
    return await ledger_createFull({ companyName, ...params });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

ipcMain.handle("tally:createStockCategory", async (_e, { companyName, params }) => {
  try {
    return await stockGroup_create({ companyName, ...params });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

ipcMain.handle("tally:createStockItem", async (_e, { companyName, params }) => {
  try {
    return await stockItem_createFull({ companyName, name: params.name, parent: params.parent, baseUnits: params.base_units, ...params });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

ipcMain.handle("tally:createPurchaseVoucher", async (_e, { companyName, params }) => {
  try {
    return await voucher_createPurchase({ companyName, ...params });
  } catch (e) {
    return { ok: false, body: "", error: e instanceof Error ? e.message : "Tally request failed" };
  }
});

/**
 * Authenticated JSON request to ACCOUNTING_API_BASE (path must start with /).
 * @param {{ method?: string, path: string, body?: object }} opts
 */
ipcMain.handle("api:request", async (_event, opts) => {
  const key = authStore.get("apiKey");
  const method = (opts?.method || "GET").toUpperCase();
  const reqPath = String(opts?.path || "");
  if (!reqPath.startsWith("/")) {
    return { ok: false, status: 0, data: { error: "path must start with /" } };
  }
  if (!key) {
    return { ok: false, status: 401, data: { error: "Not signed in" } };
  }
  try {
    const url = `${defaultAccountingBase}${reqPath}`;
    const headers = { "X-API-Key": key };
    /** @type {RequestInit} */
    const init = { method, headers };
    if (opts?.body !== undefined && method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, init);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return { ok: false, status: 0, data: { error: message } };
  }
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
