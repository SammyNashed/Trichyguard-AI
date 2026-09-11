# Trichyguard

A free, private, installable web app for interrupting hair-pulling urges (trichotillomania and
related body-focused repetitive behaviors) and understanding your own patterns over time.

**[Open the app](https://sammynashed.github.io/Trichyguard-AI/)** — works instantly in any
browser, installs to your home screen like a native app, and needs no account or internet
connection after the first load.

## Why

Trichotillomania responds well to habit-reversal training: noticing the urge earlier, naming
what's driving it, and substituting a competing action until the urge passes. Trichyguard puts
that loop in your pocket for the moment an urge actually hits, instead of only in a therapist's
office once a week.

## What it does

- **Urge button** — tap it the second you notice an urge. It walks you through naming the trigger,
  a guided breathing + competing-response exercise (clench fists, hold something cold, textured
  objects, etc.) for a few minutes, then asks honestly whether you resisted.
- **No-judgment logging** — if you already pulled, log it in one tap. No shame copy, no streak
  reset drama — just data that helps you see the pattern.
- **Streak + stats** — current and best pull-free streak, a 14-day resisted-vs-pulled chart, a
  time-of-day heatmap, and your most common triggers.
- **Journal** — free-form notes for anything that doesn't fit a trigger tag.
- **Reminders** — optional periodic check-in notifications while the app is open.
- **Your data never leaves your device.** Everything lives in `localStorage` in your browser.
  There's no backend, no analytics, no account. Export/import a JSON backup any time from
  Settings.

## Running it yourself

It's a static site — no build step, no dependencies.

```
git clone https://github.com/SammyNashed/Trichyguard-AI.git
cd Trichyguard-AI
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Or just open `index.html` directly in a browser (the service
worker and "Add to Home Screen" prompt need it served over http/https, not `file://`).

## Not a replacement for therapy

Trichyguard is a self-help tool, not a diagnosis or a treatment. If you're looking for a
licensed therapist experienced with BFRBs, the TLC Foundation for BFRBs is a well-known place
to start.

## License

MIT — use it, fork it, adapt it for the specific thing you're fighting. If this helps you even a
little, it did its job.
