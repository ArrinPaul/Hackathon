# CampusFlow V1 — Task Tracker
*MVP Hackathon Sprint | 3 Hours*

---

## Legend
- `[x]` Done
- `[ ]` To Do
- `[~]` In Progress

---

## Phase 1 — Project Setup (0:00–0:20)

### 1.1 Frontend (Next.js 14)
- [x] `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [x] Install Shadcn UI dependencies (class-variance-authority, clsx, tailwind-merge, radix primitives)
- [ ] Create Shadcn components: button, card, input, label, badge, separator
- [x] Configure `globals.css` with design tokens (colors, typography, spacing, rounded)
- [x] Create `src/lib/utils.ts` — cn() helper
- [x] Create `src/lib/supabase.ts` — Supabase browser client
- [x] Create `src/lib/api.ts` — Backend API helper with JWT
- [x] Verify dev server: `npm run dev`

### 1.2 Backend (Express)
- [x] `mkdir backend && cd backend && npm init -y`
- [x] Install deps: express, cors, dotenv, jsonwebtoken, bcryptjs, groq-sdk, axios, @supabase/supabase-js
- [x] Create `src/index.js` — Express server with CORS, router registration
- [x] Create `src/services/supabase.js` — Supabase admin client
- [x] Create `src/services/groq.js` — Groq AI wrapper (summarize, tip, attendance)
- [x] Create `src/services/n8n.js` — n8n webhook caller
- [x] Create `src/middleware/auth.js` — JWT verification middleware
- [x] Create `src/routes/auth.js` — register, login, me
- [x] Create `src/routes/tasks.js` — CRUD + n8n trigger
- [x] Create `src/routes/notices.js` — summarize + broadcast
- [x] Create `src/routes/attendance.js` — save + get
- [x] Create `src/routes/ai.js` — summarize, tip, attendance-alert
- [x] Create `src/routes/automations.js` — log viewer
- [x] Create `.env.example` with all required keys
- [x] Create `package.json` with scripts
- [x] Verify server starts: `node src/index.js`

### 1.3 Supabase
- [ ] Create Supabase project at supabase.com
- [x] Write `sql/schema.sql` (6 tables: students, tasks, notices, attendance, automation_logs, preferences)
- [ ] Run `sql/schema.sql` in SQL Editor
- [ ] Get URL + anon key + service role key
- [ ] Verify tables exist in Table Editor

### 1.4 Telegram Bot
- [ ] Open Telegram → @BotFather → `/newbot`
- [ ] Name: "CampusFlow Bot"
- [ ] Copy bot token
- [ ] Test: send `/start` to bot → verify it exists

### 1.5 n8n
- [ ] Sign up at n8n.cloud (free)
- [ ] Create Workflow 1: "Deadline Reminder"
- [ ] Create Workflow 2: "Notice Broadcast"
- [ ] Add Webhook nodes → copy test URLs
- [ ] Paste URLs in backend `.env`

### 1.6 Environment
- [x] Backend `.env.example`: SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, GROQ_API_KEY, TELEGRAM_BOT_TOKEN, N8N_WEBHOOKS
- [x] Frontend `.env.local`: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_BACKEND_URL

---

## Phase 2 — Auth System (0:20–0:40)

### 2.1 Backend Auth
- [x] `POST /api/auth/register` — hash password, insert student, return JWT
- [x] `POST /api/auth/login` — verify password, return JWT
- [x] `GET /api/auth/me` — get current user from JWT

### 2.2 Frontend Auth Pages
- [x] `src/app/(auth)/layout.tsx` — centered auth layout with brand panel
- [x] `src/app/(auth)/login/page.tsx` — email + password form
- [x] `src/app/(auth)/signup/page.tsx` — full registration form (name, branch, year, subjects, telegram_username, email, password)
- [x] Form validation (required fields, email format)
- [x] Error handling (wrong password, email exists)
- [x] Redirect to `/dashboard` after login

### 2.3 Auth State
- [x] `src/lib/api.ts` — JWT storage in localStorage, auth headers
- [x] Create `src/contexts/AuthContext.tsx` — provider with login, register, logout
- [x] Protected route middleware in dashboard layout (redirect to /login if no token)
- [x] Logout function (clear token, redirect to /login)

---

## Phase 3 — Dashboard (0:40–1:00)

### 3.1 App Shell
- [ ] Create `src/components/ui/` — Shadcn components (button, card, input, label, badge, separator)
- [x] `src/app/(dashboard)/layout.tsx` — sidebar + main content with auth guard
- [x] `src/components/shared/Sidebar.tsx` — logo, nav links, user info, logout
- [x] `src/components/shared/MobileNav.tsx` — hamburger menu for mobile
- [x] `src/components/shared/MobileFooter.tsx` — mobile bottom nav
- [x] Active state: primary indicator on sidebar items

### 3.2 Dashboard Page
- [x] `src/app/page.tsx` — Landing page with hero + features
- [x] `src/app/(dashboard)/dashboard/page.tsx` — full dashboard
- [x] "Today's Tasks" card — fetch tasks where deadline = today
- [x] "Upcoming Deadlines" card — next 7 days, sorted by date
- [x] "AI Tip of the Day" card — fetch from `/api/ai/tip`
- [x] Quick stats row: total tasks, in progress, completed

### 3.3 Dashboard Components
- [x] `src/features/dashboard/components/StatCard.tsx` — stat number + label
- [x] `src/features/dashboard/components/TodayTasksWidget.tsx` — task list
- [x] `src/features/dashboard/components/UpcomingDeadlinesWidget.tsx` — upcoming tasks
- [x] `src/features/dashboard/components/AiTipWidget.tsx` — study tip display
- [x] `src/features/dashboard/components/AttendanceWidget.tsx` — attendance overview

---

## Phase 4 — Task CRUD (1:00–1:20)

### 4.1 Backend Tasks
- [x] `POST /api/tasks` — create task + trigger n8n if add_to_calendar
- [x] `GET /api/tasks` — list student's tasks (sorted by deadline)
- [x] `GET /api/tasks/:id` — get single task
- [x] `PUT /api/tasks/:id` — update task
- [x] `DELETE /api/tasks/:id` — delete task
- [x] `GET /api/tasks/today` — tasks due today
- [x] `GET /api/tasks/upcoming` — next 7 days

### 4.2 Frontend Task Pages
- [x] `src/app/(dashboard)/dashboard/tasks/page.tsx` — task list with filters (All, Today, Upcoming, Completed)
- [ ] `src/app/(dashboard)/dashboard/tasks/new/page.tsx` — create task form
- [ ] `src/app/(dashboard)/dashboard/tasks/[id]/page.tsx` — edit task form

### 4.3 Task Form
- [ ] Fields: title, subject, description, deadline (datetime picker), reminder_time, add_to_calendar (toggle)
- [ ] Quick deadline buttons (1hr, 6hr, tomorrow, 3 days, 1 week)
- [ ] Default reminder_time = deadline - 24 hours
- [ ] Validation: title required, subject required, deadline required
- [ ] Submit → POST /api/tasks → redirect to tasks list

### 4.4 Task List
- [x] Filter: All, Today, Upcoming, Completed with counts
- [ ] Sort: deadline ascending (static, not wired to data)
- [ ] Each task: title, subject badge, deadline countdown, status, calendar indicator
- [ ] Actions: edit, delete (with confirm), toggle completion
- [ ] Empty state: "No tasks yet. Create your first deadline!"

---

## Phase 5 — n8n Automation (1:20–1:45) ⚡ CRITICAL

### 5.1 Webhook Integration
- [x] Backend: `services/n8n.js` — triggerN8nDeadline() function
- [x] Backend: `services/n8n.js` — triggerN8nNotice() function
- [x] On task creation (if add_to_calendar=true): POST to N8N_DEADLINE_WEBHOOK
- [x] Log trigger in automation_logs table

### 5.2 n8n Workflow 1 — Deadline Reminder
- [ ] Webhook node: receive POST data
- [ ] Set node: format fields
- [ ] Google Calendar node: create event
- [ ] Wait node: wait until reminderTime (24hr before)
- [ ] Telegram node: send reminder message
- [ ] (Bonus) Wait node: wait 1 hour before deadline
- [ ] (Bonus) Telegram node: send final nudge

### 5.3 Telegram Message Format
- [x] Format defined in TRD.md

### 5.4 End-to-End Test
- [ ] Create task in app → n8n receives webhook
- [ ] Google Calendar event appears in shared calendar
- [ ] Telegram message received (test with your own username)
- [ ] No duplicate messages

---

## Phase 6 — AI Notice Summarizer (1:45–2:10)

### 6.1 Backend AI
- [x] `POST /api/ai/summarize` — Groq API: notice text → 3-bullet summary (via POST /api/notices)
- [x] `GET /api/ai/tip` — random study tip (hardcoded for MVP)
- [x] `POST /api/ai/attendance-alert` — attendance risk calculation

### 6.2 Backend Notices
- [x] `POST /api/notices` — save notice + AI summary
- [x] `POST /api/notices/broadcast` — trigger n8n notice webhook
- [x] `GET /api/notices` — list student's notices

### 6.3 Frontend Notice Page
- [x] `src/app/(dashboard)/dashboard/notices/page.tsx` — basic page
- [x] Text area for notice input
- [x] "Summarize" button placeholder
- [x] "Broadcast" button placeholder
- [ ] List of previous notices with summaries
- [ ] Wire to backend API calls

### 6.4 n8n Workflow 2 — Notice Broadcast
- [ ] Webhook node: receive data
- [ ] Google Calendar node: create event from notice
- [ ] Split In Batches: iterate telegramUsernames
- [ ] Telegram node: send notice alert to each user

### 6.5 Telegram Broadcast Format
- [x] Format defined in TRD.md

---

## Phase 7 — Attendance Tracker (2:10–2:25)

### 7.1 Backend Attendance
- [x] `POST /api/attendance` — save attendance record
- [x] `GET /api/attendance` — get by subject
- [x] `PUT /api/attendance/:id` — update record
- [x] `POST /api/ai/attendance-alert` — AI risk analysis

### 7.2 Frontend Attendance Page
- [x] `src/app/(dashboard)/dashboard/attendance/page.tsx` — basic page
- [x] Attendance form: subject dropdown, total classes, attended classes
- [x] "Calculate" button placeholder
- [x] Display: percentage, status (safe/at-risk), recommendation
- [ ] List of saved attendance records
- [ ] Wire to backend API calls

---

## Phase 8 — Automations Log (2:25–2:35)

### 8.1 Backend
- [x] `GET /api/automations` — list automation logs

### 8.2 Frontend
- [x] `src/app/(dashboard)/dashboard/automations/page.tsx` — basic page
- [ ] List of automation triggers with status (success/pending/failed)
- [ ] Each item: workflow type, status badge, timestamp, details
- [ ] Wire to backend API calls

---

## Phase 9 — Polish & Demo Prep (2:35–3:00)

### 9.1 Demo Data
- [ ] Seed 3-5 realistic tasks (DBMS Assignment, OS Lab Report, etc.)
- [ ] Seed 2-3 notices (Exam schedule, Holiday announcement)
- [ ] Seed attendance data for demo subjects

### 9.2 UI Polish
- [ ] Loading states for all pages
- [ ] Error states with retry buttons
- [ ] Empty states with helpful messages
- [ ] Toast notifications for actions
- [ ] Mobile responsive check (all pages)

### 9.3 Final Testing
- [ ] Full flow: register → login → create deadline → Telegram msg → Calendar event
- [ ] Notice flow: paste notice → AI summary → broadcast → Telegram
- [ ] Dashboard loads with all widgets
- [ ] All pages render without errors

### 9.4 Demo Prep
- [ ] Rehearse 2-min pitch twice
- [ ] Pre-open Google Calendar
- [ ] Pre-open n8n dashboard
- [ ] Pre-open Telegram
- [ ] Freeze codebase

---

## Sub-Pages Summary

| Page | Route | Status |
|---|---|---|
| Landing | `/` | ✅ Complete |
| Login | `/login` | ✅ Complete |
| Signup | `/signup` | ✅ Complete |
| Dashboard | `/dashboard` | ✅ Complete |
| Tasks | `/tasks` | ✅ Basic page |
| Create Task | `/tasks/new` | ❌ Not created |
| Edit Task | `/tasks/[id]` | ❌ Not created |
| Notices | `/notices` | ✅ Basic page |
| Attendance | `/attendance` | ✅ Basic page |
| Automations | `/automations` | ✅ Basic page |

---

## Summary

| Phase | Done | Total | Progress |
|---|---|---|---|
| Phase 1: Setup | 22 | 28 | 79% |
| Phase 2: Auth | 10 | 10 | 100% |
| Phase 3: Dashboard | 10 | 11 | 91% |
| Phase 4: Task CRUD | 7 | 18 | 39% |
| Phase 5: n8n Automation | 4 | 12 | 33% |
| Phase 6: AI + Notices | 6 | 12 | 50% |
| Phase 7: Attendance | 4 | 7 | 57% |
| Phase 8: Automations | 1 | 3 | 33% |
| Phase 9: Polish | 0 | 10 | 0% |
| **Overall** | **64** | **111** | **58%** |
