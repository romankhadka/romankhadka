<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/hero-light.svg">
  <img alt="Roman Khadka: payment systems, commerce infrastructure, and developer tools" src="./assets/hero-light.svg" width="100%">
</picture>

Engineer at **[Fluid](https://www.fluid.app)** · payment orchestration & commerce infrastructure · Utah · [romn.dev](https://romn.dev)

I work on the part of commerce where money actually moves: authorization and capture,
refunds, wallets, recurring billing, routing across a dozen gateways that all disagree
about what a webhook means.

The happy path is the easy part. The craft is in asynchronous state, duplicate messages,
partial failure, and making recovery boring enough that nobody gets paged for it. Most of
what I ship is a Rails monolith old enough to have opinions, kept understandable on
purpose.

Evenings I build small, sharp tools for the terminal, the Mac, and the web. Each one
has its own site on `*.romn.dev`.

### Tools

<!-- Drop a terminal GIF under Yakka and Verso when you next record one. An 8-second
     asciinema cast converted to GIF converts readers into users better than any prose. -->

**[yakka](https://yakka.romn.dev)**. Claude Code and Codex side by side in one terminal,
every session sealed in its own git worktree, the whole host detachable. Rust. Prebuilt
macOS and Linux binaries on [Releases](https://github.com/romankhadka/yakka/releases) ·
[source](https://github.com/romankhadka/yakka).

```sh
brew install romankhadka/tap/yakka
```

**[verso](https://verso.romn.dev)**. A terminal EPUB reader with vim navigation, a
Kindle-style library, and highlights that export as real Markdown into Obsidian,
Logseq, or Zotero. Rust. [source](https://github.com/romankhadka/verso)

```sh
brew install romankhadka/tap/verso
```

**[Opta](https://opta.romn.dev)**. Hold Option, cycle your windows, let go. A native
macOS window switcher with live previews and a per-application mode; the overlay
renders in a fraction of a frame. Swift; prebuilt app on
[Releases](https://github.com/romankhadka/opta/releases) ·
[source](https://github.com/romankhadka/opta)

**[Lunar](https://lunar.romn.dev)**. Sets your wallpaper to tonight's moon phase from
public-domain NASA photography. No network, no telemetry, no preferences window.
Swift; [DMG on Releases](https://github.com/romankhadka/lunar/releases) ·
[source](https://github.com/romankhadka/lunar)

**[focus-follows-close](https://focus-follows-close.romn.dev)**. Close an app's last
window on macOS and focus goes nowhere. This Hammerspoon script moves it to the window
you used before, and does nothing else. One-line installer and a Claude Code skill
included. Lua. [source](https://github.com/romankhadka/focus-follows-close)

**[Corekiln](https://corekiln.romn.dev)**. Holds a Mac at full load, honestly: CPU,
GPU, or both, continuously busy. No daemon, no privileges, no bypassing the thermal
protections. C. [source](https://github.com/romankhadka/corekiln)

**[Worldloom](https://worldloom.romn.dev)**. A persistent living tapestry woven in
real time from seven public signals and three anonymous visitor gestures. Elixir,
Phoenix LiveView, Canvas 2D. [source](https://github.com/romankhadka/worldloom)

**[context-compactor](https://github.com/romankhadka/context-compactor)**. Watches a
Claude Code session and suggests `/compact` at decay-aware thresholds tuned per task type.

```
/plugin marketplace add https://github.com/romankhadka/context-compactor
```

**[Crux](https://github.com/romankhadka/crux-lang)**. A small expression-oriented language
with closures, pipes, and a tree-walk interpreter, written in Ruby to find out what a
language really needs.

The `brew` formulas live in my
[Homebrew tap](https://github.com/romankhadka/homebrew-tap).

### Toolbox

```text
LANGUAGES   Ruby · Rust · Swift · Elixir · C
SYSTEMS     Rails · PostgreSQL · Redis · Sidekiq
INTERESTS   idempotency · async state · partial failure · terminal UI
SITES       one per project · *.romn.dev
```

### Activity

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/stats-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/stats-light.svg">
  <img alt="Pull requests opened, pull requests reviewed, commits, and repositories created since 2016, with a 52-week activity sparkline" src="./assets/stats-light.svg" width="100%">
</picture>

> **Good software should explain itself.** The rest is naming, restraint, and care.

If you try one of these and it breaks, open an issue. I read every one.
For everything else: [LinkedIn](https://www.linkedin.com/in/roman-khadka/).
