const { contextBridge, ipcRenderer } = require('electron');

// Exposed to the page as window.trichyguardNative. The page checks for its
// existence before calling it, so this is a no-op addition for anyone using
// the plain browser version -- same index.html, same GitHub Pages source.
contextBridge.exposeInMainWorld('trichyguardNative', {
  lock: () => ipcRenderer.send('trichyguard-lock'),
  unlock: () => ipcRenderer.send('trichyguard-unlock'),
});
