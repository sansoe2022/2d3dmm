# Myanmar 2D/3D Lottery - Cloudflare Worker Backend

ဤ backend သည် Cloudflare Worker တွင် run လုပ်သည့် Hono framework အပေါ်အခြေခံထားသော REST API နှင့် Telegram Webhook handler ဖြစ်ပါသည်။

## အင်္ဂါရပ်များ

- **Telegram Bot Integration**: Telegram webhook မှတစ်ဆင့် betting messages များကို လက်ခံခြင်း
- **REST API**: Frontend မှ customer records များကို ရယူ၊ ဖန်တီး၊ update နှင့် delete လုပ်ခြင်း
- **Cloudflare KV Storage**: Data persistence အတွက် Cloudflare KV ကို အသုံးပြုခြင်း
- **CORS Support**: Frontend နှင့် backend အကြား cross-origin requests ခွင့်ပြုခြင်း

## Directory Structure

```
backend-worker/
├── src/
│   ├── index.ts          # Main Hono app နှင့် API routes
│   ├── bettingParser.ts  # 2D/3D betting text parser
│   └── dataStore.ts      # Cloudflare KV data operations
├── wrangler.toml         # Cloudflare Worker configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # ဤ file
```

## Setup နှင့် Development

### Prerequisites

- Node.js v18+
- pnpm သို့မဟုတ် npm
- Cloudflare Account

### Installation

```bash
cd backend-worker
pnpm install
```

### Local Development

```bash
pnpm dev
```

ဤ command သည် local Cloudflare Worker environment ကို `http://localhost:8787` တွင် start လုပ်ပါမည်။

### Deployment

```bash
pnpm deploy
```

ဤ command သည် သင်၏ code ကို Cloudflare Workers တွင် deploy လုပ်ပါမည်။

## Configuration

### Telegram Bot Token

Bot token ကို Cloudflare secret အဖြစ် set လုပ်ပါ။

```bash
wrangler secret put BOT_TOKEN
```

### KV Namespace

KV Namespace ID သည် `wrangler.toml` တွင် ရှိပြီးသား ဖြစ်ပါသည်။

```toml
[[kv_namespaces]]
binding = "LOTTERY_KV"
id = "0b69a8c495394157b81709139e2b45b5"
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-17T10:30:00.000Z"
}
```

### Get Customers

```
GET /api/customers?date=YYYY-MM-DD&session=morning|evening
```

### Add Customer

```
POST /api/customers
Content-Type: application/json

{
  "customer": {
    "name": "John Doe",
    "telegramUserId": 123456789,
    "bettingData": [{"number": "12", "amount": 500}],
    "totalBet": 500,
    "bettingType": "2D",
    "paymentType": "cash",
    "weeklySettle": false,
    "session": "morning"
  },
  "date": "2024-03-17",
  "session": "morning"
}
```

### Update Customer

```
PUT /api/customers/:id
Content-Type: application/json

{
  "updates": {
    "bettingData": [{"number": "34", "amount": 1000}],
    "totalBet": 1000
  },
  "date": "2024-03-17",
  "session": "morning"
}
```

### Delete Customer

```
DELETE /api/customers/:id?date=2024-03-17&session=morning
```

## Telegram Webhook

Telegram Bot သည် အောက်ပါ endpoint မှတစ်ဆင့် messages များကို လက်ခံပါသည်။

```
POST /webhook
```

Webhook ကို set လုပ်ရန်:

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-worker.workers.dev/webhook
```

## Frontend Integration

Frontend သည် အောက်ပါ environment variable ကို အသုံးပြုပြီး backend ကို ခေါ်ဆိုပါသည်။

```
VITE_API_URL=https://your-worker.workers.dev
```

## အကူအညီ

အကျ်ဉ်းချုပ်ရန် သို့မဟုတ် ပြဿနာများအတွက် GitHub issues တွင် ဖွင့်ပါ။

---

**Version**: 1.0.0  
**License**: MIT
