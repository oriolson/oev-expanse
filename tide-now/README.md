# Tide Now

A small mobile-first tide checker for fishing. It shows one selected day at a time with:

- current or day-start tide height
- next low and high
- tide curve with scrubber
- strongest movement and incoming-high fishing cues
- tide table with nearby hourly weather

The site is buildless static HTML/CSS/JS in `dist/`.

## Local preview

```sh
python3 -m http.server 4173 --directory dist
```

## Hosting

This folder includes `.openai/hosting.json` for the existing private Sites deployment.
