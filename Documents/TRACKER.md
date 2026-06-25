# CampusFlow — Task Tracker
*3-Hour Hackathon Sprint | CampusAI 2025*

---

## Legend
- `[x]` Done
- `[ ]` To Do
- `[~]` In Progress

---

## Phase 1 — Setup & n8n (0:00–0:30)

- [ ] Create repo: `frontend/` (Next.js) + `backend/` (Express)
- [ ] `npm install` in both directories
- [ ] Create Supabase project at supabase.com
- [ ] Run `sql/schema.sql` in Supabase SQL Editor
- [ ] Get Supabase URL + keys (anon + service role)
- [ ] Create Telegram bot via @BotFather → get bot token
- [ ] Test bot: send `/start` to @YourBotName → bot responds
- [ ] Create `.env` in backend with all keys
- [ ] Create `.env.local` in frontend
- [ ] Sign up at n8n.cloud (free tier)
- [ ] Create Workflow 1: "Deadline Reminder" — add Webhook node, copy URL
- [ ] Create Workflow 2: "Notice Broadcast" — add Webhook node, copy URL
- [ ] Paste webhook URLs in backend `.env`
- [ ] Verify backend starts: `node src/index.js`
- [ ] Verify frontend starts: `npm run dev`

---

## Phase 2 — Core Platform (0:30–1:15)

### 2.1 Database Schema
- [ ] `students` table: id, name, branch, year, subjects, telegram_username, email, password_hash, created_at
- [ ] `tasks` table: id, student_id, title, subject, description, deadline, reminder_time, add_to_calendar, status, created_at
- [ ] `notices` table: id, student_id, notice_text, ai_summary, event_date, broadcast_status, created_at
- [ ] `attendance` table: id, student_id, subject, total_classes, attended_classes, updated_at
- [ ] `automation_logs` table: id, student_id, workflow_type, status, details, created_at

### 2.2 Auth
- [ ] `POST /api/auth/register` — create account (name, branch, year, subjects, telegram_username, email, password)
- [ ] `POST /api/auth/login` — email + password → JWT
- [ ] Auth middleware: verify JWT
- [ ] Frontend: signup page
- [ ] Frontend: login page
- [ ] Redirect to dashboard after login

### 2.3 Dashboard
- [ ] Dashboard layout with sidebar
- [ ] "Today's Tasks" widget
- [ ] "Upcoming Deadlines" widget (next 7 days)
- [ ] "AI Tip of the Day" widget (Groq)
- [ ] Mobile responsive

### 2.4 Task CRUD
- [ ] `POST /api/tasks` — create task + trigger n8n
- [ ] `GET /api/tasks` — list tasks
- [ ] `PUT /api/tasks/:id` — update task
- [ ] `DELETE /api/tasks/:id` — delete task
- [ ] Frontend: task list page
- [ ] Frontend: create task form (title, subject, deadline, reminder_time, "Add to Calendar" toggle)

---

## Phase 3 — n8n Automation (1:15–1:45) ⚡ CRITICAL

### 3.1 Webhook Integration
- [ ] Backend: on task creation, POST to `N8N_DEADLINE_WEBHOOK`:
  ```json
  {
    "studentName": "...",
    "telegramUsername": "...",
    "subject": "...",
    "deadline": "2025-07-15T23:59:00Z",
    "taskTitle": "DBMS Assignment"
  }
  ```
- [ ] Backend: log in `automation_logs`

### 3.2 n8n Workflow 1 — Deadline Reminder
- [ ] Webhook node receives data
- [ ] Set node: format deadline, compute reminderTime = deadline - 24h
- [ ] Google Calendar node: create event (shared team calendar)
- [ ] Wait node: wait until reminderTime
- [ ] Telegram node: send reminder message
- [ ] (Bonus) Second Wait + Telegram: 1-hour final nudge

### 3.3 End-to-End Test
- [ ] Create task → n8n receives → Calendar event appears
- [ ] Wait → Telegram message received
- [ ] No duplicate messages

---

## Phase 4 — AI + Notice Summarizer (1:45–2:15)

### 4.1 AI Endpoints
- [ ] `POST /api/ai/summarize` — notice text → 3-bullet summary (Groq)
- [ ] `POST /api/ai/tip` — random study tip (Groq)
- [ ] `POST /api/ai/attendance-alert` — attendance data → risk assessment

### 4.2 Notice Summarizer
- [ ] Frontend: notice input page
- [ ] "Summarize" → AI summary appears
- [ ] "Broadcast" → POST to `N8N_NOTICE_WEBHOOK`:
  ```json
  {
    "noticeText": "...",
    "aiSummary": "...",
    "eventDate": "2025-07-20",
    "eventTitle": "Mid Semester Exam",
    "telegramUsernames": ["user1", "user2"]
  }
  ```
- [ ] Backend: log broadcast

### 4.3 n8n Workflow 2 — Notice Broadcast
- [ ] Webhook receives
- [ ] Google Calendar node: create event
- [ ] Loop node: iterate usernames
- [ ] Telegram node: send notice to each user

---

## Phase 5 — Polish + Bonus (2:15–3:00)

### 5.1 Attendance Risk Alerter
- [ ] `POST /api/attendance` — save record
- [ ] `GET /api/attendance` — get by subject
- [ ] `POST /api/ai/attendance-alert` — AI risk analysis
- [ ] Frontend: attendance form (subject, total, attended)
- [ ] Frontend: display risk + recommendation

### 5.2 Automations Page
- [ ] `GET /api/automations` — list logs
- [ ] Frontend: "My Automations" page with status indicators

### 5.3 Demo Data
- [ ] Seed 3-5 realistic tasks
- [ ] Seed 2-3 notices
- [ ] Seed attendance data
- [ ] Verify all displays correctly

### 5.4 Final Testing
- [ ] Register → deadline → Telegram → Calendar
- [ ] Notice → AI summary → broadcast → Telegram
- [ ] Dashboard loads with all widgets
- [ ] Mobile responsive
- [ ] All n8n workflows show green "Success"

---

## Phase 6 — Demo Prep (2:55–3:00)

- [ ] Rehearse 2-min pitch twice
- [ ] Pre-open Google Calendar
- [ ] Pre-open n8n dashboard
- [ ] Have Telegram open for demo
- [ ] Freeze codebase

---

## Summary

| Phase | Done | Total | Progress |
|---|---|---|---|
| Phase 1: Setup | 0 | 15 | 0% |
| Phase 2: Core Platform | 0 | 17 | 0% |
| Phase 3: n8n Automation | 0 | 8 | 0% |
| Phase 4: AI + Notice | 0 | 10 | 0% |
| Phase 5: Polish | 0 | 10 | 0% |
| Phase 6: Demo Prep | 0 | 5 | 0% |
| **Overall** | **0** | **65** | **0%** |
