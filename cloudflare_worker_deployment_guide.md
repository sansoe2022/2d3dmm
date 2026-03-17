# Cloudflare Worker Deployment Guide for Myanmar 2D/3D Lottery Backend

ဤလမ်းညွှန်ချက်သည် သင်၏ Myanmar 2D/3D Lottery backend ကို Cloudflare Worker အဖြစ် deploy လုပ်ရန်အတွက် လိုအပ်သော အဆင့်များကို အသေးစိတ်ဖော်ပြထားပါသည်။

## ၁။ လိုအပ်ချက်များ (Prerequisites)

မစတင်မီ အောက်ပါတို့ ရှိရပါမည်။

*   **Node.js** (v18 သို့မဟုတ် အထက်) နှင့် **npm** သို့မဟုတ် **pnpm** (project တွင် pnpm ကို အသုံးပြုထားသည်)
*   **Cloudflare Account**: အကယ်၍ မရှိသေးပါက [Cloudflare website](https://www.cloudflare.com/) တွင် အကောင့်ဖွင့်ပါ။
*   **Wrangler CLI**: Cloudflare Workers ကို deploy လုပ်ရန်အတွက် command-line tool ဖြစ်သည်။
*   **Telegram Bot Token**: သင်၏ Telegram Bot အတွက် BotFather မှ ရရှိထားသော token။

## ၂။ Project Setup

သင်၏ project repository ကို clone လုပ်ပြီး `backend-worker` directory သို့ သွားပါ။

```bash
gh repo clone sansoe2022/2d3dmm
cd 2d3dmm/backend-worker
pnpm install
```

## ၃။ Cloudflare Account နှင့် Wrangler CLI Setup

### Wrangler CLI ကို Install လုပ်ပြီး Login ဝင်ရန်

အကယ်၍ Wrangler CLI ကို install မလုပ်ရသေးပါက အောက်ပါ command ဖြင့် install လုပ်ပါ။

```bash
pnpm install -g wrangler
```

ထို့နောက် Cloudflare သို့ login ဝင်ပါ။

```bash
wrangler login
```

ဤ command သည် သင့် browser ကိုဖွင့်ပြီး Cloudflare သို့ login ဝင်ရန် တောင်းဆိုပါမည်။ Login ဝင်ပြီးပါက CLI သို့ ပြန်လာပါမည်။

### Cloudflare KV Namespace ဖန်တီးရန်

သင်၏ backend သည် data ကို သိမ်းဆည်းရန် Cloudflare KV (Key-Value) storage ကို အသုံးပြုပါသည်။ KV Namespace တစ်ခု ဖန်တီးရန် အောက်ပါ command ကို အသုံးပြုပါ။

```bash
wrangler kv namespace create "LOTTERY_KV"
```

ဤ command ကို run ပြီးပါက `id` နှင့် `preview_id` ပါဝင်သော JSON output ကို ရရှိပါမည်။ `id` ကို မှတ်သားထားပါ။ ၎င်းသည် သင်၏ KV Namespace ID ဖြစ်ပါသည်။

ဥပမာ output:

```json
{
  "id": "YOUR_KV_NAMESPACE_ID",
  "preview_id": "YOUR_PREVIEW_KV_NAMESPACE_ID"
}
```

## ၄။ Configuration

### `wrangler.toml` ကို Update လုပ်ရန်

`backend-worker/wrangler.toml` ဖိုင်ကို ဖွင့်ပြီး `[[kv_namespaces]]` အောက်ရှိ `id` ကို သင်ဖန်တီးခဲ့သော KV Namespace ID ဖြင့် အစားထိုးပါ။

```toml
name = "myanmar-lottery-backend"
main = "src/index.ts"
compatibility_date = "2024-02-08"

[vars]
# BOT_TOKEN should be set via `wrangler secret put BOT_TOKEN`

[[kv_namespaces]]
binding = "LOTTERY_KV"
id = "YOUR_KV_NAMESPACE_ID" # ဤနေရာတွင် သင်၏ KV Namespace ID ကို ထည့်ပါ

[observability]
enabled = true
```

### Telegram Bot Token ကို Secret အဖြစ် ထည့်သွင်းရန်

သင်၏ Telegram Bot Token ကို environment variable အဖြစ် တိုက်ရိုက်ထည့်သွင်းခြင်းထက် Cloudflare Worker secrets အဖြစ် ထည့်သွင်းခြင်းက ပိုမိုလုံခြုံပါသည်။ အောက်ပါ command ကို အသုံးပြုပါ။

```bash
wrangler secret put BOT_TOKEN
```

command ကို run ပြီးပါက သင့် Telegram Bot Token ကို ထည့်သွင်းရန် တောင်းဆိုပါမည်။ ထည့်သွင်းပြီး Enter နှိပ်ပါ။

## ၅။ Cloudflare Worker ကို Deploy လုပ်ရန်

configuration များ ပြီးစီးပါက သင်၏ Worker ကို deploy လုပ်နိုင်ပါပြီ။ `backend-worker` directory အတွင်းမှ အောက်ပါ command ကို run ပါ။

```bash
wrangler deploy
```

Deploy ပြီးစီးပါက သင်၏ Worker URL ကို output တွင် တွေ့ရပါမည်။ ဥပမာအားဖြင့် `https://myanmar-lottery-backend.<your-subdomain>.workers.dev` ကဲ့သို့ ဖြစ်ပါမည်။ ဤ URL ကို မှတ်သားထားပါ။

## ၆။ Telegram Webhook Setup

သင်၏ Telegram Bot သည် အသုံးပြုသူများထံမှ message များကို လက်ခံရရှိရန်အတွက် Cloudflare Worker URL ကို webhook အဖြစ် သတ်မှတ်ပေးရပါမည်။ အောက်ပါ URL ကို သင်၏ browser တွင် ဖွင့်ခြင်းဖြင့် သတ်မှတ်နိုင်ပါသည်။

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://myanmar-lottery-backend.<your-subdomain>.workers.dev/webhook
```

*   `<YOUR_BOT_TOKEN>` နေရာတွင် သင်၏ Telegram Bot Token ကို ထည့်ပါ။
*   `https://myanmar-lottery-backend.<your-subdomain>.workers.dev` နေရာတွင် သင်၏ deploy လုပ်ထားသော Worker URL ကို ထည့်ပါ။

အောင်မြင်ပါက `{"ok":true,"result":true,"description":"Webhook was set"}` ကဲ့သို့သော message ကို တွေ့ရပါမည်။

## ၇။ Frontend Integration

သင်၏ frontend project (Cloudflare Pages တွင် build ထားသော) သည် deploy လုပ်ထားသော Cloudflare Worker API ကို ခေါ်ဆိုနိုင်ရန် `VITE_API_URL` environment variable ကို update လုပ်ပေးရပါမည်။

သင်၏ frontend project ၏ `.env` ဖိုင် (သို့မဟုတ် Cloudflare Pages project settings တွင် environment variables) တွင် အောက်ပါအတိုင်း ထည့်သွင်းပါ။

```
VITE_API_URL=https://myanmar-lottery-backend.<your-subdomain>.workers.dev
```

*   `https://myanmar-lottery-backend.<your-subdomain>.workers.dev` နေရာတွင် သင်၏ deploy လုပ်ထားသော Worker URL ကို ထည့်ပါ။

frontend ကို ပြန်လည် build လုပ်ပြီး deploy လုပ်ပါက သင်၏ frontend သည် Cloudflare Worker backend နှင့် ချိတ်ဆက်မိပါလိမ့်မည်။

ဤအဆင့်များကို လိုက်နာခြင်းဖြင့် သင်၏ backend ကို Cloudflare Worker တွင် အောင်မြင်စွာ deploy လုပ်နိုင်ပါလိမ့်မည်။

---

**Author**: Manus AI
**Date**: March 17, 2026
