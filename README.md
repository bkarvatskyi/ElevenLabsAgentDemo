# ElevenLabs Voice Agent Demo

Demo page for voice calls with an ElevenLabs agent (Vite + React + ElevenLabs UI Orb).

## Run locally

```bash
npm install
npm run dev
```

## Configuration (`.env`)

- `VITE_AGENT_ID` – the ElevenLabs agent ID
- `VITE_DV_<NAME>` – sent to the agent as the `{{<name>}}` dynamic variable

These values end up in the public page, so never put an API key here.
The agent must be public (authentication off). Restrict it to your domains
in the agent's Security settings (allowlist).

## Deploy

Every push to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. One-time setup: repo **Settings → Pages →
Source: GitHub Actions**.
