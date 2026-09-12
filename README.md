# Trichyguard

**[Open the app →](https://sammynashed.github.io/Trichyguard-AI/)**

I have trichotillomania — I pull my own hair, consciously, and I built this because I wanted
something that could catch my hand before I was even aware it had moved. Most tools for this rely
on you noticing the urge first, and by the time I notice, I'm usually already mid-pull. So this
one doesn't wait for that.

I'm not a therapist and this isn't a clinical product. It's the thing I wished existed, built for
myself first. Putting it here instead of keeping it on my own machine is just in case it's useful
to someone else dealing with the same thing.

## What it does — and that's genuinely all it does

Open it, and it watches. That's the entire app. No account, no button to press, no settings, no
history, nothing to configure. It watches your webcam with an on-device hand-tracking model
(Google's MediaPipe, running entirely in your browser via WebAssembly), and the instant it catches
your hand near your hair, it locks the screen full-screen — no close button, nothing to fill in,
nothing to confirm. It only lifts once your hand has been away for a couple of seconds, and then
it quietly goes back to watching.

There used to be a streak counter, stats, trigger logging, a manual "I feel an urge" button, a
journal, export/import. All of it is gone on purpose. The moment this app starts asking you to log
anything, tag a trigger, or review a chart, it stops being a thing that just protects you and
starts being one more app demanding attention — exactly the kind of friction that makes a
compulsive habit easier to keep doing around. So: no logging, because there's no data collected to
log. No streaks, because there's nothing being tracked. No settings, because there's nothing to
configure — it's on the moment it's open.

## Two ways to run it

**In a browser tab** — the link above works as-is, no install. The one real limitation: a
browser page cannot force itself fullscreen or steal focus without a fresh click (deliberate
browser security policy), so the lock can only ever cover its own tab. If you're working in a
different window when it catches you, you won't see it.

**As a small desktop app** (what I actually run) — a native wrapper (`trichyguard-app/` in this
repo, Electron-based) that loads the exact same page, but as its own tiny window instead of a
browser tab. Because it's a real app and not a webpage, it can do two things a browser can't:
keep watching at full speed even when the window is hidden in the background, and force itself
fullscreen and grab focus the instant it catches something — genuinely taking over your screen,
not just its own small corner. It sits pinned in a corner of your screen, watching, and only
expands when it needs to. See `trichyguard-app/main.js` for the setup; it's fairly specific to my
own machine's GPU quirks (documented in the comments there) and Hyprland config, so treat it as a
reference rather than a drop-in for a different setup.

## FAQ (the questions I'd ask too)

### How do I know it's *only* this app using my camera, and not some other site or app?

Three checks, cheapest first:

1. **The camera's hardware LED.** Most laptop webcams wire the indicator light directly to the
   camera's power line — it's not something software can fake or suppress. If that light is off,
   nothing is recording, full stop, no matter what any app claims.
2. **Your browser's own camera indicator.** Chrome/Chromium-based browsers (Helium, Edge, Brave,
   Chrome itself) show a camera icon right in the address bar of *any* tab currently using your
   camera, and clicking it lists exactly which site. If you see that icon lit on a tab that isn't
   Trichyguard, that's your answer.
3. **Audit granted permissions directly**: open `chrome://settings/content/camera` (same address
   works in every Chromium-based browser) and look at the site list. Revoke anything you don't
   recognize or don't remember granting.

Trichyguard asks for the camera the moment the page loads — that's by design now (there's no
button left to gate it behind), but it's also the *only* thing that ever happens automatically.
Nothing else runs, nothing is sent anywhere, without you seeing the camera indicator light up.

### Where does the video footage go?

Nowhere. There is no upload code in this app — you can verify that yourself, because the entire
client is one readable `index.html` file with no build step, no bundler, no obfuscation, and (as
of now) no storage of any kind either — not even locally. Every video frame is handed to the
on-device MediaPipe model, a set of hand/face coordinates comes back, and the raw frame is
discarded immediately. It's never written to disk, never sent over the network, never even kept
in memory past that single frame.

## Running it yourself

Static site, no build step, no dependencies.

```
git clone https://github.com/SammyNashed/Trichyguard-AI.git
cd Trichyguard-AI
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Camera access needs it served over http/https, not opened
directly as a `file://` path.

## The honest limits

- A browser tab can lock itself against clicks and keys — but it cannot touch anything at the
  operating-system level. A global keyboard shortcut bound in your window manager or compositor
  fires before the page ever sees the keystroke; nothing running at normal user permissions can
  intercept that, this app (browser or desktop version) included.
- The desktop app keeps watching while its window is hidden, but it still needs the app itself to
  be running and the camera physically uncovered. It's not a system service and doesn't survive a
  full quit.

## Not a replacement for therapy

Trichyguard is a self-help tool I built out of my own frustration, not a diagnosis or a clinical
treatment. Habit-reversal training with a licensed therapist is still the most evidence-backed
path for BFRBs — the TLC Foundation for BFRBs is a well-known place to find one if you're looking.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, adapt it for the specific thing you're fighting.
