# CampusFlow — Future Plan
*Feature roadmap organized by version. Each version builds on the previous.*

---

## Version Overview

| Version | Name | Focus | Timeline |
|---|---|---|---|
| V1 | MVP | Core hackathon deliverable | Hackathon (3 hours) |
| V2 | Personal | Per-user calendar, AI study tools | Week 1-2 post-hackathon |
| V3 | Collaborative | Team features, boards, notes | Week 3-4 |
| V4 | Intelligent | AI assistant, smart automation | Month 2 |
| V5 | Platform | Analytics, billing, integrations | Month 3+ |

---

## V1 — MVP (Hackathon)
*Current version. Ship this to win.*

### Core Platform
- Student onboarding (name, branch, year, subjects, telegram_username)
- Supabase Auth (email/password signup + login)
- Dashboard: today's tasks, upcoming deadlines, AI tip of the day

### Task Management
- Task/Deadline CRUD
- "Add to Calendar" toggle
- "Telegram reminder time" picker
- Status tracking (pending/completed/cancelled)

### n8n Automation
- Workflow 1: Deadline → Google Calendar event → Telegram reminder (24hr + 1hr)
- Workflow 2: Notice → AI summary → Calendar event → Telegram broadcast

### AI Features
- Notice Summarizer: paste notice → 3-bullet AI summary (Groq)
- Attendance Risk Alerter: enter % → AI flags at-risk subjects
- AI Tip of the Day: random study tip

### Calendar Integration
- Shared team Google account via n8n OAuth2
- Events created on shared calendar

---

## V2 — Personal (Post-Hackathon Week 1-2)
*Make it personal. Each user owns their data.*

### Per-User Google Calendar ⭐
- OAuth2 flow: user clicks "Connect Google Calendar"
- Store refresh_token in Supabase per user
- Create events on user's own calendar
- Show "Connected" status in settings
- **API:** Google Calendar API (free, 1M req/day)

### Enhanced Dashboard
- Weekly calendar view (not just list)
- Subject-wise task grouping
- Priority indicators (High/Medium/Low)
- Deadline countdown timers
- Progress bars for each subject

### AI Study Buddy
- Paste lecture notes → AI generates flashcards
- MCQ quiz from notes
- Spaced repetition scheduling
- WhatsApp/Telegram: "Your quiz for OS is ready!"
- **API:** Groq for generation

### Smart Deadline Manager
- Add deadline → AI suggests study schedule
- Breaks task into daily chunks
- Sends daily study reminders
- Adapts based on completion rate
- **API:** Groq for schedule generation

### Study Group Scheduler
- Post a study session (subject, time, duration)
- AI matches students by subject + availability
- Telegram invite sent to matched students
- Group calendar event created

---

## V3 — Collaborative (Week 3-4)
*Work together. Real-time team features.*

### Channels & Messaging
- Create channels per subject/project
- Real-time chat in channels
- @mention team members
- Thread replies
- File sharing in channels

### Kanban Boards
- Create boards per project/subject
- Lists: To Do, In Progress, Done
- Cards with title, description, due date, assignee
- Drag-and-drop reordering (@dnd-kit)
- Card comments and activity log

### Linear-style Issues
- Status columns (Backlog, Todo, In Progress, Review, Done)
- Priority levels (Urgent, High, Medium, Low)
- Labels/tags
- Parent/child relationships
- Assignees and watchers

### Projects
- Create project = board channel + chat channel
- Link tasks to projects
- Project overview dashboard
- Project members and roles

### Notes
- Create/edit notes with rich text
- Quill Delta content format
- Tags and categorization
- Cover images
- Share notes in channels

---

## V4 — Intelligent (Month 2)
*AI does the heavy lifting.*

### AI Assistant
- Chat interface for asking questions
- Tool loop with 16 internal tools
- Context-aware responses
- Task drafts (AI creates, user confirms)
- Memory bullets for long-term context

### Dashboard Chatbot
- Quick answers about tasks, deadlines, schedule
- Intent classification (channel, tasks, calendar, etc.)
- "What are my tasks today?" → instant answer
- "Summarize #os-channel" → AI summary

### Smart Features
- `/api/smart/suggestions` — AI task suggestions
- `/api/smart/summarize` — Conversation summarization
- `/api/smart/search` — Semantic workspace search
- `/api/smart/diagram` — Text → Mermaid diagram
- Daily recap: "Here's what happened today"

### Sprints
- Create sprints per project (2-week cycles)
- Add issues to sprints
- Sprint progress tracking
- Velocity charts
- Rollover incomplete issues

### Milestones (Roadmaps)
- Long-term goals for projects
- Link issues to milestones
- Timeline visualization
- Progress tracking

### Board AI
- NLP dependency detection between issues
- Auto-suggest blocking relationships
- Resolution steps template
- No LLM required (pattern matching)

---

## V5 — Platform (Month 3+)
*Scale and monetize.*

### Notifications
- Push notifications (OneSignal)
- Email notifications (Resend + React Email)
- Notification preferences per user
- Weekly digest emails
- Real-time or batched delivery

### Canvas (Collaborative Whiteboard)
- Excalidraw integration
- Liveblocks for real-time collaboration
- Drawing tools, text, sticky notes
- AI diagram generation (Mermaid → Excalidraw)
- Export as SVG/PNG

### Analytics & Reports
- User activity tracking
- Channel engagement metrics
- Task completion rates
- Attendance trends
- Chart visualizations (Recharts)
- PDF export

### Integrations (Composio)
- GitHub: link repos, track issues
- Gmail: read/send emails
- Slack: sync messages
- Linear: import/export issues
- Notion: import pages
- ClickUp: sync tasks

### Data Import
- Import from Slack
- Import from Todoist
- Import from Linear
- Import from Notion
- Import from Miro

### Billing & Subscriptions
- Dodo Payments integration
- Free tier (50 tasks, 5 channels)
- Pro tier (unlimited)
- Enterprise tier
- Usage tracking and limits

---

## V6 — Advanced (Future)
*Full platform capabilities.*

### Video Meetings
- Stream.io integration
- Study group video calls
- Screen sharing
- Recording and transcripts

### Attendance System
- QR code check-in
- Biometric integration
- Faculty dashboard
- Automated reports

### Placement Tracker
- Company applications
- Round tracking
- AI prep recommendations
- Interview scheduling

### Mobile App
- React Native or Flutter
- Push notifications
- Offline support
- Camera for QR scan

---

## Feature Mapping: Old Docs → CampusFlow Versions

| Old Feature | CampusFlow Version | Notes |
|---|---|---|
| Boards (Kanban + Linear) | V3 | Team project management |
| Sprints | V4 | Time-boxed iterations |
| Milestones/Roadmaps | V4 | Long-term goals |
| Projects | V3 | Board + chat linking |
| Notes | V3 | Collaborative editing |
| Canvas (Excalidraw) | V5 | Whiteboard |
| AI Assistant | V4 | Tool loop + 16 tools |
| Dashboard Chatbot | V4 | Quick Q&A |
| Smart Features | V4 | Summarize, search, diagrams |
| Notes AI | V4 | Clean, expand, summarize |
| Board AI | V4 | Dependency detection |
| Integrations (Composio) | V5 | Gmail, Slack, GitHub |
| Data Import | V5 | Slack, Todoist, Linear |
| Notifications | V5 | Push + Email |
| Analytics | V5 | Reports + Charts |
| Billing | V5 | Subscriptions |
| Per-user Calendar | V2 | OAuth2 flow |
| AI Study Buddy | V2 | Flashcards + MCQ |
| Smart Deadline Manager | V2 | AI study schedule |
| Study Group Scheduler | V2 | Match + invite |
| Attendance Risk Alerter | V1 | Current hackathon |
| Notice Summarizer | V1 | Current hackathon |

---

## Priority Matrix

| Feature | Impact | Effort | Version |
|---|---|---|---|
| Per-user Google Calendar | High | Medium | V2 |
| AI Study Buddy | High | Medium | V2 |
| Kanban Boards | High | High | V3 |
| Real-time Chat | High | High | V3 |
| AI Assistant | Very High | Very High | V4 |
| Sprints | Medium | Medium | V4 |
| Notifications | High | Medium | V5 |
| Canvas | Medium | High | V5 |
| Analytics | Medium | Medium | V5 |
| Billing | Low | Medium | V5 |
