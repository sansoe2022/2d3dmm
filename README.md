# Myanmar 2D/3D Lottery Summarizer

A mobile-first web app for managing Myanmar 2D/3D lottery customer betting records, with an optional Telegram bot backend for receiving bets via Telegram DM.

---

## Features

- **Customer List** — Add, edit, and delete customer betting records per date and session (morning/evening)
- **Winner Search** — Find all customers who bet on a specific winning number
- **Settings** — Dark mode toggle, Myanmar/English language selector
- **Telegram Bot** — Customers can send their betting list via Telegram DM; records appear automatically in the web app
- **Offline-first** — Works entirely with localStorage when the backend is offline
- **Dark mode** — Persisted in localStorage
- **Mobile-first** — Optimized for phones

---

## Frontend (Cloudflare Pages)

The frontend is a static React + Vite app deployed on Cloudflare Pages.

### Local Development

```bash
# Install dependencies
npm install

# Copy env file and set your backend URL (optional)
cp .env.example .env
# Edit .env and set VITE_API_URL=http://localhost:4000

# Start dev server
npm run dev

# Build for production
npm run build
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend server URL for Telegram bot sync | *(empty — offline mode)* |

When `VITE_API_URL` is not set, the app works fully offline using localStorage only. When set, it polls the backend every 30 seconds and merges Telegram bot customers with local customers.

---

## Telegram Bot Backend

The bot backend is a standalone Node.js/Express server located in the `bot/` directory. It:

1. Runs a Telegram bot that accepts betting lists via DM
2. Parses bets using the same format as the web app
3. Saves records to a shared JSON file (`bot/data/customers.json`)
4. Exposes a REST API for the web frontend to read/update/delete records

### Prerequisites

- Node.js 18+
- A VPS or server with a public IP
- The bot token (already configured): `8702735120:AAHE8Ulh4B9iduuoYR3i204YF4L73JwFgZE`

### Setup

```bash
# Navigate to the bot directory
cd bot

# Install dependencies
npm install

# Copy the env file
cp .env.example .env

# Edit .env if needed (token is already pre-filled)
nano .env
```

### Running the Bot

```bash
# Development (with auto-restart on file changes)
npm run dev

# Production
npm start
```

The server starts on port `4000` by default. You should see:

```
[Bot] Initializing Telegram bot...
[Server] REST API listening on http://localhost:4000
[Bot] Telegram bot is running (polling mode)
```

### Production Deployment with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot with PM2
cd bot
pm2 start ecosystem.config.js

# Save PM2 process list (auto-start on reboot)
pm2 save
pm2 startup

# View logs
pm2 logs lottery-bot

# Monitor
pm2 monit
```

### Environment Variables (bot/.env)

| Variable | Description | Default |
|---|---|---|
| `BOT_TOKEN` | Telegram bot token from @BotFather | Pre-filled |
| `PORT` | Port for the REST API server | `4000` |
| `DATA_DIR` | Directory for the JSON data file | `./data` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated or `*`) | `*` |

### Connecting Frontend to Backend

After deploying the bot server, set `VITE_API_URL` in your Cloudflare Pages environment variables:

1. Go to Cloudflare Pages → Your project → Settings → Environment variables
2. Add: `VITE_API_URL` = `http://your-vps-ip:4000`
3. Redeploy the frontend

---

## REST API Reference

All endpoints are served by the bot server.

### `GET /health`
Health check.

**Response:** `{ "status": "ok", "timestamp": "..." }`

---

### `GET /api/customers`
Get all customers for a specific date and session.

**Query params:**
- `date` — `YYYY-MM-DD` (required)
- `session` — `morning` or `evening` (required)

**Response:**
```json
{
  "customers": [...],
  "sessionKey": "2025-01-15-morning",
  "count": 5
}
```

---

### `POST /api/customers`
Add a customer from the web app.

**Body:**
```json
{
  "customer": { "name": "Ko Aung", "bettingData": [...], ... },
  "date": "2025-01-15",
  "session": "morning"
}
```

---

### `PUT /api/customers/:id`
Update a customer.

**Body:**
```json
{
  "updates": { "paymentType": "credit" },
  "date": "2025-01-15",
  "session": "morning"
}
```

---

### `DELETE /api/customers/:id`
Delete a customer.

**Query params:** `date`, `session`

---

## Telegram Bot Usage

### Commands

| Command | Description |
|---|---|
| `/start` | Welcome message with usage instructions |
| `/help` | Show betting format help |
| `/status` | Show today's recorded bets for the sender |

### Betting Format

Send a betting list as a plain text message:

**2D format:**
```
12 500
34 1000R
56 300
```

**3D format:**
```
123 500
456 1000R
```

- `R` suffix = reverse/mirror (2D: `12R` adds both `12` and `21`; 3D: adds all permutations)
- Session is auto-detected: before 12:00 = morning, after 12:00 = evening
- The sender's Telegram first name is used as the customer name

The bot replies with a formatted confirmation in Myanmar language showing all recorded bets and the total amount.

---

## Project Structure

```
2d3dmm/
├── client/src/          # React frontend
│   ├── pages/           # CustomerList, WinnerSearch, SettingsPage
│   ├── components/      # BottomSheet, MainLayout, ErrorBoundary
│   ├── contexts/        # ThemeContext, LanguageContext, ToastContext
│   ├── hooks/           # useApiSync (polling hook)
│   └── lib/             # bettingParser, customerManager, apiClient
├── bot/                 # Telegram bot + REST API backend
│   ├── server.js        # Main server (bot + Express API)
│   ├── bettingParser.js # Betting text parser (Node.js version)
│   ├── dataStore.js     # JSON file data store
│   ├── ecosystem.config.js  # PM2 config
│   └── package.json
├── server/              # Legacy Express server (static file serving)
└── shared/              # Shared constants
```

---

## License

MIT
