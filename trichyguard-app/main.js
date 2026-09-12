const { app, BrowserWindow, Tray, Menu, session, ipcMain } = require('electron');
const path = require('path');
const { execFileSync } = require('child_process');

const HYPR_CLASS_SELECTOR = 'class:^(trichyguard-app)$';
// execFileSync, not execSync: the class selector's parentheses are literal
// regex syntax for hyprctl, but execSync runs through `/bin/sh -c`, which
// tries to interpret them as shell syntax and fails with a parse error on
// every single call. execFileSync passes args directly with no shell in
// between, so they reach hyprctl exactly as written.
function hypr(...args) {
  try {
    execFileSync('hyprctl', args);
  } catch (e) {
    console.log('hyprctl command failed:', args.join(' '), e.message);
  }
}

// GPU history on this machine (native Wayland, Intel iGPU):
//  - Untouched defaults: GPU process segfault crash-loop (gbm_pixmap_wayland
//    "Unsupported modifier" -- a DMA-BUF format-modifier negotiation bug
//    between Chromium and Mesa, specific to zero-copy GPU compositing).
//  - Forcing XWayland: window never mapped at all in this rootless setup.
//  - GPU/WebGL fully disabled: stable, but MediaPipe got no WebGL context
//    at all, so detection silently did nothing.
//  - Two forced-SwiftShader variants: CPU climbed unbounded either way.
//
// The fix: disable only GPU *compositing* (how the rendered frame is shared
// with the Wayland compositor -- the specific GBM/DMA-BUF path that
// crashed) while leaving WebGL/hardware-accelerated rendering for page
// content alone. Verified stable over a 25s watchdog-monitored run with
// real hardware WebGL and both MediaPipe graphs running, CPU settling to
// ~23% rather than climbing.
app.commandLine.appendSwitch('disable-gpu-compositing');

const APP_URL = 'https://sammynashed.github.io/Trichyguard-AI/';
const PINNED_SIZE = { width: 360, height: 480 };

let mainWindow = null;
let tray = null;

function createWindow() {
  // show:false -- no visible window at all while just watching. The point
  // is zero interface until it actually catches something: the camera
  // detection loop runs in this hidden window's renderer the whole time
  // (backgroundThrottling:false below keeps it at full speed even though
  // nothing is on screen), and the window only ever appears via
  // lockToFullScreen(), full screen, for the duration of an actual catch.
  mainWindow = new BrowserWindow({
    width: PINNED_SIZE.width,
    height: PINNED_SIZE.height,
    show: false,
    resizable: true,
    alwaysOnTop: true,
    frame: false,
    title: 'Trichyguard',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      // The entire point of running this as a native app instead of a
      // browser tab: without this, Chromium throttles the detection loop
      // to a near-standstill the moment the window is hidden/backgrounded,
      // same as any browser tab -- keeping camera detection running while
      // hidden (closing the window just hides it, see the close handler
      // below) was the actual reason Electron was necessary at all, and
      // this is the one flag that delivers it.
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.log('[renderer crashed]', JSON.stringify(details));
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('[did-fail-load]', errorCode, errorDescription);
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// A browser page can't force itself fullscreen or steal focus without a
// fresh click -- deliberate browser security policy, and the reason the
// lock only ever covered its own small window instead of taking over the
// screen. Electron's main process has no such restriction: it can do this
// at any time, which is the entire point of running as a native app
// instead of a tab.
//
// The window is hidden (show:false) the entire time it's just watching, so
// unlike the earlier pinned-corner-window design, there's nothing already
// visible on any workspace to "follow" you. It has to be explicitly moved
// to whichever workspace is actually active *before* it's shown --
// otherwise it would appear fullscreen on whatever workspace it happened
// to be created on, which is very often not the one you're looking at.
function lockToFullScreen() {
  if (!mainWindow) return;
  try {
    const active = JSON.parse(execFileSync('hyprctl', ['activeworkspace', '-j']).toString());
    hypr('dispatch', 'movetoworkspacesilent', `${active.id},${HYPR_CLASS_SELECTOR}`);
  } catch (e) {
    console.log('could not read active workspace:', e.message);
  }
  hypr('dispatch', 'focuswindow', HYPR_CLASS_SELECTOR);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.show();
  mainWindow.setFullScreen(true);
  mainWindow.focus();
}
function unlockFromFullScreen() {
  if (!mainWindow) return;
  mainWindow.setFullScreen(false);
  mainWindow.setSize(PINNED_SIZE.width, PINNED_SIZE.height);
  mainWindow.hide();
}

ipcMain.on('trichyguard-lock', lockToFullScreen);
ipcMain.on('trichyguard-unlock', unlockFromFullScreen);

function createTray() {
  tray = new Tray(path.join(__dirname, 'build', 'tray-icon.png'));
  tray.setToolTip('Trichyguard AI Guard');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Trichyguard', click: () => mainWindow.show() },
      { label: 'Hide', click: () => mainWindow.hide() },
      { type: 'separator' },
      {
        label: 'Quit Trichyguard',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media');
  });

  createWindow();
  createTray();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});
