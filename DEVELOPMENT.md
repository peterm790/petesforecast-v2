# petesforecast-v2 Development Environment

## 1. Prerequisites
- Node.js 20+
- npm 10+

## 2. Install
```bash
npm ci
```

## 3. Configure environment
```bash
cp .env.example .env.local
```

Required in `.env.local`:
- `VITE_MAPBOX_ACCESS_TOKEN`

Optional in `.env.local`:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_WEATHER_API_BASE`
- `VITE_WEATHER_SOURCE_URL`
- `VITE_ROUTING_STREAM_URL`

## 4. Run local dev server
```bash
npm run dev:host
```

Open:
- `http://localhost:5173`

## 5. Build and preview (Cloudflare-style static output)
```bash
npm run build
npm run preview:host
```

Open:
- `http://localhost:4173`

## 6. Visual review loop for Codex collaboration
To let Codex inspect page outcomes, save screenshots into this repo and share the path.

Suggested path:
- `/Users/petermarsh/Documents/petes/petesforecast-v2/.artifacts/latest-map.png`

Then ask Codex to review that image and propose UI/data fixes.
