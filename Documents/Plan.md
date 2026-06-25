# CampusFlow — PLAN.md
*CampusAI Hackathon 2025 | Telegram + Google Calendar Edition*

---

## 1. One-Line Product Statement

CampusFlow is an AI-powered student hub where n8n automatically sends Telegram reminders and creates Google Calendar events — so students never miss a deadline again.

---

## 2. The Core Loop (NON-NEGOTIABLE)

```
Student creates deadline
    → Backend POSTs to n8n webhook
        → n8n creates Google Calendar event (shared team calendar)
            → n8n waits until reminder time
                → n8n sends Telegram message via Bot API
                    → Student receives reminder on Telegram
```

**This loop MUST work end-to-end before any other feature.**

---

## 3. Key Decisions

### Why Telegram (not WhatsApp)?
- **100% free** — no Twilio, no sandbox limits, no trial credits
- **Instant setup** — create bot via @BotFather in 2 minutes
- **No API key per user** — single bot token works for everyone
- **Better UX** — messages arrive instantly, rich formatting support

### Google Calendar — How It Works

**V1 (Hackathon — Shared Account):**
- Team creates ONE shared Google account (e.g., `campusflow-demo@gmail.com`)
- Share that calendar with n8n via OAuth2 (one-time setup)
- n8n creates events on that shared calendar
- Demo: open the shared calendar → events appear automatically
- **Why:** Fastest for hackathon, no per-user setup needed

**V2 (Per-User — Free!):**
- Each user clicks "Connect Google Calendar" → OAuth2 flow
- User authorizes their own Google account
- Refresh token stored in Supabase per user
- Events created on user's own calendar
- **Cost:** FREE — Google Calendar API = 1 million requests/day free quota
- **Setup:** Create OAuth2 credentials in Google Cloud Console (free)
- See `FuturePlan.md` V2 for full implementation

---

## 4. Judging Criteria Alignment

| Criteria | Points | Our Target |
|---|---|---|
| Core Platform (Login + Dashboard + Task CRUD) | 20 pts | ✅ Must have |
| n8n Workflow 1 — Telegram reminder fires | 15 pts (+5 bonus) | ✅ Must have |
| n8n Workflow 1 — Google Calendar created | 15 pts (+5 bonus) | ✅ Must have |
| AI Feature — First module | 20 pts (+5 bonus) | ✅ Notice Summarizer |
| n8n Workflow 2 — Notice broadcast via Telegram | +15 pts bonus | ✅ Must have |
| UI/UX Design & Mobile Responsiveness | 10 pts (+5 bonus) | ✅ Tailwind + Shadcn |
| Code Quality, Architecture & README | 10 pts | ✅ Clean code |
| Live Demo & 2-min pitch | 10 pts (+5 bonus) | ✅ Rehearse |
| **Total** | **100 pts + 45 bonus** | **Target: 120+** |

---

## 5. 3-Hour Execution Schedule

### Phase 1 — Setup & n8n (0:00–0:30)

| Time | Task | Done When |
|---|---|---|
| 0:00–0:10 | Create repo, init Next.js + Express backend, install deps | Both servers run |
| 0:10–0:15 | Set up Supabase project, create tables, get keys | Tables visible |
| 0:15–0:18 | Create Telegram bot via @BotFather, get bot token | Bot responds to /start |
| 0:18–0:22 | Create `.env` with all API keys | All keys present |
| 0:22–0:27 | Sign up n8n.cloud, create 2 blank workflows | Workflows created |
| 0:27–0:30 | Add Webhook nodes, copy URLs, paste in `.env` | Webhooks respond |

### Phase 2 — Core Platform (0:30–1:15)

| Time | Task | Done When |
|---|---|---|
| 0:30–0:45 | Student onboarding: name, branch, year, subjects, telegram_username | Form submits |
| 0:45–0:55 | Login/signup with Supabase Auth | Auth works |
| 0:55–1:05 | Dashboard: today's tasks, upcoming deadlines, AI tip | Dashboard renders |
| 1:05–1:15 | Task CRUD: create, read, update, delete deadlines | Task creation works |

### Phase 3 — n8n Automation (1:15–1:45) ⚡ CRITICAL

| Time | Task | Done When |
|---|---|---|
| 1:15–1:25 | Wire task creation → POST to n8n deadline webhook | n8n receives data |
| 1:25–1:35 | n8n Workflow 1: Webhook → Calendar → Wait → Telegram | Message received |
| 1:35–1:40 | Test: create deadline → Telegram msg → Calendar event | E2E works |
| 1:40–1:45 | Add 1-hour final nudge (second Wait + Telegram) | Two messages |

### Phase 4 — AI + Notice Summarizer (1:45–2:15)

| Time | Task | Done When |
|---|---|---|
| 1:45–1:55 | POST /api/ai/summarize via Groq API (free, fast) | Summary returns |
| 1:55–2:05 | Notice Summarizer UI: text area + "Summarize & Broadcast" | UI works |
| 2:05–2:15 | Wire broadcast → n8n notice webhook → Telegram broadcast | Messages sent |

### Phase 5 — Polish & Demo Prep (2:15–3:00)

| Time | Task | Done When |
|---|---|---|
| 2:15–2:25 | Add Attendance Risk Alerter (bonus module) | Feature works |
| 2:25–2:35 | "My Automations" page showing n8n trigger logs | Page shows logs |
| 2:35–2:45 | Seed demo data (real subjects, real deadlines) | Demo ready |
| 2:45–2:55 | Full E2E test: register → deadline → Telegram → Calendar | All green |
| 2:55–3:00 | Rehearse 2-min pitch twice, freeze codebase | Pitch ready |

---

## 6. Feature Scope

### ✅ MUST HAVE
- Student onboarding (name, branch, year, subjects, telegram_username)
- Supabase Auth (email/password)
- Dashboard: today's tasks, upcoming deadlines, AI tip
- Task CRUD with "Telegram reminder time" + "Add to Calendar" toggle
- n8n webhook on task creation → Telegram msg + Calendar event
- Notice Summarizer: paste notice → AI summary → Telegram broadcast
- Attendance Risk Alerter: enter % → AI flags at-risk subjects

### 🟡 NICE TO HAVE
- Dark mode toggle
- n8n status indicator on dashboard
- Second Telegram nudge (1-hour before deadline)

### ❌ OUT OF SCOPE
- WhatsApp (can't use — no free API)
- Boards, sprints, roadmaps, canvas
- AI assistant with tool loops
- Billing, payments, video meetings

---

## 7. Tech Stack (All Free)

| Layer | Technology | Free Tier |
|---|---|---|
| Frontend | Next.js 14 + Tailwind + Shadcn UI | ✅ Free |
| Backend | Node.js + Express | ✅ Free |
| Database + Auth | Supabase | ✅ Free (500MB) |
| AI | Groq API (Gemma 2 9B) | ✅ Free, no credit card |
| Automation | n8n Cloud | ✅ Free (5 workflows) |
| Messaging | Telegram Bot API | ✅ Free, unlimited |
| Calendar | Google Calendar (shared account via n8n) | ✅ Free |

---

## 8. Repository Structure

```
campusflow/
├── frontend/                    # Next.js 14
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── tasks/page.tsx       # Task list
│   │   ├── tasks/new/page.tsx   # Create task
│   │   ├── notices/page.tsx     # Notice summarizer
│   │   ├── attendance/page.tsx
│   │   └── automations/page.tsx
│   ├── src/components/
│   └── src/lib/
│       ├── supabase.ts
│       └── api.ts
├── backend/                     # Express
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   ├── notices.js
│   │   │   ├── attendance.js
│   │   │   └── automations.js
│   │   ├── services/
│   │   │   ├── supabase.js
│   │   │   ├── groq.js
│   │   │   └── n8n.js
│   │   └── middleware/auth.js
│   └── .env.example
├── n8n/
│   ├── deadline-reminder.json
│   └── notice-broadcast.json
├── sql/
│   └── schema.sql
├── Plan.md
├── TRD.md
├── TRACKER.md
└── README.md
```

---

## 9. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Backend
JWT_SECRET=your-secret-key
PORT=4000

# Groq AI (free)
GROQ_API_KEY=gsk_xxxx

# n8n Webhooks
N8N_DEADLINE_WEBHOOK=https://xxxx.app.n8n.cloud/webhook/deadline
N8N_NOTICE_WEBHOOK=https://xxxx.app.n8n.cloud/webhook/notice

# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## 10. Demo Script (2 Minutes)

**Step 1 (15 sec):** Open CampusFlow dashboard — show it's live.

**Step 2 (20 sec):** Register with real Telegram username.

**Step 3 (30 sec):** Add deadline: "DBMS Assignment due tomorrow 11:59 PM"
- Show Telegram message arrive within 30 seconds
- Open Google Calendar — show event created

**Step 4 (20 sec):** Open Notice Summarizer — paste a college notice
- Show AI 3-bullet summary
- Click "Broadcast" — Telegram messages sent

**Step 5 (15 sec):** Show n8n dashboard — green "Success" logs

**Step 6 (20 sec):** Pitch: *"CampusFlow uses n8n to automatically send Telegram reminders and create Google Calendar events — so no student misses a deadline again."*

---

## 11. Risk Register

| Risk | Mitigation |
|---|---|
| Telegram bot not receiving messages | Test bot early; have backup bot token |
| n8n Cloud workflow limit (5) | Use only 2 workflows |
| Groq API rate limit | Cache responses; fallback to static tips |
| Google Calendar not updating | Use shared team account; verify OAuth before demo |
| Supabase connection limit | Keep connections minimal |
