// Imported Modules
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const axios = require('axios');
const dotenv = require('dotenv').config();

// Global variables
let mainWindow;
let splashWindow;

const isDev = true;

const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      {
        label: 'About',
        click: aboutWindow
      },
      {
        label: 'Application Log',
        click: AppLog
      },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
        : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }
];

function createSplash() {
  // Create the splash screen window
  splashWindow = new BrowserWindow({ width: 400, height: 300, frame: false, transparent: true, alwaysOnTop: true });
  splashWindow.loadFile('./renderer/splash.html');
}

function createWindow() {
  // Create the main application window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Hide the main window initially
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load your main application's HTML file
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));

  // Show the main window after a delay
  setTimeout(() => {
    mainWindow.show();
    splashWindow.destroy(); // Close the splash screen window
  }, 2000); // Adjust the delay time (in milliseconds) as needed
}

// About window
function aboutWindow () {
  const about = new BrowserWindow({
    width: 400,
    height: 400,
    alwaysOnTop: true,
  });

  about.setMenuBarVisibility(false);

  // Load your main application's HTML file
  about.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// Application Log
function AppLog () {
  const appLog = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: true,
  });

  appLog.setMenuBarVisibility(false);

  // Load your main application's HTML file
  appLog.loadFile(path.join(__dirname, "./renderer/log.html"));
}

// Create the application windows when Electron has finished initialization
app.whenReady().then(() => {
  createSplash();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplash();
      createWindow();
    }
  });
});

// Quit the application when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  // Initialize functions
  ipcMain.handle('axios.openAI', openAI);
  ipcMain.handle('axios.backend', backend);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Main functions
async function openAI(event, sentence){
    let result = null;
  
    const env = dotenv.parsed;
    await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/completions',
      data: {
        model: "text-davinci-003",
        prompt: "Topic:Two-Sentence Horror Story:. Just say 'Try again' if it doesn't make sense\n" + sentence,
        temperature: 0.8,
        max_tokens: 60,
        top_p: 1.0,
        frequency_penalty: 0.2,
        presence_penalty: 0.0
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.APIKEY_OPENAI
      }
    }).then(function (response) {
      result = response.data;
    })
    .catch(function (error) {
      result = error;
    });


  return result;
}
async function backend(event, method, data) {
  let result = null;
  
  let url =
    method == 'get'
      ? 'http://backend.test/api/horrorStory'
      : method == 'delete'
      ? 'http://backend.test/api/horrorStory' + data
      : 'http://backend.test/api/horrorStory' ;

  try {
    result = await axios({
      method: method,
      url: url,
      headers: {
        Accept: 'application/json',
      },
      data: data,
    }).then(function (response) {
      result = response.data;
    });
  } catch (error) {
    result = error.response.data;
  }
  return result;
}
