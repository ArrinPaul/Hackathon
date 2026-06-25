# NotifyMe — Plan

*Version 2.0 | Updated for multi-group invite flow*

---

## 1. One-Line Product Statement

NotifyMe turns scattered Telegram announcements into structured calendar events, reminders, and a live student dashboard — automatically, scoped per classroom group, with no manual input required from the student.

---

## 2. The Core Loop (Everything Else is Optional)

```
Teacher adds bot to Telegram group
  → n8n my_chat_member trigger fires
    → POST /groups/register (auto-registers group, stores chat_id)
      → Bot posts invite link in group: campusos.app/join?g={group_id}
        → Students click link, sign up, connect Google Calendar
          → group_members row inserted (student linked to group)

Teacher sends "Test on 6/8/2026" in the group
  → n8n Telegram Trigger
    → Filter: is sender a teacher? (role check or /create command)
      → HTTP POST to FastAPI /extract
        → Gemini 2.5 Flash parses structured deadline JSON
          → Saved to Supabase events table (with group_id)
            → Fetch all students in that group
              → Loop: Google Calendar event created per student (their OAuth token)
                → Reminder rows inserted (7/3/1 days before)
                  → Telegram Bot sends alert when due
                    → React Dashboard reads and displays live
```

This loop must be fully working before any V2/V3 feature is touched.

---

## 3. Version Scope

### V1 — Core (Hours 0–8) — NON-NEGOTIABLE

| Feature | Done Criterion |
|---|---|
| Supabase schema live | All 7 tables created, no errors |
| Group auto-registration | Bot added to group → groups row created → invite link posted |
| Student signup + OAuth | Student clicks invite link → linked to group → Google Calendar connected |
| Gemini extraction endpoint | All 5 test cases pass via curl/Postman |
| n8n ingestion workflow | A real teacher Telegram message creates a Supabase events row with group_id |
| Google Calendar fan-out | Event created in every signed-up student's calendar in that group |
| Reminder engine | `/reminders/due` returns correct events; Telegram message fires |
| React Dashboard | Events, attendance, and alerts render with real data |
| Attendance calculator | Formula correct for the test case |

### V2 — High Impact, Optional (Hours 8–10.5)

Build only after all V1 done-criteria are checked.

| Feature | Effort | Payoff |
|---|---|---|
| PDF upload + Gemini summary | Medium | High — judges love AI-on-docs |
| Priority color coding in dashboard | Low | Medium |
| Minimal RAG chatbot (context stuffing, no vector DB) | High | High if polished |

### V3 — Bonus, Pick ONE (Hours 10.5–11.5)

Never attempt both. Choose based on team energy.

| Feature | Notes |
|---|---|
| MCQ generator from notes/PDF | Send a Gemini prompt with uploaded text, parse 5 MCQs |
| Excalidraw canvas embed | Simple iframe embed of excalidraw.com, no custom sync needed |

**Default pick: Excalidraw.** Lower risk — doesn't depend on V2 PDF upload being done.

### Cut List (Out of Scope)

- Row Level Security (RLS) in Supabase — filter by user_id/group_id in backend instead
- Multi-event-per-message extraction — extract only the most urgent in V1
- WhatsApp integration — Business API setup too slow for hackathon
- OAuth login polish — Supabase magic link only
- Vector database / embeddings — context-stuffing for chatbot

---

## 4. Hour-by-Hour Execution Schedule

| Hour | What Gets Built | Owner | Gate |
|---|---|---|---|
| 0–1 | Repo setup, `.env` template, Supabase schema SQL (all 7 tables), React scaffold with Vite | All | Schema visible in Supabase dashboard |
| 1–2 | FastAPI skeleton: `/health`, `/groups/register` stub, Supabase client, Gemini client | Backend | `curl /health` returns 200; bot added to group → row in groups table |
| 2–4 | Gemini extraction logic complete + all 5 test cases passing; n8n `my_chat_member` workflow done | Backend + Automation | Manual curl tests pass; invite link posted in test group |
| 4–5 | Student signup page (JoinPage.jsx) + Google Calendar OAuth flow | Frontend + Backend | Student clicks invite link → group_members row created → refresh token stored |
| 5–6 | n8n ingestion workflow: Telegram message → /extract → Supabase row with group_id | Automation + Backend | One real teacher message creates an events row |
| 6–7 | Google Calendar fan-out: fetch group members → loop create-event per student | Backend + AI | Event appears in 2 test student calendars |
| 7–8 | React Dashboard: fetch events by group, render cards, attendance widget, calendar view | Frontend | Dashboard shows live data |
| 8–9 | Full end-to-end dry run. Fix only blocking bugs. | All | Demo script runs without interruption |
| 9–10 | V2: PDF upload UI + `/documents/upload` + Gemini summary | Backend + Frontend | PDF summary visible in dashboard |
| 10–10.5 | V2: RAG chatbot stub or priority color-coding | Frontend + AI | Works without breaking dashboard |
| 10.5–11.5 | V3: Excalidraw embed (default) or MCQ generator | TBD | Doesn't break V1 or V2 |
| 11.5–12 | Seed realistic demo data, rehearse script twice, freeze codebase | All | No new commits after 11:45 |

---

## 5. Team Roles

| Person | Primary Responsibility | Secondary |
|---|---|---|
| Frontend | Dashboard UI, JoinPage.jsx, calendar view, attendance widget, file upload UI | Seeding demo data |
| Backend | FastAPI routes (including /groups/register, /calendar/fan-out), Supabase client, attendance logic | Deployment to Railway |
| Automation | n8n workflows (my_chat_member + ingestion + reminders), Telegram Bot setup | Backup n8n JSONs to repo |
| AI/Integration | Gemini prompt engineering, Calendar API client (per-student OAuth), document summary | RAG chatbot (V2) |

---

## 6. Hard Guardrails

1. **Hour 6 check:** If extraction + Calendar fan-out aren't both working, drop the reminder engine. Keep extraction + Calendar + Dashboard.
2. **Never debug two layers simultaneously.** If extraction is broken, don't touch the Calendar API. Isolate.
3. **Every V2/V3 feature must be removable in 30 seconds** without breaking V1. Use feature flags or separate routes.
4. **No new features after 11:45.** Only bug fixes on the demo path.
5. **Freeze the Gemini prompt** once all 5 test cases pass. Do not tweak it live.
6. **Pre-create 2–3 student demo accounts** before the demo. Don't run the full signup flow live on stage — show the dashboard already loaded.

---

## 7. Demo Script (Rehearse Twice Before Judging)

**Setup (before judges arrive):**
- Two student accounts already signed up and linked to the demo group
- Both student Google Calendars open in separate tabs
- Supabase dashboard open on `events` table and `group_members` table
- React dashboard loaded and showing existing seed data

**Step 1:** Show the group setup — Supabase `groups` table with the demo group row. Show `group_members` with 2 students linked. Explain the invite link flow briefly.

**Step 2:** Send this message into the Telegram group as the teacher:

> "Mid Semester Exam starts from July 5th."

**Step 3:** Within ~10 seconds, show:
- New event row in Supabase `events` table (with group_id)
- Both student Google Calendars updated (tabs already open)
- Dashboard refreshed with the new event card

**Step 4:** Show the attendance tracker:
- Input: 80 total classes, 58 attended
- Output: "72.5% — you need 8 more classes to reach 75%"

**Step 5 (V2):** Upload a course PDF. Show the AI bullet summary appearing.

**Step 6 (V3):** Show Excalidraw canvas or MCQ output briefly.

**Pitch:** *"NotifyMe connects to your existing Telegram group. Teachers send announcements the way they always have. Students sign up once, connect Google Calendar, and never miss a deadline again — automatically scoped to their classroom."*

---

## 8. Risk Register

| Risk | Mitigation |
|---|---|
| Google Calendar OAuth expires during demo | Use Service Account per student — no token refresh |
| Gemini API rate limit during demo | Cache last response; have pre-extracted JSON as fallback |
| n8n cloud instance down | Export workflow JSONs to repo; trigger `/extract` manually via Postman |
| Student OAuth flow breaks live | Pre-create demo accounts before demo, don't run signup on stage |
| Supabase free tier connection limit | Use connection pooler; keep backend connections minimal |
| React build fails | Keep `npm run dev` running; don't `npm install` after hour 10 |
| my_chat_member trigger not firing | Have `/groups/register` curl command ready as manual fallback |

---

## 9. Repository Structure

```
campusos/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── groups.py          # POST /groups/register
│   │   │   ├── extract.py         # POST /extract
│   │   │   ├── calendar.py        # POST /calendar/fan-out
│   │   │   ├── reminders.py       # GET /reminders/due, PATCH mark-sent
│   │   │   ├── attendance.py      # POST /attendance/calculate
│   │   │   └── documents.py       # POST /documents/upload
│   │   └── services/
│   │       ├── gemini_client.py
│   │       ├── supabase_client.py
│   │       └── calendar_client.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── JoinPage.jsx       # NEW: invite link landing + signup + OAuth
│   │   ├── components/
│   │   │   ├── TodayTasksCard.jsx
│   │   │   ├── UpcomingDeadlinesCard.jsx
│   │   │   ├── CriticalAlertsCard.jsx
│   │   │   ├── AttendanceCard.jsx
│   │   │   └── CalendarView.jsx
│   │   └── lib/
│   │       └── supabaseClient.js
│   ├── package.json
│   └── vite.config.js
├── automation/
│   ├── campusos-group-register.json   # NEW: my_chat_member → /groups/register
│   ├── campusos-ingestion.json        # UPDATED: teacher filter + group_id
│   └── campusos-reminders.json
├── sql/
│   └── schema.sql                     # UPDATED: 7 tables
├── docs/
│   ├── PLAN.md
│   ├── PRD.md
│   └── TRD.md
└── README.md
```
