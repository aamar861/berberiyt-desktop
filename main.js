const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("node:path");

// The desktop app is a thin native shell around the live site, so it always
// talks to the same Supabase database as the web. BERBERIYT_URL lets us point
// it at localhost while developing.
const APP_URL = process.env.BERBERIYT_URL || "https://berberiyt.com";
const APP_HOST = new URL(APP_URL).host;

// Supabase auth (Google/magic links) and any future payment provider open in
// the system browser instead of a trapped popup window.
const ALLOWED_HOSTS = new Set([APP_HOST]);

let mainWindow = null;

function isInternal(targetUrl) {
  try {
    return ALLOWED_HOSTS.has(new URL(targetUrl).host);
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 560,
    show: false,
    backgroundColor: "#000000",
    title: "BerberiYt",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Keep the window titled "BerberiYt" instead of adopting the page's full
  // SEO title ("BerberiYt — Platforma për rezervime …").
  mainWindow.on("page-title-updated", (event) => event.preventDefault());

  // Target="_blank" and window.open go to the default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Keep in-app navigation on our own domain; send everything else outside.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isInternal(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // No connection (or the site is down) — show a local fallback with a retry.
  mainWindow.webContents.on("did-fail-load", (_e, errorCode, _desc, failedUrl, isMainFrame) => {
    // -3 is ERR_ABORTED, which fires on ordinary client-side navigations.
    if (!isMainFrame || errorCode === -3) return;
    if (failedUrl && failedUrl.startsWith("file://")) return;
    mainWindow.loadFile(path.join(__dirname, "offline.html"));
  });

  mainWindow.loadURL(APP_URL);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: "BerberiYt",
            submenu: [
              { role: "about", label: "Rreth BerberiYt" },
              { type: "separator" },
              { role: "hide", label: "Fshih BerberiYt" },
              { role: "hideOthers", label: "Fshih të tjerat" },
              { role: "unhide", label: "Shfaq të gjitha" },
              { type: "separator" },
              { role: "quit", label: "Dil nga BerberiYt" },
            ],
          },
        ]
      : []),
    {
      label: "Skedari",
      submenu: [
        {
          label: "Ballina",
          accelerator: "CmdOrCtrl+H",
          click: () => mainWindow && mainWindow.loadURL(APP_URL),
        },
        { type: "separator" },
        isMac ? { role: "close", label: "Mbyll dritaren" } : { role: "quit", label: "Dil" },
      ],
    },
    {
      label: "Ndrysho",
      submenu: [
        { role: "undo", label: "Zhbëj" },
        { role: "redo", label: "Ribëj" },
        { type: "separator" },
        { role: "cut", label: "Preje" },
        { role: "copy", label: "Kopjo" },
        { role: "paste", label: "Ngjit" },
        { role: "selectAll", label: "Zgjidh të gjitha" },
      ],
    },
    {
      label: "Pamja",
      submenu: [
        { role: "reload", label: "Rifresko" },
        { role: "forceReload", label: "Rifresko plotësisht" },
        { type: "separator" },
        { role: "resetZoom", label: "Zmadhimi normal" },
        { role: "zoomIn", label: "Zmadho" },
        { role: "zoomOut", label: "Zvogëlo" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Ekran i plotë" },
      ],
    },
    {
      label: "Ndihmë",
      submenu: [
        {
          label: "Hap berberiyt.com në shfletues",
          click: () => shell.openExternal(APP_URL),
        },
        {
          label: "Rreth",
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Rreth BerberiYt",
              message: `BerberiYt ${app.getVersion()}`,
              detail: "Rezervime online për berbershopet e Kosovës.\nberberiyt.com",
              buttons: ["Në rregull"],
            }),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// A second launch focuses the existing window instead of opening a new app.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    buildMenu();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
