# Tide Now

Read this before editing `tide-now/`.

## What this is

A private, mobile-first tide and fishing-time checker. It is intentionally small,
fast, and direct.

The app helps answer:

- What is the tide doing now?
- When are low and high tide for one selected day?
- Where is the strongest predicted water movement?
- When is the incoming push into high tide?
- What is the nearby hourly weather around each tide event?

## Stack

- Buildless static HTML/CSS/JS.
- No framework.
- No bundler.
- No package install.
- Source lives in `dist/`.
- Sites manifest lives in `.openai/hosting.json`.

## Product rules

- Keep the first screen useful on a phone.
- Show one selected day at a time.
- Keep controls obvious: station, date, refresh, scrubber.
- Keep copy short and scannable.
- Do not add dashboards, accounts, maps, sharing, or persistence unless Ori asks.
- Do not add a new dependency for charting; the SVG curve is hand-built and should stay lightweight.

## Data

- Tide predictions use NOAA CO-OPS in the browser.
- Weather uses Open-Meteo in the browser.
- Weather is helpful context, not a blocker. If weather fails, tide data should still work.
- Station coordinates live in `dist/app.js`; keep them accurate enough for local weather.
- Fishing cues are heuristics:
  - `🐟` marks strongest predicted tide movement in the selected day.
  - `↑ High` marks the incoming window into high tide.

## Design

- Minimal, black-on-white, hard edges.
- Inspired by the `personal-site/` visual language but separate from it.
- Condensed sans for UI labels.
- Serif numerals for tide values.
- Pure blue, yellow, and green are signal colors.
- No rounded cards, gradients, shadows, or decorative imagery.

## Checks

After editing JavaScript:

```sh
node --check dist/app.js
```

For a quick local preview:

```sh
python3 -m http.server 4173 --directory dist
```

## Hosting

This is an existing private Sites project. Preserve `.openai/hosting.json`.

Do not deploy unless Ori asks. If deploying, use the Sites workflow and keep the same `project_id`.
