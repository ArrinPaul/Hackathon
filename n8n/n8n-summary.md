# NotifyMe — n8n Workflow Summary

## Overview

NotifyMe is a Telegram-integrated academic deadline management system built across three n8n workflows. Together they form a pipeline that registers college groups, ingests teacher messages to extract deadlines using AI, and reminds students of upcoming events via Telegram.

---

## Workflow 1: `notifyme-group-register`

**Purpose:** Registers a Telegram group with the NotifyMe backend when a teacher or admin runs `/start`.

**Trigger:** Telegram message webhook

**Flow:**

1. **Telegram Trigger** — Listens for incoming messages.
2. **IF — /start in a Group** — Passes only if the message starts with `/start` AND the chat type is not `private` (i.e., it's a group or supergroup).
3. **POST /groups/register** — Calls the backend with the group's `telegram_chat_id` and `name` to register it.
4. **IF — Registration Successful** — Checks if the backend returned an `invite_link`.
   - **Success →** Sends a Telegram message to the group with the invite link so students can sign up for Google Calendar syncing.
   - **Failure →** Sends an error message prompting the user to try `/start` again.

**Key variables used:** `$vars.BACKEND_URL`

---

## Workflow 2: `notifyme-ingestion`

**Purpose:** Monitors a registered Telegram group for teacher messages, uses Gemini AI to extract academic deadlines, saves them to Supabase, and triggers a calendar fan-out.

**Trigger:** Telegram message webhook

**Flow:**

1. **Telegram Trigger** — Listens for all incoming messages.
2. **IF — Is Teacher** — Passes only if the sender's ID is in `$vars.TEACHER_IDS` (comma-separated) OR the message starts with `/create`, and the message has non-empty text.
3. **GET /groups/by-chat-id** — Fetches the internal `group_id` for the current Telegram chat.
4. **Basic LLM Chain (Gemini 2.0 Flash)** — Sends the message to Google Gemini with a structured prompt asking it to extract deadline info into JSON:
   - `is_relevant` (bool)
   - `title`, `date` (YYYY-MM-DD), `priority` (High/Medium/Low), `category` (Exam/Assignment/Attendance/Fee/Placement/Other)
   - Relative dates (e.g. "tomorrow", "next Monday") are resolved against today's date.
   - Only the most urgent deadline is extracted if multiple are mentioned.
5. **IF — Is Relevant** — Checks `is_relevant` from the parsed JSON response.
   - **Relevant →** Inserts the event into Supabase (`/rest/v1/events`) with `group_id`, parsed fields, the raw message, and `source: 'telegram'`.
   - **Irrelevant →** Discards silently.
6. **POST /calendar/fan-out** — After a successful Supabase insert, calls the backend with the new `event_id` to propagate the event to subscribed students' Google Calendars.

**Key variables used:** `$vars.TEACHER_IDS`, `$vars.BACKEND_URL`, `$vars.SUPABASE_URL`, `$vars.SUPABASE_ANON_KEY`

**AI Model:** Google Gemini 2.0 Flash (temperature 0 for deterministic output)

---

## Workflow 3: `notifyme-reminders`

**Purpose:** Polls for due reminders every 30 minutes and sends Telegram notifications to the relevant students, then marks each reminder as sent.

**Trigger:** Schedule — every 30 minutes

**Flow:**

1. **Every 30 Minutes** — Fires the workflow on a fixed interval.
2. **GET /reminders/due** — Fetches a list of reminders that are currently due from the backend.
3. **IF — Any Reminders Due** — Checks if the response is a non-empty array.
   - **Empty →** No-op, exits quietly.
   - **Has items →** Proceeds to process them one at a time.
4. **Split Into Items** — Splits the array into individual reminder objects (batch size 1), looping through each.
5. **Send Telegram Reminder** — Sends a formatted Markdown message to `telegram_chat_id` with the event title, days remaining, event date, category, and priority.
6. **PATCH /reminders/mark-sent** — Marks the reminder as sent on the backend, passing `remind_offset_days` (the `days_left` value) as a query parameter to track which reminder threshold was hit.
7. Loops back to **Split Into Items** until all reminders are processed.

**Key variables used:** `$vars.BACKEND_URL`

**Reminder message format:**
```
⚠️ *<title>* is in *<N> day(s)* — <event_date>

Category: <category> | Priority: <priority>
```

---

## Shared Configuration

| Item | Value |
|---|---|
| Telegram credential ID | `h2Q6l1bxyZuXkLTL` |
| Gemini credential ID | `JELWxw4K7dbi4QIH` |
| All workflows tagged | `notifyme` |
| All workflows status | Inactive (need to be activated) |
| Execution order | `v1` |

---

## Data Flow Diagram

```
[Teacher sends message in Telegram group]
        │
        ▼
notifyme-ingestion
  ├── Verify sender is a teacher
  ├── Look up group_id
  ├── Gemini extracts deadline → JSON
  ├── Insert event into Supabase
  └── Fan-out to student Google Calendars

[/start command in Telegram group]
        │
        ▼
notifyme-group-register
  ├── Register group with backend
  └── Send invite link to group

[Every 30 minutes]
        │
        ▼
notifyme-reminders
  ├── Fetch due reminders
  ├── For each → Send Telegram message
  └── Mark reminder as sent
```
