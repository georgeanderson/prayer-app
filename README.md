# Hearth

A small, calm web app for sharing prayer requests. No account is required.

People can post a request, browse what others have shared, mark that they prayed, and keep a private list of requests to return to. Someone who posted a request from this browser can later mark it answered and leave an optional praise update.

## Features

- Post a request with an optional name and category, or leave the name blank to post anonymously
- Browse a feed, filter by status or category, and open a request
- Tap **I prayed** to count yourself once for that request
- Mark a request you posted as answered, with an optional praise update
- Save requests to a personal prayer list stored in this browser

## Requirements

- Node.js 22.5 or newer (the app uses Node's built-in `node:sqlite` module)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

If port 3000 is already in use:

```bash
npx next dev -p 3001
```

## Data

Requests are stored in a SQLite file at `data/prayers.db`. The file is created the first time the app runs. When that database has no requests, the app inserts a few example requests so the feed is not empty. Those examples cannot be marked answered, because the private key for them was never saved in a browser.

To start over, stop the server, delete `data/prayers.db` (and any `data/prayers.db-wal` / `data/prayers.db-shm` files), and start the app again.

There is no login.

- A private key for each request you post is saved in this browser's local storage. Only that browser can mark the request answered.
- "I prayed" is counted once per browser. The browser sends a random id stored locally; the server keeps that id so a repeat tap does not increase the count again.
- The personal prayer list is only in local storage. It is not sent to the server except to look up the requests you saved.

This is a local MVP. There is no moderation, no accounts, and no external service.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |

## Accessibility

Pages use one main heading, labeled fields, and buttons with clear names. Focus is visible, status is not conveyed by color alone, and tap targets stay large enough for a phone. The layout is a single column that fits a narrow screen.
