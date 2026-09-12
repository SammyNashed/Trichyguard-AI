# trichyguard-app

The desktop wrapper for [Trichyguard](../README.md) — an Electron shell around the exact same
`index.html` served at the main site, run as its own small window instead of a browser tab.

## Why this exists

A browser page cannot force itself fullscreen, steal focus, or keep running at full speed while
hidden in the background — all deliberate browser security restrictions. Those are exactly the
three things this app needs to actually interrupt you: it has to keep watching while minimized,
and when it catches something, it has to take over your whole screen without waiting for a click.
Only a native app can do that.

## Running it

```
npm install
npm start
```

`main.js` loads `https://sammynashed.github.io/Trichyguard-AI/` live — so app-side changes ship
the same way the browser version does, no separate build step. Only the Electron shell itself
(window behavior, GPU flags, the fullscreen/focus bridge) lives in this directory.

## Notes specific to my own setup

- `disable-gpu-compositing` in `main.js` works around a real crash on this machine's Intel iGPU
  under Wayland (documented inline). Other hardware may not need it, or may need something else
  entirely — if Electron's GPU process crashes on your machine, that comment explains what I tried
  and why, as a starting point.
- The Hyprland `hyprctl` calls in `lockToFullScreen()`/`unlockFromFullScreen()` are Hyprland-
  specific (workspace-follow and re-pin behavior). On a different compositor or window manager,
  those calls will just silently fail (wrapped in try/catch) and it'll fall back to Electron's own
  `setFullScreen()`/`focus()`, which still works, just without the "follow me to my active
  workspace" behavior.
- `preload.js` exposes `window.trichyguardNative.lock()/unlock()` to the page via a sandboxed
  context bridge — the same `index.html` checks for its existence before calling it, so it's a
  no-op when loaded as a plain browser tab.
