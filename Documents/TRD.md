# NotifyMe — Technical Requirements Document (TRD)

*Version 2.0 | Updated for multi-group invite flow*

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                           │
│                                                                  │
│   Bot added to group → n8n my_chat_member trigger               │
│       → POST /groups/register → invite link posted in group     │
│                                                                  │
│   Teacher message → n8n Telegram Trigger (teacher filter)       │
│       → POST /extract → POST /calendar/fan-out                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        BACKEND LAYER                             │
│   FastAPI (Python 3.11+)                                         │
│   ├── /groups/register      (auto-register group, gen invite)   │
│   ├── /auth/google-callback (store OAuth refresh token)         │
│   ├── /extract              (Gemini extraction + DB insert)      │
│   ├── /calendar/fan-out     (loop Calendar create per student)  │
│   ├── /reminders/*          (reminder scheduling + marking)     │
│   ├── /attendance/*         (percentage calculator)             │
│   └── /documents/*          (upload + Gemini summary)          │
└──────────────┬──────────────────────────┬────────────────────────┘
               │                          │
┌──────────────▼──────────┐  ┌────────────▼──────────────────────┐
│     PERSISTENCE LAYER   │  │         AI LAYER                   │
│   Supabase (Postgres)   │  │   Gemini 2.5 Flash                 │
│   ├── profiles          │  │   google-generativeai SDK          │
│   ├── groups            │  └────────────────────────────────────┘
│   ├── group_members     │
│   ├── events            │  ┌────────────────────────────────────┐
│   ├── calendar_sync     │  │   CALENDAR LAYER                   │
│   ├── attendance        │  │   Google Calendar API v3           │
│   ├── notifications     │  │   Per-student OAuth refresh tokens │
│   └── documents         │  └────────────────────────────────────┘
└─────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                              │
│   React 18 + Vite + TailwindCSS + shadcn/ui                     │
│   ├── JoinPage.jsx   (invite link → signup → Google OAuth)      │
│   └── Dashboard.jsx  (events scoped by student's groups)        │
│   Reads from Supabase JS client directly (no proxy for reads)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     AUTOMATION LAYER                             │
│   n8n (cloud free tier or self-hosted Docker)                   │
│   ├── campusos-group-register workflow  (my_chat_member)        │
│   ├── campusos-ingestion workflow       (teacher messages)      │
│   └── campusos-reminders workflow       (scheduled polling)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| Frontend | React | 18.x | Industry standard, team familiarity |
| Build tool | Vite | 5.x | Fastest dev HMR |
| Styling | TailwindCSS + shadcn/ui | Tailwind 3.x | Fastest UI from scratch |
| Backend | FastAPI | 0.111+ | Async Python, auto Swagger UI |
| Python runtime | Python | 3.11+ | Required by google-generativeai SDK |
| Database | Supabase (Postgres 15) | Free tier | Postgres + Auth + Storage + JS client |
| AI model | Gemini 2.5 Flash | Latest | Free tier, fast, strong JSON output |
| Automation | n8n | Cloud free / Docker | No-code Telegram + HTTP wiring |
| Calendar | Google Calendar API | v3 | Per-student OAuth, standard |
| Notifications | Telegram Bot API | Latest | Free, already where users are |

---

## 3. Environment Variables

Store in `backend/.env`. Never commit. Provide `backend/.env.example` with all keys empty.

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# AI
GEMINI_API_KEY=AIza...

# Google Calendar OAuth (for per-student flow)
GOOGLE_CALENDAR_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-...
# No single REFRESH_TOKEN — each student's token stored in profiles table

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:AAF...

# App
BACKEND_URL=https://your-deployed-backend.com
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 4. Database Schema

Run this SQL exactly in Supabase SQL Editor. Do not modify column names.

```sql
-- ─────────────────────────────────────────────
-- User profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  attendance_threshold numeric default 75.0,
  google_calendar_refresh_token text,         -- stored after OAuth
  created_at timestamp with time zone default now()
);

-- ─────────────────────────────────────────────
-- Telegram groups (auto-registered when bot joins)
-- ─────────────────────────────────────────────
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  telegram_chat_id bigint unique not null,    -- negative for group chats
  created_at timestamp with time zone default now()
);

-- ─────────────────────────────────────────────
-- Junction: which students belong to which group
-- ─────────────────────────────────────────────
create table public.group_members (
  student_id uuid references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  primary key (student_id, group_id)
);

-- ─────────────────────────────────────────────
-- Core events — belongs to a group, not a user
-- ─────────────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  title text not null,
  event_date date not null,
  priority text check (priority in ('High','Medium','Low')) default 'Medium',
  category text check (category in ('Exam','Assignment','Attendance','Fee','Placement','Other')) default 'Other',
  source text default 'telegram',
  raw_message text,
  created_at timestamp with time zone default now()
);

-- ─────────────────────────────────────────────
-- Per-student Calendar sync log
-- ─────────────────────────────────────────────
create table public.calendar_sync (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  calendar_event_id text,
  synced_at timestamp with time zone default now(),
  unique (event_id, student_id)
);

-- ─────────────────────────────────────────────
-- Attendance records (per student)
-- ─────────────────────────────────────────────
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  total_classes integer not null default 0,
  attended_classes integer not null default 0,
  updated_at timestamp with time zone default now()
);

-- ─────────────────────────────────────────────
-- Reminder tracking (idempotency)
-- ─────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  remind_offset_days integer not null,
  sent boolean default false,
  sent_at timestamp with time zone
);

-- ─────────────────────────────────────────────
-- Uploaded documents and AI summaries
-- ─────────────────────────────────────────────
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  file_path text not null,
  summary text,
  key_points jsonb,
  created_at timestamp with time zone default now()
);
```

**RLS:** OFF for all tables during hackathon. Filter all backend queries by `group_id` or `student_id` explicitly.

---

## 5. Backend — FastAPI

### 5.1 Project Structure

```
backend/
├── app/
│   ├── main.py
│   ├── routers/
│   │   ├── groups.py          # POST /groups/register
│   │   ├── auth.py            # GET /auth/google-callback
│   │   ├── extract.py         # POST /extract
│   │   ├── calendar.py        # POST /calendar/fan-out
│   │   ├── reminders.py       # GET /reminders/due, PATCH mark-sent
│   │   ├── attendance.py      # POST /attendance/calculate
│   │   └── documents.py       # POST /documents/upload
│   └── services/
│       ├── gemini_client.py
│       ├── supabase_client.py
│       └── calendar_client.py
├── requirements.txt
└── .env.example
```

### 5.2 main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import groups, auth, extract, calendar, reminders, attendance, documents

app = FastAPI(title="NotifyMe API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router)
app.include_router(auth.router)
app.include_router(extract.router)
app.include_router(calendar.router)
app.include_router(reminders.router)
app.include_router(attendance.router)
app.include_router(documents.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 5.3 requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-dotenv==1.0.1
supabase==2.4.6
google-generativeai==0.7.2
google-api-python-client==2.131.0
google-auth-oauthlib==1.2.0
google-auth-httplib2==0.2.0
python-multipart==0.0.9
pydantic==2.7.1
httpx==0.27.0
```

---

## 6. Groups Router

```python
# app/routers/groups.py
import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.supabase_client import supabase

router = APIRouter()

class RegisterGroupRequest(BaseModel):
    telegram_chat_id: int
    name: str

@router.post("/groups/register")
def register_group(req: RegisterGroupRequest):
    # Upsert — idempotent if bot is re-added
    existing = supabase.table("groups") \
        .select("id") \
        .eq("telegram_chat_id", req.telegram_chat_id) \
        .execute().data

    if existing:
        group_id = existing[0]["id"]
    else:
        result = supabase.table("groups").insert({
            "telegram_chat_id": req.telegram_chat_id,
            "name": req.name,
        }).execute()
        group_id = result.data[0]["id"]

    frontend_url = os.environ["FRONTEND_URL"]
    invite_link = f"{frontend_url}/join?g={group_id}"

    # Post invite message to the group via Telegram Bot API
    bot_token = os.environ["TELEGRAM_BOT_TOKEN"]
    message = (
        f"✅ NotifyMe is now active in this group!\n\n"
        f"Students, sign up here to get all deadlines automatically "
        f"in your Google Calendar:\n{invite_link}"
    )
    httpx.post(
        f"https://api.telegram.org/bot{bot_token}/sendMessage",
        json={"chat_id": req.telegram_chat_id, "text": message},
    )

    return {"group_id": group_id, "invite_link": invite_link}
```

---

## 7. Google Calendar OAuth — Per-Student Flow

### 7.1 How it works

Each student who signs up via the invite link goes through a standard Google OAuth flow. Their refresh token is stored in `profiles.google_calendar_refresh_token`. When an event is created, the backend loops over all students in the group and uses each student's individual token to create the calendar event on their behalf.

### 7.2 auth.py router

```python
# app/routers/auth.py
import os
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from app.services.supabase_client import supabase

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

def get_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": os.environ["GOOGLE_CALENDAR_CLIENT_ID"],
                "client_secret": os.environ["GOOGLE_CALENDAR_CLIENT_SECRET"],
                "redirect_uris": [f"{os.environ['BACKEND_URL']}/auth/google-callback"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=f"{os.environ['BACKEND_URL']}/auth/google-callback",
    )

@router.get("/auth/google")
def google_auth(student_id: str):
    flow = get_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        state=student_id,  # pass student_id through OAuth state
    )
    return RedirectResponse(auth_url)

@router.get("/auth/google-callback")
def google_callback(code: str, state: str):
    student_id = state
    flow = get_flow()
    flow.fetch_token(code=code)
    refresh_token = flow.credentials.refresh_token

    supabase.table("profiles").update(
        {"google_calendar_refresh_token": refresh_token}
    ).eq("id", student_id).execute()

    frontend_url = os.environ["FRONTEND_URL"]
    return RedirectResponse(f"{frontend_url}/dashboard")
```

### 7.3 calendar_client.py — per-student helper

```python
# app/services/calendar_client.py
import os
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def get_calendar_service_for_student(refresh_token: str):
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=os.environ["GOOGLE_CALENDAR_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CALENDAR_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("calendar", "v3", credentials=creds)

def create_event_for_student(refresh_token: str, title: str, event_date: str) -> str:
    """Creates an all-day event on the student's calendar. Returns calendar_event_id."""
    service = get_calendar_service_for_student(refresh_token)
    body = {
        "summary": title,
        "start": {"date": event_date},
        "end": {"date": event_date},
    }
    created = service.events().insert(calendarId="primary", body=body).execute()
    return created["id"]
```

---

## 8. Calendar Fan-Out Router

```python
# app/routers/calendar.py
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.supabase_client import supabase
from app.services.calendar_client import create_event_for_student

router = APIRouter()

class FanOutRequest(BaseModel):
    event_id: str

@router.post("/calendar/fan-out")
def calendar_fan_out(req: FanOutRequest):
    # Get the event
    event = supabase.table("events") \
        .select("*") \
        .eq("id", req.event_id) \
        .single() \
        .execute().data

    # Get all students in the group with a refresh token
    members = supabase.table("group_members") \
        .select("student_id, profiles(google_calendar_refresh_token)") \
        .eq("group_id", event["group_id"]) \
        .execute().data

    results = []
    for member in members:
        token = member["profiles"]["google_calendar_refresh_token"]
        if not token:
            results.append({"student_id": member["student_id"], "status": "skipped_no_token"})
            continue
        try:
            cal_event_id = create_event_for_student(
                token, event["title"], event["event_date"]
            )
            supabase.table("calendar_sync").upsert({
                "event_id": req.event_id,
                "student_id": member["student_id"],
                "calendar_event_id": cal_event_id,
            }).execute()
            results.append({"student_id": member["student_id"], "status": "synced"})
        except Exception as e:
            results.append({"student_id": member["student_id"], "status": "failed", "error": str(e)})

    return {"event_id": req.event_id, "results": results}
```

---

## 9. Gemini Extraction Service

### 9.1 System Prompt (canonical — freeze after testing)

```python
SYSTEM_PROMPT = """
You are a deadline-extraction engine for a college student app.
You will receive a raw message from a Telegram group sent by a teacher.
Your job: decide if it contains an actionable academic deadline or important date, and if so extract it.

Respond with ONLY valid JSON, no markdown, no explanation, no backticks. Use this exact schema:

{
  "is_relevant": true or false,
  "title": "short title of the deadline/event",
  "date": "YYYY-MM-DD",
  "priority": "High" or "Medium" or "Low",
  "category": "Exam" or "Assignment" or "Attendance" or "Fee" or "Placement" or "Other"
}

Rules:
- If the message has NO clear date or deadline, set is_relevant to false and leave other fields as null.
- Today's date is {today_date}. Resolve relative dates ("tomorrow", "next Monday", "in 3 days") against this.
- Exams and hall tickets = High priority. Fee/Attendance forms = Medium-High. Club events = Low.
- If multiple deadlines are in one message, extract only the most urgent (earliest date).
"""
```

### 9.2 extract.py router

```python
# app/routers/extract.py
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_client import extract_deadline
from app.services.supabase_client import supabase

router = APIRouter()

class ExtractRequest(BaseModel):
    group_id: str
    raw_message: str

@router.post("/extract")
def extract(req: ExtractRequest):
    result = extract_deadline(req.raw_message)
    if not result.get("is_relevant"):
        return {"saved": False, "reason": "not relevant"}

    row = {
        "group_id": req.group_id,
        "title": result["title"],
        "event_date": result["date"],
        "priority": result["priority"],
        "category": result["category"],
        "raw_message": req.raw_message,
        "source": "telegram",
    }
    inserted = supabase.table("events").insert(row).execute()
    return {"saved": True, "event": inserted.data[0]}
```

---

## 10. Attendance Calculator

### 10.1 Formula (verified)

```
current_pct = (attended / total) × 100

If current_pct >= threshold:
    can_skip = floor((attended × 100 / threshold) − total)

If current_pct < threshold:
    classes_needed = ceil((threshold × total − 100 × attended) / (100 − threshold))
```

**Verification:** total=80, attended=58, threshold=75
- current_pct = 72.5%
- classes_needed = ceil((6000 − 5800) / 25) = ceil(8) = **8**

> ⚠️ The answer is **8**. The demo script, dashboard, and PRD all use 8. Do not use 6.

### 10.2 attendance.py router

```python
from fastapi import APIRouter
from pydantic import BaseModel
import math

router = APIRouter()

class AttendanceRequest(BaseModel):
    total: int
    attended: int
    threshold: float = 75.0

@router.post("/attendance/calculate")
def calculate_attendance(req: AttendanceRequest):
    if req.total == 0:
        return {"current_pct": 0.0, "status": "no_data"}

    current_pct = (req.attended / req.total) * 100

    if current_pct >= req.threshold:
        can_skip = math.floor((req.attended * 100 / req.threshold) - req.total)
        return {
            "current_pct": round(current_pct, 1),
            "status": "safe",
            "can_skip": max(can_skip, 0),
        }
    else:
        classes_needed = math.ceil(
            (req.threshold * req.total - 100 * req.attended) / (100 - req.threshold)
        )
        return {
            "current_pct": round(current_pct, 1),
            "status": "below_threshold",
            "classes_needed": classes_needed,
        }
```

---

## 11. Reminder Engine

```python
# app/routers/reminders.py
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
from app.services.supabase_client import supabase

router = APIRouter()
REMINDER_OFFSETS = [7, 3, 1]

@router.get("/reminders/due")
def get_due_reminders():
    today = date.today()
    events = supabase.table("events").select("*, groups(telegram_chat_id)").execute().data
    due = []

    for ev in events:
        days_left = (date.fromisoformat(ev["event_date"]) - today).days
        if days_left not in REMINDER_OFFSETS:
            continue
        already_sent = supabase.table("notifications") \
            .select("id") \
            .eq("event_id", ev["id"]) \
            .eq("remind_offset_days", days_left) \
            .eq("sent", True) \
            .execute().data
        if not already_sent:
            due.append({
                **ev,
                "days_left": days_left,
                "telegram_chat_id": ev["groups"]["telegram_chat_id"],
            })

    return due

@router.patch("/reminders/{event_id}/mark-sent")
def mark_sent(event_id: str, remind_offset_days: int):
    supabase.table("notifications").insert({
        "event_id": event_id,
        "remind_offset_days": remind_offset_days,
        "sent": True,
        "sent_at": "now()",
    }).execute()
    return {"ok": True}
```

---

## 12. n8n Workflows

### 12.1 Workflow 1: campusos-group-register (NEW)

Fires when the bot is added to any Telegram group.

| Step | Node Type | Configuration |
|---|---|---|
| 1 | Telegram Trigger | Bot Token credential; trigger on `my_chat_member` update type |
| 2 | IF | Condition: `{{$json.my_chat_member.new_chat_member.status}} === "member"` AND `{{$json.my_chat_member.chat.type}}` in ["group", "supergroup"] |
| 3 (true) | HTTP Request | POST `{{$env.BACKEND_URL}}/groups/register`; body: `{"telegram_chat_id": {{$json.my_chat_member.chat.id}}, "name": "{{$json.my_chat_member.chat.title}}"}` |
| 4 (false) | No-Op | Bot was removed — do nothing |

**Export:** Save as `/automation/campusos-group-register.json`.

### 12.2 Workflow 2: campusos-ingestion (UPDATED)

Fires on every message. Filters to teacher messages only, then extracts + fans out.

| Step | Node Type | Configuration |
|---|---|---|
| 1 | Telegram Trigger | Bot Token credential; trigger on `message` |
| 2 | IF — teacher check | Condition: `{{$json.message.from.id}}` is in teacher whitelist OR `{{$json.message.text}}` starts with `/create`. Teacher IDs stored as n8n env var `TEACHER_IDS` (comma-separated). |
| 3 (false) | No-Op | Non-teacher message — discard |
| 4 | Set | Map `raw_message = {{$json.message.text}}`; `chat_id = {{$json.message.chat.id}}` |
| 5 | HTTP Request | GET `{{$env.BACKEND_URL}}/groups/by-chat-id?chat_id={{$json.chat_id}}` → get `group_id` |
| 6 | HTTP Request | POST `{{$env.BACKEND_URL}}/extract`; body: `{"group_id": "{{$json.group_id}}", "raw_message": "{{$json.raw_message}}"}` |
| 7 | IF | Condition: `{{$json.saved}} === true` |
| 8a (true) | HTTP Request | POST `{{$env.BACKEND_URL}}/calendar/fan-out`; body: `{"event_id": "{{$json.event.id}}"}` |
| 8b (false) | No-Op | Not relevant — discard |

> Add a helper endpoint `GET /groups/by-chat-id?chat_id=` to the groups router that returns the `group_id` for a given `telegram_chat_id`.

**Export:** Save as `/automation/campusos-ingestion.json`.

### 12.3 Workflow 3: campusos-reminders (UPDATED)

The reminder now sends to the specific group's chat, not a hardcoded chat ID.

| Step | Node Type | Configuration |
|---|---|---|
| 1 | Schedule Trigger | Every 30 minutes |
| 2 | HTTP Request | GET `{{$env.BACKEND_URL}}/reminders/due` |
| 3 | SplitInBatches | Batch size 1 |
| 4 | Telegram | Send message: `⚠️ {{$json.title}} is in {{$json.days_left}} day(s) — {{$json.event_date}}`; Chat ID: `{{$json.telegram_chat_id}}` (from reminder response, not env) |
| 5 | HTTP Request | PATCH `{{$env.BACKEND_URL}}/reminders/{{$json.id}}/mark-sent?remind_offset_days={{$json.days_left}}` |

**Export:** Save as `/automation/campusos-reminders.json`.

---

## 13. Frontend — React

### 13.1 Routing

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import JoinPage from './pages/JoinPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/join" element={<JoinPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 13.2 JoinPage.jsx

```jsx
// src/pages/JoinPage.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function JoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const groupId = searchParams.get('g')

  const [groupName, setGroupName] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('loading') // loading | confirm | signup | connect_calendar | done

  useEffect(() => {
    if (!groupId) return
    supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()
      .then(({ data }) => {
        if (data) {
          setGroupName(data.name)
          setStep('confirm')
        }
      })
  }, [groupId])

  async function handleSignup() {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (!error) setStep('connect_calendar')
  }

  async function handleConnectCalendar() {
    // Get current session to retrieve student_id
    const { data: { session } } = await supabase.auth.getSession()
    const studentId = session.user.id

    // Insert group_members row
    await supabase.from('group_members').upsert({
      student_id: studentId,
      group_id: groupId,
    })

    // Redirect to backend Google OAuth, passing student_id in state
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    window.location.href = `${backendUrl}/auth/google?student_id=${studentId}`
  }

  if (step === 'loading') return <p>Loading...</p>

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {step === 'confirm' && (
          <>
            <h1 className="text-2xl font-medium">Join {groupName}</h1>
            <p className="text-gray-500">
              Sign up to get all deadlines from this group automatically
              in your Google Calendar.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
            <button
              onClick={handleSignup}
              className="w-full bg-black text-white rounded-lg px-4 py-2"
            >
              Sign up with Email
            </button>
          </>
        )}

        {step === 'connect_calendar' && (
          <>
            <h1 className="text-2xl font-medium">Check your email</h1>
            <p className="text-gray-500">
              Click the magic link, then come back here to connect
              your Google Calendar.
            </p>
            <button
              onClick={handleConnectCalendar}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2"
            >
              Connect Google Calendar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

### 13.3 useEvents hook — group-scoped

```javascript
// src/hooks/useEvents.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useEvents(studentId) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!studentId) return

    // Fetch events from all groups the student belongs to
    supabase
      .from('events')
      .select('*, groups!inner(id, name, group_members!inner(student_id))')
      .eq('groups.group_members.student_id', studentId)
      .order('event_date', { ascending: true })
      .then(({ data }) => setEvents(data || []))

    // Realtime: any new event in any of the student's groups
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          // Re-fetch to verify it belongs to student's group
          supabase
            .from('events')
            .select('*, groups!inner(id, group_members!inner(student_id))')
            .eq('id', payload.new.id)
            .eq('groups.group_members.student_id', studentId)
            .single()
            .then(({ data }) => {
              if (data) setEvents(prev => [...prev, data])
            })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [studentId])

  return events
}
```

### 13.4 Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@supabase/supabase-js": "^2.43.4",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.383.0",
    "@radix-ui/react-dialog": "latest",
    "react-calendar": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.3",
    "autoprefixer": "^10.4.19"
  }
}
```

Note: `react-router-dom` is new — needed for the `/join` route.

---

## 14. API Reference — Complete Endpoint List

| Method | Path | Description |
|---|---|---|
| GET | /health | Health check |
| POST | /groups/register | Auto-register group; generate + post invite link |
| GET | /groups/by-chat-id | Get group_id for a telegram_chat_id (used by n8n) |
| GET | /auth/google | Redirect student to Google OAuth consent screen |
| GET | /auth/google-callback | Receive OAuth code; store refresh token; redirect to dashboard |
| POST | /extract | Extract deadline from raw message; insert to events with group_id |
| POST | /calendar/fan-out | Create calendar event for all students in the event's group |
| GET | /reminders/due | Return all reminders due today (1/3/7-day offsets) with telegram_chat_id |
| PATCH | /reminders/{event_id}/mark-sent | Insert sent notification record |
| POST | /attendance/calculate | Calculate attendance % and classes needed |
| GET | /attendance/{user_id} | Get stored attendance record |
| PUT | /attendance/{user_id} | Update total/attended class counts |
| POST | /documents/upload | Upload PDF; generate Gemini summary |
| GET | /documents/{user_id} | List all documents and summaries |

---

## 15. Deployment

### Backend (Railway)

```bash
# Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set all env vars in Railway dashboard. Add `FRONTEND_URL` pointing to Vercel deployment.

### Frontend (Vercel)

```bash
npm run build
```

Set in Vercel env:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BACKEND_URL`

### n8n (Cloud Free Tier)

- Import all three workflow JSONs from `automation/`
- Set credential: Telegram Bot Token
- Set env vars: `BACKEND_URL`, `TEACHER_IDS` (comma-separated Telegram user IDs of teachers)

---

## 16. Testing Checklist (Run Before Demo)

### Group Registration

- [ ] Add bot to test group → `groups` row created in Supabase
- [ ] Invite link message posted by bot in the group
- [ ] Add bot to same group again → no duplicate row

### Student Signup

- [ ] Navigate to `campusos.app/join?g={group_id}` → group name displayed correctly
- [ ] Complete email + magic link auth
- [ ] Click "Connect Google Calendar" → OAuth consent → redirect to dashboard
- [ ] `group_members` row exists after signup
- [ ] `profiles.google_calendar_refresh_token` populated

### Backend

- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `POST /extract` with "Mid Semester Exam starts from July 5th." → `saved: true`, Exam, High
- [ ] `POST /extract` with "lol who's up for FIFA tonight" → `saved: false`
- [ ] `POST /calendar/fan-out` → calendar event appears in both test student calendars
- [ ] `GET /reminders/due` with a test event 1 day away → event in response with correct `telegram_chat_id`
- [ ] `POST /attendance/calculate` total=80, attended=58, threshold=75 → `classes_needed: 8`

### End-to-End

- [ ] Teacher sends message → event in Supabase within 15 seconds
- [ ] Event in Supabase → calendar event in both student calendars within 30 seconds
- [ ] Event in correct group only (other groups unaffected)
- [ ] Reminder fires to correct Telegram group, not a hardcoded chat

---

## 17. Known Limitations and Mitigations

| Limitation | Impact | Mitigation |
|---|---|---|
| n8n polls every 30 min for reminders | Reminders late by up to 30 min | Acceptable for hackathon |
| Gemini rate limit during demo | Extraction throttles | Cache last result; Postman fallback ready |
| Teacher whitelist hardcoded in n8n env | Only pre-listed teacher IDs trigger extraction | Add teacher IDs to `TEACHER_IDS` env var before demo |
| Student OAuth must be done before demo | Signup flow not run live on stage | Pre-create 2–3 demo student accounts |
| Student token revoked | Calendar sync fails for that student | Logged in `calendar_sync`; other students unaffected |
| Supabase join query complexity | `useEvents` query may be slow | Fallback: fetch group_ids first, then query events separately |
| Google OAuth callback URL must be registered | OAuth fails if URL not whitelisted | Add Railway backend URL to Google Cloud Console OAuth redirect URIs |
