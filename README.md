# Trichyguard

**[Try it in your browser →](https://sammynashed.github.io/Trichyguard-AI/)** (no install, works
in 10 seconds — read on for how to run the full version)

I have trichotillomania — I pull my own hair, consciously, and I built this because I wanted
something that could catch my hand before I was even aware it had moved. Most tools for this rely
on you noticing the urge first, and by the time I notice, I'm usually already mid-pull. So this one
doesn't wait for that.

I'm not a therapist and this isn't a clinical product. It's the thing I wished existed, built for
myself first. Putting it here instead of keeping it on my own machine is just in case it's useful
to someone else dealing with the same thing.

## What it does

Open it, and it watches. That's the whole app.

It uses your webcam and an on-device hand-tracking model (Google's MediaPipe, running entirely on
your machine — nothing about your camera ever touches a network) to notice when your hand lingers
near your hair. The instant it does, the screen locks — full screen, no close button, nothing to
confirm, nothing to type. It only lifts once your hand has been away for a couple of seconds, and
then it quietly goes back to watching.

That's it. No account, no button to press, no settings, no history, no streaks, no "how did that
go?" check-in afterward. Earlier versions of this had all of that — a streak counter, stats, a
journal, a manual "I feel an urge" button — and I ended up ripping every bit of it back out. The
moment an app like this starts asking you to log something or review a chart, it stops being a
thing that just protects you and starts being one more thing demanding attention, which is exactly
the kind of friction that makes a habit like this easier to keep doing around. So there's nothing
to log, because there's nothing collected in the first place.

## Two ways to run it

**In your browser — try it right now, no install.** Open the link at the top. It'll ask for
camera access and start watching immediately. The one real limit: a browser tab can't force
itself fullscreen or steal focus from another window without you clicking something first — that's
a deliberate browser security rule, not a bug I can fix. So in the browser, the lock only covers
its own tab. If you're working in a different window when it catches you, you won't see it.

**As a small background app on your computer — this is what I actually use, every day.** It's the
same detection and the same lock screen, but running as a real native app instead of a browser tab
lets it do two things a browser fundamentally cannot: keep watching at full speed even while
completely hidden, and force itself fullscreen and grab your attention the instant it catches
something, no matter what else you're doing. There is no window, no icon, nothing visible on your
screen at all while it's just watching — it only appears, already fullscreen, at the moment it
needs to.

## Setting up the background app — step by step

This is exactly how I run it.

**1. Get the code and install its dependencies.**

```
git clone https://github.com/SammyNashed/Trichyguard-AI.git
cd Trichyguard-AI/trichyguard-app
npm install
```

**2. Try it once, manually, before automating anything.**

```
npm start
```

The first time, your OS/browser engine will ask for camera permission — allow it. You won't see a
window; that's correct, it's meant to be invisible while watching. Test it: put your hand up near
your hair and hold it there for about a second. The screen should lock. Move your hand away and
wait a couple of seconds — it should unlock and disappear again.

If it doesn't behave right, the first thing to check is `trichyguard-app/main.js` — there's a
comment block near the top about a GPU crash I had to work around on my own machine (an Intel
integrated GPU on Wayland/Linux). If Electron crashes for you, that comment explains what I tried
and why, as a starting point for your own hardware. If a Hyprland-specific `hyprctl` call fails
(you'll see it logged, harmless), that's expected on any other window manager or OS — it just
falls back to Electron's own fullscreen behavior, without the "follow me to whichever screen I'm
looking at" refinement.

**3. Make it start automatically when you log in**, so you never have to think about it again.
Pick whichever matches your system:

<details>
<summary><strong>macOS</strong></summary>

System Settings → General → Login Items → add `trichyguard-app` (or the Electron binary you're
running it through) to "Open at Login."

</details>

<details>
<summary><strong>Windows</strong></summary>

Press <kbd>Win+R</kbd>, type `shell:startup`, hit Enter — that opens your Startup folder. Drop a
shortcut to `npm start` (or a `.bat` file that `cd`s into `trichyguard-app` and runs it) in there.

</details>

<details>
<summary><strong>Linux — generic (any desktop environment)</strong></summary>

Create `~/.config/autostart/trichyguard.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Trichyguard
Exec=npm --prefix /full/path/to/Trichyguard-AI/trichyguard-app start
X-GNOME-Autostart-enabled=true
```

Most desktop environments (GNOME, KDE, XFCE, ...) pick this up automatically.

</details>

<details>
<summary><strong>Linux — Hyprland (exactly what I use)</strong></summary>

Add to your `autostart.conf` (or wherever your `exec-once` lines live):

```
exec-once = /full/path/to/Trichyguard-AI/trichyguard-app/node_modules/.bin/electron /full/path/to/Trichyguard-AI/trichyguard-app
```

That's the whole thing — no window rule needed. The window is invisible by default and only ever
appears fullscreen, so there's nothing to pin, float, or position.

</details>

**4. That's it.** From now on, it starts the moment you log in, sits there completely invisible,
and only shows itself when it actually needs to.

To stop it running, you'll need to find and quit the process (it doesn't put anything in your
taskbar/dock by design) — on Linux/macOS, `pkill -f trichyguard-app` from a terminal; on Windows,
End Task on the `electron.exe` process for it in Task Manager.

## The questions I'd ask too

**How do I know it's *only* this app using my camera, and not something else?**
Three checks, cheapest first: (1) your laptop's camera indicator LED is wired directly to the
camera's power line on almost every modern machine — it physically cannot be faked by software, so
if it's off, nothing is recording, full stop; (2) Chromium-based browsers (which Electron is built
on) show a camera icon in the UI whenever anything is actively using your camera; (3) you can audit
every site/app that's ever been granted camera access directly — `chrome://settings/content/camera`
in any Chromium-based browser.

**Where does the video actually go?**
Nowhere. There's no upload code anywhere in this project — you can verify that yourself, the whole
thing is one readable `index.html` file with no build step, no bundler, nothing hidden. Every video
frame goes straight into the on-device model, a set of hand/face coordinates comes back, and the
raw frame is thrown away immediately. It's never written to disk, never sent over a network, never
kept anywhere past that single frame.

## The honest limits

- Even the background app can't survive a full quit or a covered/disabled camera — it's not a
  system service, just a regular app that has to actually be running.
- It can lock your screen against clicks and keys, but it cannot touch anything below the
  application layer. A global shortcut bound in your OS or window manager (a screenshot key, a
  workspace switcher, anything like that) still fires before this app ever sees it — no normal
  application, this one included, can intercept that.

## Not a replacement for therapy

Trichyguard is a self-help tool I built out of my own frustration, not a diagnosis or a clinical
treatment. Habit-reversal training with a licensed therapist is still the most evidence-backed path
for BFRBs (body-focused repetitive behaviors) — the TLC Foundation for BFRBs is a well-known place
to find one if you're looking.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, adapt it for the specific thing you're fighting.
