import * as path from "path";
import * as nodeRed from "./main_process/node_red";
import * as ApplicationMenu from "./main_process/application_menu";
import * as ipc from "./helpers/ipc";

const { app, shell, Menu, BrowserWindow } = require("electron");
const fixPath = require('fix-path');
fixPath();


app.once("ready", async () => {
  const defaultSettings = nodeRed.getDefaultSettings();
  const redInitialization = nodeRed.initialize(defaultSettings);

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    center: true,
    autoHideMenuBar: true
  });

  if (process.env.PLATFORM_TARGET === "development") {
    BrowserWindow.addDevToolsExtension(path.join(__dirname, "../../node_modules/devtron"));
    const installExtension = require("electron-devtools-installer");
    installExtension.default(installExtension.REACT_DEVELOPER_TOOLS)
      .then((name:string) => mainWindow.webContents.openDevTools())
      .catch((err:Error) => console.log("An error occurred: ", err));
  }

  mainWindow.once("close", () => app.quit());
  mainWindow.once("window-all-closed", () => app.quit());

  const settings = await redInitialization;

  const nodeRedUrl = `http://localhost:${settings.functionGlobalContext.port}`;
  const nodeRedAdmin = `${nodeRedUrl}/admin`;
  const nodeRedUI = `${nodeRedUrl}/ui`;
  const initialState = {
    nodeRedUrl: `http://localhost:${settings.functionGlobalContext.port}`,
    nodeRedAdmin,
    nodeRedUI,
    currentView: nodeRedAdmin
  };

  ipc.updateState<globalState>(initialState);

  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.once("ready-to-show", mainWindow.show);
  
  const menuTemplate = ApplicationMenu.createTemplate(initialState, app, shell);
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
});
