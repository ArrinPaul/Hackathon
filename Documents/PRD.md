# NotifyMe — Product Requirements Document (PRD)

*Version 2.0 | Updated for multi-group invite flow*

---

## 1. Product Overview

### 1.1 Problem Statement

College students across India receive critical academic deadline announcements through informal Telegram groups. These messages are buried in noise and there is no structure, no persistence, no reminder, and no single place to see what's due. The problem is worse because each classroom has its own group — a student in CSE-A should only see CSE-A announcements, not ECE-B's.

### 1.2 Solution

NotifyMe is an AI-powered academic operations system. A Telegram bot is added to a classroom group once by a teacher. It auto-registers the group and posts a signup invite link. Students click the link, sign up, and connect their Google Calendar. From that point on, every deadline a teacher announces in that group is automatically extracted by Gemini, synced to every signed-up student's Google Calendar, and surfaced on a live React dashboard — scoped only to their group.

### 1.3 Target Users

**Primary:** Undergraduate and postgraduate students at Indian colleges who use Telegram as the primary announcement channel.

**Secondary:** Teachers who want their announcements auto-structured without any extra effort.

---

## 2. Goals and Non-Goals

### Goals

- Auto-register a Telegram group the moment the bot is added to it.
- Generate a unique invite link per group and post it automatically.
- Let students sign up via invite link, authenticate with Supabase, and connect Google Calendar with one OAuth flow.
- Scope all events to the correct group — a student only sees events from groups they've joined.
- Automatically detect and extract deadline information from teacher messages with >90% accuracy.
- Create a Google Calendar event in every signed-up student's calendar for each extracted deadline.
- Send Telegram reminder alerts 7, 3, and 1 day before each deadline.
- Show a live dashboard with today's tasks, upcoming deadlines, critical alerts, and attendance status.
- Calculate attendance percentage and tell the student exactly how many classes they need to attend or can skip.

### Non-Goals (V1)

- Extracting multiple deadlines from a single message (V1 extracts only the most urgent).
- Supporting WhatsApp or Slack as ingestion sources.
- Building a mobile native app (responsive web only).
- Multi-user faculty admin flows or role management UI.
- Charging users or implementing any payment flow.
- Allowing students to manually add events (Telegram-only ingestion in V1).

---

## 3. Feature Specifications

### Feature 0 — Group Auto-Registration (V1, REQUIRED)

**User Story:** As a teacher, I want to add the NotifyMe bot to my group once and have it set itself up automatically — no manual configuration.

**Behavior:**

- When the bot is added to any Telegram group, n8n fires a `my_chat_member` trigger.
- n8n calls `POST /groups/register` with `telegram_chat_id` and `name` (group title from Telegram).
- The backend upserts a row in the `groups` table (idempotent — re-adding the bot doesn't create a duplicate).
- The backend returns the `group_id` and constructs the invite URL: `campusos.app/join?g={group_id}`.
- n8n sends this message to the group via the Telegram Bot API:

  > "✅ NotifyMe is now active in this group! Students, sign up here to get deadlines in your Google Calendar: campusos.app/join?g=abc123"

**Acceptance Criteria:**

- Bot added to a new group → `groups` row created within 10 seconds.
- Invite link posted in the group automatically.
- Bot added a second time to the same group → no duplicate row, same link re-posted.

---

### Feature 1 — Student Signup via Invite Link (V1, REQUIRED)

**User Story:** As a student, I want to click one link from my Telegram group, sign up, and be automatically connected to my classroom — with all future deadlines appearing in my Google Calendar.

**Behavior:**

- Student navigates to `campusos.app/join?g={group_id}`.
- The `JoinPage` component reads the `group_id` from the URL, fetches the group name from Supabase, and displays: *"You're joining: CSE-A 2025 — Connect to get deadlines in your Google Calendar."*
- Student signs up with email (Supabase magic link auth).
- After auth, student clicks "Connect Google Calendar" → Google OAuth consent screen.
- On OAuth success, the backend stores the refresh token in `profiles.google_calendar_refresh_token`.
- Backend inserts a row in `group_members` (student_id + group_id).
- Student is redirected to the dashboard, which shows events from their group.

**Acceptance Criteria:**

- Student who has never used NotifyMe completes signup in under 2 minutes.
- After signup, `group_members` row exists and `profiles.google_calendar_refresh_token` is populated.
- If the student clicks the link again (already signed up), they are redirected to the dashboard — no duplicate `group_members` row.
- A student can join multiple groups by clicking multiple invite links.

---

### Feature 2 — Telegram Message Ingestion (V1, REQUIRED)

**User Story:** As a student, I want NotifyMe to automatically monitor my college Telegram group for teacher announcements.

**Behavior:**

- An n8n workflow with a Telegram Trigger listens to all configured groups.
- When a message arrives, n8n checks if the sender is a teacher (by Telegram user ID whitelist stored in the `groups` table, or by checking for the `/create` command prefix).
- Non-teacher messages are discarded silently.
- Teacher messages are forwarded to `POST /extract` with the `group_id` derived from the message's `chat_id`.

**Acceptance Criteria:**

- A teacher message appears as an events row in Supabase within 15 seconds.
- A student message (same group) does not create any row.
- Non-relevant teacher messages ("ok class dismissed") do not create any row.

**Edge Cases:**

- Message with no date → discarded (`is_relevant: false`).
- Message with multiple deadlines → extract only the earliest/most urgent one (V1).
- Message in Hinglish → Gemini handles gracefully; if no date found, discard.

---

### Feature 3 — AI Deadline Extraction (V1, REQUIRED)

**User Story:** As a student, I want the system to understand the meaning of a raw teacher message and extract the deadline automatically.

**Behavior:**

- `POST /extract` receives `group_id` and `raw_message`.
- Gemini 2.5 Flash processes the message and returns structured JSON: `is_relevant`, `title`, `date` (YYYY-MM-DD), `priority`, `category`.
- If `is_relevant` is false, nothing is saved.
- If `is_relevant` is true, event is inserted into `events` with `group_id` populated. `user_id` is null — the event belongs to the group, not any individual student.

**Priority Rules:**

- Exams, hall tickets → High
- Fee submission, attendance forms → Medium to High
- Assignments → Medium
- Club events, general announcements → Low

**Acceptance Criteria — all 5 must pass:**

| Input | Expected Output |
|---|---|
| "Mid Semester Exam starts from July 5th." | High, Exam, 2026-07-05 |
| "Hall ticket collection deadline July 1st." | High, Exam, 2026-07-01 |
| "Attendance shortage form submission June 29th." | Medium, Attendance, 2026-06-29 |
| "lol who's up for FIFA tonight" | is_relevant: false |
| "Submit assignment 4 by tomorrow EOD" | Correct resolution of "tomorrow" |

---

### Feature 4 — Google Calendar Fan-Out (V1, REQUIRED)

**User Story:** As a student, I want every deadline my teacher announces to appear in my personal Google Calendar automatically.

**Behavior:**

- After a successful extraction and Supabase insert, the backend calls `POST /calendar/fan-out` with the `event_id`.
- The endpoint fetches all `group_members` for the event's `group_id`.
- For each student, it uses their stored `google_calendar_refresh_token` to create an all-day Google Calendar event via the Calendar API v3.
- Each `calendar_sync` row is inserted recording `event_id`, `student_id`, and the returned `calendar_event_id`.
- If a student's token fails (revoked or expired), their sync is skipped and logged — other students are not affected.

**Acceptance Criteria:**

- A new all-day event appears in every signed-up student's Google Calendar within 30 seconds of the teacher message.
- Event title matches the extracted title.
- `calendar_sync` rows populated for all students in the group.
- Failure for one student does not block others.

---

### Feature 5 — Reminder Engine (V1, REQUIRED)

**User Story:** As a student, I want Telegram reminders 7, 3, and 1 day before each deadline.

**Behavior:**

- n8n Schedule Trigger runs every 30 minutes.
- Calls `GET /reminders/due` which returns events where `event_date` is exactly 7, 3, or 1 days away and no `notifications` row with `sent=true` exists for that event + offset.
- n8n loops over results, sends a Telegram message to the group: `⚠️ [Title] is in [N] day(s) — [Date]`.
- Calls `PATCH /reminders/{event_id}/mark-sent` after each send.
- No duplicate reminders for the same event + offset.

**Acceptance Criteria:**

- Test event with `event_date = today + 1 day` triggers a Telegram reminder within 30 minutes.
- Same reminder not sent twice (idempotency via `notifications` table).
- Stale reminders (event already past) do not fire.

---

### Feature 6 — Student Dashboard (V1, REQUIRED)

**User Story:** As a student, I want a single screen showing everything — what's due today, what's coming up, critical alerts, and my attendance.

**Dashboard Sections:**

**Today's Tasks Card** — events where `event_date = today`. Empty state: "No deadlines today 🎉"

**Upcoming Deadlines Card** — events between tomorrow and 7 days from now. Sorted by date. Shows "in N days" badge.

**Critical Alerts Card** — events where `priority = High` and `event_date >= today`. Red border.

**Attendance Card** — circular progress, Safe/Below status, skip count or classes needed.

**Calendar View** — monthly calendar with event dots. Click date → events for that day. Color-coded by category.

**Data Fetching:**

- Events fetched from Supabase by `group_id` (all groups the student belongs to), not by `user_id`.
- Query: `events` JOIN `group_members` WHERE `group_members.student_id = current_user_id`.
- Realtime subscription on `events` table filtered by group.

**Acceptance Criteria:**

- Dashboard loads within 2 seconds.
- New teacher message creates event visible in dashboard without page refresh.
- Student only sees events from their own groups.
- Attendance card shows correct calculation.

---

### Feature 7 — Attendance Tracker (V1, REQUIRED)

**Inputs:** Total classes held, classes attended, threshold (default 75%).

**Formulas:**

```
current_pct = (attended / total) × 100

If current_pct >= threshold:
    can_skip = floor((attended × 100 / threshold) − total)

If current_pct < threshold:
    classes_needed = ceil((threshold × total − 100 × attended) / (100 − threshold))
```

**Verified test case:**

- Input: total=80, attended=58, threshold=75
- current_pct = 72.5%
- classes_needed = ceil((75×80 − 100×58) / (100−75)) = ceil(200/25) = **8**

> ⚠️ The answer is **8**, not 6. The demo script and dashboard must show 8.

**Acceptance Criteria:**

- `/attendance/calculate?total=80&attended=58&threshold=75` returns `{"current_pct": 72.5, "status": "below_threshold", "classes_needed": 8}`.
- Edge case: total=0 returns `current_pct: 0` without division error.

---

### Feature 8 — Document Upload + AI Summary (V2, Optional)

Upload a PDF → Gemini returns 5–7 bullet summary + 3–5 key points → shown in dashboard Documents section.

---

### Feature 9 — RAG Chatbot (V2, Optional)

Context-stuffing only (no vector DB). All document summaries + recent events stuffed into Gemini context. Chat history in React state only.

---

### Feature 10 — MCQ Generator (V3, Optional — pick ONE of 10 or 11)

Select uploaded document → Gemini generates 5 MCQs with 4 options → interactive quiz UI.

---

### Feature 11 — Excalidraw Canvas (V3, Optional — pick ONE of 10 or 11)

Iframe embed of excalidraw.com. No sync. Default V3 pick due to zero risk.

---

## 4. User Experience Principles

**Zero configuration for students:** Click link → sign up → done. No group name to remember, no code to type.

**Zero extra work for teachers:** They send messages the way they always have. The `/create` command is available as a structured fallback, not a requirement.

**Group-scoped by default:** Every event, every reminder, every dashboard view is scoped to the student's groups. No cross-group noise.

**Speed over completeness:** A deadline in the dashboard 10 seconds after the Telegram message is worth more than a perfect one in 10 minutes.

---

## 5. Success Metrics (Hackathon Context)

| Metric | Target |
|---|---|
| Time from teacher message to dashboard event | < 15 seconds |
| Time from teacher message to Google Calendar event | < 30 seconds |
| Extraction accuracy on 5 test cases | 5/5 (100%) |
| Calendar fan-out success rate | 100% in demo (2 student accounts) |
| Reminder delivery | On-time within 30-min polling window |
| Dashboard load time | < 2 seconds |
| Attendance formula output for test case | current_pct: 72.5, classes_needed: 8 |
