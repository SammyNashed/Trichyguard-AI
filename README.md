# Trichyguard

**[Open the app →](https://sammynashed.github.io/Trichyguard-AI/)**

I have trichotillomania. I pull my own hair, consciously, and I've known the name for it for
years but kept forgetting it — that's genuinely how this repo got its name, back when it was
just an empty placeholder for "someday I'll build something about this." This is that something.

I'm not a therapist and this isn't a clinical product. It's the tool I wished existed while I was
sitting there mid-pull, wishing something had stopped me two seconds earlier. I built it for
myself first. If it helps anyone else who deals with this, that's the whole point of putting it
here instead of keeping it on my own machine.

## What it actually does

- **AI Guard** — the important part. It watches your webcam using an on-device hand-tracking
  model (Google's MediaPipe, running entirely in your browser via WebAssembly) and the instant it
  catches your hand near your hair, it locks the screen full-screen, no close button, no tagging
  step, nothing to fill in. It only lifts once your hand has been away for a couple of seconds.
  I built it this way on purpose: by the time I'm aware enough to tap a button, I'm usually
  already mid-pull. This catches it before that.
- **Manual urge button** — for the moments you do catch yourself first: names the trigger, walks
  through a short breathing + competing-response exercise, then asks honestly whether you
  resisted.
- **No-judgment pull logging** — if it already happened, log it in one tap. No shame copy, no
  streak-reset drama.
- **Streak + stats** — current/best pull-free streak, a 14-day resisted-vs-pulled chart, a
  time-of-day heatmap, your most common triggers.
- **Installable** — add it to your home screen on phone or laptop like a native app. Scan the QR
  code in Settings from your phone to grab the link instantly.

## FAQ (the questions I'd ask too)

### Can I make it run in the background, all the time, on my laptop?

Yes, with two catches worth understanding:

1. A browser tab can only watch while it's actually visible on screen — AI Guard deliberately
   pauses the moment its tab or window is hidden or minimized, rather than pretending to watch
   when it can't. So "background" here means "a small always-visible window," not "invisible."
2. To auto-launch it at login as its own small pinned window (Linux/Hyprland example, adapt the
   syntax for your own WM or just use your OS's own "open at login" setting):

   ```
   # autostart
   exec-once = your-chromium-browser --app=https://sammynashed.github.io/Trichyguard-AI/?autoguard=1

   # window rule: float it small, pin it to a corner, keep it on every workspace
   windowrule {
       match:title = ^(Trichyguard)$
       float = on
       size = 360 480
       move = 90% 5%
       pin = on
   }
   ```

   The `?autoguard=1` flag tells the page to switch to the Guard tab and re-arm it automatically
   on load — no click needed after the very first time (browsers remember a camera grant
   per-site, so only that first launch needs you to click Allow).

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

Trichyguard itself only asks for the camera the moment you tap "Enable AI Guard" — never before,
never silently.

### Where does the video footage go?

Nowhere. There is no upload code in this app — you can verify that yourself, because the entire
client is one readable `index.html` file with no build step, no bundler, no obfuscation. Every
video frame is handed to the on-device MediaPipe model, a set of hand/face coordinates comes
back, and the raw frame is discarded immediately. It's never written to disk, never sent over the
network, never even kept in memory past that single frame. The live preview you see in the app is
the *only* place that frame ever exists, and it's gone the instant the next one arrives.

### Does my data sync between my laptop and my phone?

No — and that's deliberate, because syncing would mean a server, and a server is exactly the
thing this app refuses to have. Each device keeps its own local data. To move it, use **Export**
on one device and **Import** on the other, from Settings — it's a plain `.json` file, yours to
keep or inspect.

## Running it yourself

Static site, no build step, no dependencies.

```
git clone https://github.com/SammyNashed/Trichyguard-AI.git
cd Trichyguard-AI
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Camera access and the "Add to Home Screen" install prompt both
need it served over http/https, not opened directly as a `file://` path.

## The honest limits

- A browser tab can lock itself against clicks, keys, even closing the tab — but it cannot touch
  anything at the operating-system level. A global keyboard shortcut bound in your window
  manager or compositor fires before the page ever sees the keystroke; nothing running at normal
  user permissions can intercept that, this app included.
- It only sees anything while its window is open and visible in front of you. Lock your screen,
  switch away, or close the laptop, and it's blind — same as covering the lens.

## Not a replacement for therapy

Trichyguard is a self-help tool I built out of my own frustration, not a diagnosis or a clinical
treatment. Habit-reversal training with a licensed therapist is still the most evidence-backed
path for BFRBs — the TLC Foundation for BFRBs is a well-known place to find one if you're looking.

## License

MIT — use it, fork it, adapt it for the specific thing you're fighting. If it helps you even a
little, it did its job.
