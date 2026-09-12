# trichyguard-app

The desktop version of [Trichyguard](../README.md) — an Electron shell around the exact same
`index.html` served at the main site, run as an invisible background app instead of a browser tab.

**For setup instructions (install, first run, autostart on macOS/Windows/Linux), see the
["Setting up the background app"](../README.md#setting-up-the-background-app--step-by-step)
section in the main README.** This file is the technical reference for what's actually in here.

## Why a native app, not a browser tab

A browser page cannot force itself fullscreen, steal focus, or keep running at full speed while
hidden in the background — all deliberate browser security restrictions. Those are exactly the
three things needed to actually interrupt someone: keep watching while the window is hidden, and
when it catches something, take over the whole screen without waiting for a click. Only a native
app can do that, which is the entire reason this directory exists.

## Files

- `main.js` — the Electron shell: window setup (invisible by default, `show: false`), the GPU
  workaround for this machine's hardware, and the `lockToFullScreen()`/`unlockFromFullScreen()`
  bridge that the page calls into.
- `preload.js` — exposes `window.trichyguardNative.lock()/unlock()` to the page through a
  sandboxed context bridge. The shared `index.html` checks for its existence before calling it, so
  it's a no-op when the same page is loaded as a plain browser tab.
- `build/` — window/tray icons.
- `watchdog-test.sh` — a bounded test launcher used while developing this: kills the whole
  Electron process tree automatically if CPU exceeds a threshold or a time limit passes, so a bad
  GPU config can't run away unattended. Not needed to just run the app.

`main.js` loads `https://sammynashed.github.io/Trichyguard-AI/` live, so page-side changes ship
the same way the browser version does — no separate build step. Only the Electron shell itself
(window behavior, GPU flags, the fullscreen/focus bridge) lives in this directory.

## Notes specific to my own machine

- `disable-gpu-compositing` in `main.js` works around a real crash on this machine's Intel iGPU
  under Wayland (documented inline, with everything else that was tried first and why it didn't
  work). Other hardware may not need it, or may need something else entirely — if Electron's GPU
  process crashes on your machine, that comment is a starting point, not a guaranteed fix.
- The Hyprland `hyprctl` calls in `lockToFullScreen()`/`unlockFromFullScreen()` make the lock
  screen follow you to whichever workspace you're actually looking at. On a different compositor,
  window manager, or OS, those calls just fail harmlessly (wrapped in try/catch, logged, nothing
  breaks) and it falls back to Electron's own `setFullScreen()`/`focus()`, which still works —
  just without that specific refinement.
