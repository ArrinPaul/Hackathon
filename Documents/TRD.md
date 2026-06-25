# CampusFlow — Technical Requirements Document (TRD)
*CampusAI Hackathon 2025 | Telegram + Google Calendar*

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                         │
│   Next.js 14 (App Router) + Tailwind CSS + Shadcn UI       │
│   ├── Login / Signup                                        │
│   ├── Dashboard (tasks, deadlines, AI tip)                  │
│   ├── Task CRUD (create deadlines)                          │
│   ├── Notice Summarizer (AI + broadcast)                    │
│   ├── Attendance Tracker                                    │
│   └── Automations log                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                      BACKEND LAYER                          │
│   Node.js + Express                                         │
│   ├── /api/auth/*        (register, login, JWT)             │
│   ├── /api/tasks/*       (CRUD + n8n trigger)               │
│   ├── /api/notices/*     (summarize + broadcast)            │
│   ├── /api/ai/*          (Groq AI endpoints)                │
│   ├── /api/attendance/*  (save + risk alert)                │
│   └── /api/automations/* (log viewer)                       │
└───────┬──────────────────────────┬──────────────────────────┘
        │                          │
┌───────▼──────────┐  ┌────────────▼──────────────────────────┐
│   SUPABASE       │  │            n8n CLOUD                   │
│   ├── Auth        │  │   ├── Workflow 1: Deadline Reminder    │
│   ├── Database    │  │   │   Webhook → Calendar → Wait → TG  │
│   └── Realtime    │  │   └── Workflow 2: Notice Broadcast    │
│                   │  │       Webhook → Calendar → Loop → TG  │
└───────────────────┘  └────────────┬──────────────────────────┘
                                    │
                       ┌────────────▼──────────────────────────┐
                       │        EXTERNAL SERVICES               │
                       │   ├── Telegram Bot API (free)          │
                       │   ├── Google Calendar (shared account) │
                       │   └── Groq AI (free)                   │
                       └───────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 + Tailwind + Shadcn UI | Fast, responsive |
| Backend | Node.js + Express | Simple REST API |
| Database | Supabase (PostgreSQL) | Free 500MB + Auth |
| AI | Groq API (Gemma 2 9B) | Free, fast, no credit card |
| Automation | n8n Cloud | Free 5 workflows |
| Messaging | Telegram Bot API | Free, unlimited, instant |
| Calendar | Google Calendar (shared) | Free via n8n OAuth2 |

---

## 3. Database Schema (Supabase)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  year INTEGER NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  telegram_username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks / Deadlines
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  reminder_time TIMESTAMPTZ,
  add_to_calendar BOOLEAN DEFAULT TRUE,
  status TEXT CHECK (status IN ('pending','completed','cancelled')) DEFAULT 'pending',
  n8n_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notices
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  notice_text TEXT NOT NULL,
  ai_summary TEXT,
  event_date DATE,
  event_title TEXT,
  broadcast_status TEXT CHECK (broadcast_status IN ('pending','sent','failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  total_classes INTEGER NOT NULL DEFAULT 0,
  attended_classes INTEGER NOT NULL DEFAULT 0,
  threshold NUMERIC DEFAULT 75.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Logs
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  workflow_type TEXT CHECK (workflow_type IN ('deadline_reminder','notice_broadcast','attendance_alert')) NOT NULL,
  status TEXT CHECK (status IN ('triggered','success','failed')) DEFAULT 'triggered',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Backend API

### 4.1 Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login → JWT |
| GET | /api/auth/me | Get current user |
| POST | /api/tasks | Create task + trigger n8n |
| GET | /api/tasks | List tasks |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/notices/summarize | AI summarize |
| POST | /api/notices/broadcast | Trigger n8n broadcast |
| GET | /api/notices | List notices |
| POST | /api/attendance | Save attendance |
| GET | /api/attendance | Get attendance |
| POST | /api/ai/attendance-alert | AI risk assessment |
| GET | /api/automations | List logs |

### 4.2 Task Creation + n8n Trigger

```javascript
// POST /api/tasks
router.post("/", authMiddleware, async (req, res) => {
  const { title, subject, description, deadline, reminder_time, add_to_calendar } = req.body;

  // 1. Save to Supabase
  const { data: task } = await supabase
    .from("tasks")
    .insert({
      student_id: req.student.id,
      title, subject, description, deadline,
      reminder_time: reminder_time || new Date(new Date(deadline).getTime() - 86400000),
      add_to_calendar
    })
    .select().single();

  // 2. Trigger n8n if enabled
  if (add_to_calendar) {
    await triggerN8nDeadline({
      studentName: req.student.name,
      telegramUsername: req.student.telegram_username,
      subject,
      deadline,
      taskTitle: title
    });

    await supabase.from("automation_logs").insert({
      student_id: req.student.id,
      workflow_type: "deadline_reminder",
      status: "triggered",
      details: { task_id: task.id, title }
    });
  }

  res.json({ task });
});
```

### 4.3 n8n Webhook Caller

```javascript
// services/n8n.js
import axios from "axios";

export async function triggerN8nDeadline(data) {
  try {
    await axios.post(process.env.N8N_DEADLINE_WEBHOOK, data, { timeout: 10000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function triggerN8nNotice(data) {
  try {
    await axios.post(process.env.N8N_NOTICE_WEBHOOK, data, { timeout: 10000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 4.4 Groq AI Client

```javascript
// services/groq.js
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function summarizeNotice(text) {
  const res = await groq.chat.completions.create({
    model: "gemma2-9b-it",
    messages: [
      { role: "system", content: "Summarize college notices in exactly 3 concise bullet points. Be specific about dates." },
      { role: "user", content: text }
    ],
    temperature: 0.3,
    max_tokens: 200
  });
  return res.choices[0]?.message?.content || "Could not summarize.";
}

export async function getStudyTip() {
  const res = await groq.chat.completions.create({
    model: "gemma2-9b-it",
    messages: [
      { role: "system", content: "Give one short, encouraging study tip (1-2 sentences)." },
      { role: "user", content: "Give me a study tip." }
    ],
    temperature: 0.8,
    max_tokens: 100
  });
  return res.choices[0]?.message?.content || "Take regular breaks!";
}

export async function attendanceAlert(subject, total, attended, threshold = 75) {
  const pct = ((attended / total) * 100).toFixed(1);
  if (pct >= threshold) {
    const canSkip = Math.floor((attended * 100 / threshold) - total);
    return { percentage: pct, message: `${subject}: ${pct}%. You can skip ${canSkip} more classes.`, isAtRisk: false };
  } else {
    const needed = Math.ceil((threshold * total - 100 * attended) / (100 - threshold));
    return { percentage: pct, message: `${subject}: ⚠️ ${pct}%. Need ${needed} more classes to reach ${threshold}%.`, isAtRisk: true };
  }
}
```

---

## 5. n8n Workflow Blueprints

### 5.1 Workflow 1 — Deadline Reminder

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│  Webhook     │───▶│  Set Node   │───▶│ Google Calendar  │
│  (receive)   │    │ (format)    │    │ (create event)   │
└─────────────┘    └─────────────┘    └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │    Wait Node     │
                                      │ (until reminder) │
                                      └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   Telegram Node  │
                                      │ (send reminder)  │
                                      └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │    Wait Node     │
                                      │ (1 hour before)  │
                                      └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   Telegram Node  │
                                      │ (final nudge)    │
                                      └─────────────────┘
```

**Node Configurations:**

**Webhook Node:**
- Method: POST
- Path: `/webhook/deadline`

**Set Node:**
```
studentName: {{ $json.studentName }}
telegramUsername: {{ $json.telegramUsername }}
subject: {{ $json.subject }}
taskTitle: {{ $json.taskTitle }}
deadline: {{ $json.deadline }}
reminderTime: {{ DateTime.fromISO($json.deadline).minus({ hours: 24 }).toISO() }}
finalTime: {{ DateTime.fromISO($json.deadline).minus({ hours: 1 }).toISO() }}
```

**Google Calendar Node:**
- Operation: Create Event
- Title: {{ $json.taskTitle }}
- Start: {{ $json.deadline }}
- Description: "Tracked by CampusFlow"

**Telegram Node (Message):**
- Chat ID: @{{ $json.telegramUsername }} (or use getUpdates to find chat_id)
- Text:
```
📚 *Deadline Reminder*

Hi {{ $json.studentName }}!
Your *{{ $json.subject }}* task "{{ $json.taskTitle }}" is due tomorrow!

Check your Google Calendar for details.
— CampusFlow 🎓
```

### 5.2 Workflow 2 — Notice Broadcast

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Webhook     │───▶│ Google Calendar  │───▶│   Split In      │
│  (receive)   │    │ (create event)   │    │   Batches       │
└─────────────┘    └─────────────────┘    └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │  Telegram Node   │
                                           │ (send to each)   │
                                           └─────────────────┘
```

**Telegram Broadcast Message:**
```
📢 *Notice Alert*

{{ $json.aiSummary }}

📅 Event: {{ $json.eventTitle }}
📆 Date: {{ $json.eventDate }}

Added to your Google Calendar!
— CampusFlow 🎓
```

---

## 6. Frontend Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Hero, features, CTA |
| Login | `/login` | Email + password |
| Signup | `/signup` | Registration form |
| Dashboard | `/dashboard` | Tasks, deadlines, AI tip |
| Tasks | `/tasks` | Task list |
| Create Task | `/tasks/new` | Deadline form |
| Notices | `/notices` | AI summarizer + broadcast |
| Attendance | `/attendance` | Risk tracker |
| Automations | `/automations` | n8n logs |

---

## 7. Google Calendar Setup (One-Time)

```
1. Create a shared Google account (e.g., campusflow-demo@gmail.com)
2. In n8n: Settings → Credentials → Add "Google Calendar OAuth2"
3. Click "Connect" → authorize with the shared account
4. In n8n Workflow 1: select the shared calendar
5. Done! All events go to that shared calendar
```

---

## 8. Telegram Bot Setup (2 Minutes)

```
1. Open Telegram → search @BotFather
2. Send /newbot → name it "CampusFlow Bot"
3. Get the bot token (format: 1234567890:ABCdef...)
4. Save token in .env as TELEGRAM_BOT_TOKEN
5. In n8n: add "Telegram" node → paste bot token as credential
6. Users message the bot → bot can send messages back
```

---

## 9. Free Tier Limits

| Service | Free Limit | Our Usage |
|---|---|---|
| Supabase | 500MB, 50K MAU | Under |
| Groq | 30 req/min | Low |
| n8n Cloud | 5 workflows | Using 2 |
| Telegram | Unlimited | Low |
| Google Calendar | Unlimited | Low |
| Vercel | 100GB | Under |

---

## 10. Testing Checklist

### Backend
- [ ] Register → student in Supabase
- [ ] Login → JWT returned
- [ ] Create task → n8n webhook triggered
- [ ] Summarize notice → AI summary returned
- [ ] Broadcast → n8n webhook triggered
- [ ] Save attendance → record saved
- [ ] Get automations → logs returned

### n8n
- [ ] Workflow 1: Calendar event created + Telegram message sent
- [ ] Workflow 2: Calendar event + Telegram broadcast sent
- [ ] Both show green "Success"

### Frontend
- [ ] Landing page renders
- [ ] Signup/login works
- [ ] Dashboard shows tasks + AI tip
- [ ] Task creation with calendar toggle
- [ ] Notice summarizer shows AI summary
- [ ] Attendance tracker calculates risk
- [ ] Mobile responsive

### End-to-End
- [ ] Register → deadline → Telegram msg → Calendar event
- [ ] Notice → AI summary → broadcast → Telegram received
- [ ] Full demo run-through
