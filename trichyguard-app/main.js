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
  // x/y are not set here: Wayland's protocol gives clients no way to
  // request their own screen position at all (compositor-only decision) --
  // placement comes entirely from the Hyprland windowrule in
  // ~/.config/hypr/edit_here/source/window_rules.conf instead.
  mainWindow = new BrowserWindow({
    width: PINNED_SIZE.width,
    height: PINNED_SIZE.height,
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
// lock only ever covered its own small pinned window instead of taking
// over the screen. Electron's main process has no such restriction: it can
// do this at any time, which is the entire point of running as a native
// app instead of a tab.
//
// One real bug found testing this for real: Hyprland auto-un-pins a window
// the moment it goes fullscreen (confirmed via a scripted check -- pinned
// flips from true to false). A pinned window only "follows" across
// workspaces via that pin; once unpinned mid-transition, it snaps to
// whatever workspace it happened to be on, which is very often NOT the one
// you're actually looking at -- so it can go fullscreen and you'd never
// see it. Fixed by explicitly moving it to the currently active workspace
// and focusing it via hyprctl *before* requesting fullscreen, and
// re-pinning it after unlocking (Hyprland's own pin is a one-shot
// windowrule effect at window creation, it doesn't reapply on its own).
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
  mainWindow.setAlwaysOnTop(true, 'floating');
  try {
    // `dispatch pin` toggles rather than sets -- only fire it if Hyprland
    // actually still has this window unpinned (the auto-unpin from going
    // fullscreen), so this can't accidentally un-pin an already-pinned
    // window on some other code path.
    const clients = JSON.parse(execFileSync('hyprctl', ['clients', '-j']).toString());
    const win = clients.find((c) => c.class === 'trichyguard-app');
    if (win && !win.pinned) hypr('dispatch', 'pin', HYPR_CLASS_SELECTOR);
  } catch (e) {
    console.log('could not verify pin state:', e.message);
  }
  hypr('dispatch', 'movewindowpixel', `exact 1156 57,${HYPR_CLASS_SELECTOR}`);
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
