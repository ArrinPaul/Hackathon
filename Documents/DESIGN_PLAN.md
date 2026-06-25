# CampusFlow — Design & Structure Reference
*Adapted for CampusFlow (Supabase backend, student productivity app)*

---

## 1. Design System (Theme)

### Color Tokens (CSS Variables in globals.css)

**Light Mode:**
```css
--primary:        280 77% 23%    → Deep purple (#4A0D68)
--secondary:      326 100% 55%   → Vibrant pink/magenta
--background:     0 0% 100%      → Pure white
--foreground:     222 84% 5%     → Near-black
--muted:          210 40% 96%    → Light gray
--border:         214 32% 91%    → Soft gray border
--destructive:    0 100% 65%     → Red
```

**Dark Mode:**
```css
--background:     222 8% 12%     → Discord-like dark
--card:           222 8% 15%     → Slightly lighter panel
--foreground:     210 16% 96%    → Light text
--border:         222 8% 20%     → Dark border
```

### Design Tokens
```css
--radius:     0.625rem (10px)    → Rounded corners everywhere
--duration-fast:   150ms
--duration-normal: 200ms
--duration-slow:   300ms
--shadow-sm/md/lg/xl → Progressive shadow depth
```

### Key UI Patterns
- Border radius: `rounded-[10px]` on cards, buttons, sidebar items
- Transitions: `transition-standard` utility class (200ms ease)
- Hover micro-interactions: `group-hover:scale-110` on icons, `hover:translate-x-1` on list items
- Active state: `bg-secondary-foreground/20` + `shadow-sm` for selected sidebar items
- Scrollbars: Custom styled — semi-transparent white on purple sidebar, thin violet-tinted for editors

---

## 2. Landing Page Design

**Route:** `/`

### Visual Structure
```
┌─────────────────────────────────────────────┐
│  HEADER (sticky, glassmorphism on scroll)   │
│  Logo | Features ▾ | AI Assistant | Pricing │
│                        Sign In | Get Started│
├─────────────────────────────────────────────┤
│  HERO SECTION                               │
│  Badge: "AI-Powered Student Hub"            │
│  H1: "Never Miss a Deadline Again"          │
│  Subtext paragraph                          │
│  [Interactive demo / illustration]          │
│  ↓ "Discover More" scroll indicator         │
├─────────────────────────────────────────────┤
│  FEATURE SECTION (id="features")            │
│  FeaturesSection — Task Management,         │
│  Notice Summarizer, Attendance Tracker      │
├─────────────────────────────────────────────┤
│  AUTOMATION SECTION                         │
│  How n8n + Telegram + Calendar works        │
│  Flow diagram or animated walkthrough       │
├─────────────────────────────────────────────┤
│  CTA SECTION                                │
│  Badge: "Free for Students"                 │
│  H2: "Start Managing Your Deadlines"        │
│  [Get Started Free] [Learn More]            │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
│  Logo + description | Product | Resources  │
│  Copyright + Privacy + Terms                │
└─────────────────────────────────────────────┘
```

### Header Behavior
- Default: Transparent background, sits over white hero
- Scrolled: `bg-white/95 backdrop-blur-md shadow-sm` (frosted glass)
- Desktop nav: Features (dropdown), AI Assistant badge, GitHub
- CTA area: If logged in → "Dashboard" button; If not → "Sign In" (outline) + "Get Started" (solid purple)
- Mobile: Hamburger menu → slide-down animated panel with same links

### Hero Section
- Animated entrance with staggered children (Framer Motion)
- Purple badge pill → H1 with highlighted "Deadlines" (secondary color underline) → description paragraph
- Embedded illustration or animated demo
- Animated "Discover More" chevron bounce at bottom

### Feature Section
Three feature cards:
1. **Smart Deadlines** — Create tasks, auto-reminders via Telegram
2. **AI Notice Summarizer** — Paste notices, get 3-bullet summaries
3. **Attendance Tracker** — Risk alerts, never miss threshold

### Automation Section
- Visual flow: Task → n8n → Google Calendar → Telegram
- Shows the end-to-end automation loop
- Build trust: "Powered by n8n, Google Calendar, Telegram"

### CTA Section
- Scroll-triggered `useInView` animation
- Purple badge, bold heading, two buttons (solid primary + outline)
- Trust line: "Trusted by 500+ students" (or placeholder)

### Footer
- 3-column layout on desktop: Logo+description | Product links | Resources links
- Stacks vertically on mobile
- Bottom bar: copyright + email + privacy + terms

---

## 3. Auth Pages Design

**Routes:** `/login`, `/signup`

### Shared Layout
- Full-height centered layout: `flex h-full items-center justify-center bg-primary`
- Purple background (the primary color) — contrasts with the white card
- Single card: `w-[420px]`, `shadow-xl`, `rounded-[10px]`, `backdrop-blur-sm`

### Sign In Card
```
┌──────────────────────────────┐
│  "Login to continue"         │
│  "Use your email or service" │
│                              │
│  [Error banner if any]       │
│                              │
│  ┌────────────────────────┐  │
│  │ Email                  │  │
│  ├────────────────────────┤  │
│  │ Password               │  │
│  └────────────────────────┘  │
│         Forgot Password?     │
│  ┌────────────────────────┐  │
│  │     Continue           │  │  ← solid purple, full width
│  └────────────────────────┘  │
│  ─────────────────────────── │
│  ┌────────────────────────┐  │
│  │   Continue with Google │  │  ← outline, full width, Google icon
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │   Continue with GitHub │  │  ← outline, full width, GitHub icon
│  └────────────────────────┘  │
│                              │
│  Don't have an account?      │
│  Sign up                     │  ← link to /signup
└──────────────────────────────┘
```

### Sign Up Card
```
┌──────────────────────────────┐
│  "Create your account"       │
│  "Join CampusFlow today"     │
│                              │
│  [Error banner if any]       │
│                              │
│  ┌────────────────────────┐  │
│  │ Full Name              │  │
│  ├────────────────────────┤  │
│  │ Email                  │  │
│  ├────────────────────────┤  │
│  │ Branch (e.g., CSE)     │  │
│  ├────────────────────────┤  │
│  │ Year (1-4)             │  │
│  ├────────────────────────┤  │
│  │ Telegram Username       │  │
│  ├────────────────────────┤  │
│  │ Password               │  │
│  │ [strength indicator]   │  │
│  ├────────────────────────┤  │
│  │ Confirm Password       │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │     Create Account     │  │  ← solid purple, full width
│  └────────────────────────┘  │
│  ─────────────────────────── │
│  ┌────────────────────────┐  │
│  │   Continue with Google │  │  ← outline, full width
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │   Continue with GitHub │  │  ← outline, full width
│  └────────────────────────┘  │
│                              │
│  Already have an account?    │
│  Sign in                     │  ← link to /login
└──────────────────────────────┘
```

### Auth Flow
- `AuthScreen` component toggles between `SignInCard` and `SignUpCard` via local `useState<AuthFlow>`
- The `isStandalone` prop controls whether toggling uses `setState` (inline) or `<Link>` (separate pages)
- On submit → calls Express backend `/api/auth/register` or `/api/auth/login`
- Stores JWT in localStorage, sets auth context
- Redirects to `/dashboard` on success

---

## 4. Middleware & Route Protection

`src/middleware.ts` defines:

```typescript
// Public routes
const publicRoutes = ["/", "/login", "/signup", "/about", "/pricing", "/privacy", "/terms"];

// Protected routes
const protectedRoutes = ["/dashboard", "/tasks", "/notices", "/attendance", "/automations"];
```

### Logic
- Unauthenticated users hitting protected routes → redirect to `/login`
- Authenticated users hitting `/login` or `/signup` → redirect to `/dashboard`
- Unauthenticated `/` → redirect to `/`
- Uses `supabase.auth.getSession()` for session check

---

## 5. Dashboard Shell

**Route:** `/dashboard`

### Layout (layout.tsx)
Two-panel responsive design:
```
┌──────────────┬─────────────────────────────┐
│   Sidebar    │      Main Content           │
│  280px/70px  │         flex-1              │
│ (collapsible)│                             │
└──────────────┴─────────────────────────────┘
```

- Desktop: Sidebar is always visible, collapses to 70px (icon-only) or expands to 280px
- Collapse state persisted in Supabase via custom hook
- Mobile: Sidebar becomes a full-screen overlay with backdrop. Bottom footer nav replaces sidebar.

### Auth Guard
- Dashboard layout checks auth state
- If no JWT token in localStorage → redirect to `/login`
- Fetches user profile from `/api/auth/me`

---

## 6. Sidebar System

**Component:** `Sidebar` in `src/components/shared/Sidebar.tsx`

### Sections (top to bottom)
```
1. CampusFlow Logo + App Name
2. Dashboard link — always visible
3. AI Assistant link — always visible
4. ─── Divider ───
5. Tasks — link with task count badge
6. Notices — link with notice count badge
7. Attendance — link with attendance status indicator
8. ─── Divider ───
9. Automations — link
10. ─── Divider ───
11. Settings / Profile
12. Logout button (bottom)
```

### Sidebar Item Types
Two component types:

**SidebarItem** — generic nav link
```
┌──────────────────────────────┐
│  [icon]  Label        [badge]│  ← badge shows count (optional)
└──────────────────────────────┘
```
- Styling: `rounded-[10px]`, active: `bg-secondary-foreground/20 + shadow-sm`, hover: `translate-x-1`

**StatSidebarItem** — nav link with live stat
```
┌──────────────────────────────┐
│  [icon]  Label      [stat]   │  ← stat shows number (e.g., "3 pending")
└──────────────────────────────┘
```

### Toggle Behavior
- All sections are independent (can all be open simultaneously)
- Sidebar collapse/expand: button at bottom or double-click logo
- Mobile: hamburger button triggers full-screen overlay

---

## 7. Mobile Footer

Fixed bottom bar (`md:hidden`) with 5 items:
```
┌──────┬──────┬──────┬──────┬──────┐
│ Menu │  AI  │Tasks │Notice│Search│
│  ☰   │  🤖  │  📋  │  📢  │  🔍  │
└──────┴──────┴──────┴──────┴──────┘
```

- Uses `bg-primary` background with `border-t`
- Each item: icon + tiny label
- Active state: `bg-secondary-foreground/20`
- Menu button opens sidebar overlay

---

## 8. Dashboard Page

**Route:** `/dashboard`

### Structure
```
┌─────────────────────────────────────────────────┐
│  WorkspaceToolbar (welcome message, quick add)  │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Stats   │ │  Stats   │ │  Stats   │       │
│  │  Row     │ │  Row     │ │  Row     │       │
│  └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────┐│
│  │   Today's Tasks     │ │  Upcoming Deadlines ││
│  │                     │ │                     ││
│  │  • Task 1          │ │  • Task A - 2 days  ││
│  │  • Task 2          │ │  • Task B - 5 days  ││
│  │  • Task 3          │ │  • Task C - 1 week  ││
│  └─────────────────────┘ └─────────────────────┘│
├─────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────┐│
│  │   AI Tip of the Day │ │  Attendance Overview ││
│  │                     │ │                     ││
│  │  "Take regular..."  │ │  CSE: 85% ✅        ││
│  │                     │ │  OS: 72% ⚠️         ││
│  └─────────────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Widgets
Each widget is a separate component:

| Widget | Component | Data Source |
|--------|-----------|-------------|
| Stats Row | `StatCard` × 3 | `/api/tasks`, `/api/auth/me` |
| Today's Tasks | `TodayTasksWidget` | `/api/tasks/today` |
| Upcoming Deadlines | `UpcomingDeadlinesWidget` | `/api/tasks/upcoming` |
| AI Tip | `AiTipWidget` | `/api/ai/tip` |
| Attendance Overview | `AttendanceOverviewWidget` | `/api/attendance` |

### Widget Layout
- 12-column CSS grid
- Stats row: 3 columns (small=4col each)
- Widgets: 6 columns (medium) or 12 columns (large)
- Widget preferences stored per-user in Supabase `preferences` table

---

## 9. Backend with Supabase

### Supabase Tables
```sql
-- Students (users)
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

-- User Preferences
CREATE TABLE public.preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  settings JSONB DEFAULT '{}',
  dashboard_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Auth Flow (Supabase Auth)
- Use Supabase Auth (`@supabase/auth-helpers-nextjs`) with email/password
- No OAuth providers initially (add Google/GitHub in V2)
- Middleware checks `supabase.auth.getSession()` instead of JWT verification
- Backend receives user from Supabase, adds custom fields (branch, year, subjects, telegram_username)

---

## 10. Component Architecture Pattern

Every feature follows this structure:

```
src/features/{domain}/
├── api/           # Data fetching hooks (useGet*, useCreate*, etc.)
├── components/    # UI components specific to this domain
├── store/         # Zustand stores for modal/state management
├── types.ts       # TypeScript types
└── utils/         # Helper functions
```

### Feature Modules
```
src/features/
├── auth/
│   ├── api/           # useLogin, useRegister, useLogout
│   ├── components/    # SignInCard, SignUpCard, AuthScreen
│   ├── store/         # useAuthStore
│   └── types.ts       # AuthFlow, LoginPayload, RegisterPayload
├── dashboard/
│   ├── api/           # useDashboardStats
│   ├── components/    # StatCard, TodayTasksWidget, etc.
│   ├── store/         # useDashboardStore
│   └── types.ts       # DashboardStats, Widget
├── tasks/
│   ├── api/           # useGetTasks, useCreateTask, useUpdateTask, useDeleteTask
│   ├── components/    # TaskCard, TaskForm, TaskFilters
│   ├── store/         # useTaskStore
│   ├── types.ts       # Task, TaskStatus, TaskFilter
│   └── utils/         # formatDate, getStatusColor
├── notices/
│   ├── api/           # useGetNotices, useSummarizeNotice, useBroadcastNotice
│   ├── components/    # NoticeCard, NoticeForm, NoticeList
│   ├── store/         # useNoticeStore
│   └── types.ts       # Notice, BroadcastStatus
├── attendance/
│   ├── api/           # useGetAttendance, useSaveAttendance, useAttendanceAlert
│   ├── components/    # AttendanceCard, AttendanceForm, RiskIndicator
│   ├── store/         # useAttendanceStore
│   └── types.ts       # Attendance, AttendanceRisk
└── automations/
    ├── api/           # useGetAutomationLogs
    ├── components/    # AutomationLogCard, AutomationList
    └── types.ts       # AutomationLog, WorkflowType
```

### Shared Components
```
src/components/
├── ui/              # Shadcn UI primitives (button, card, input, label, badge, separator)
├── shared/          # Shared layout components
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   ├── MobileFooter.tsx
│   └── AuthGuard.tsx
└── layout/          # Page layouts
    ├── DashboardLayout.tsx
    └── AuthLayout.tsx
```

### Custom Hooks
```
src/hooks/
├── useAuth.ts       # Auth state, login, register, logout
├── useSidebar.ts    # Sidebar collapse state, mobile toggle
├── usePanel.ts      # Right panel open/close state
└── useMediaQuery.ts # Responsive breakpoint detection
```

---

## 11. File Structure Summary

```
campusflow/
├── frontend/                    # Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── globals.css              # Design tokens + Tailwind config
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx           # Centered auth layout with brand panel
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx           # Sidebar + main content + auth guard
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── tasks/
│   │   │       │   ├── page.tsx         # Task list
│   │   │       │   ├── new/page.tsx     # Create task
│   │   │       │   └── [id]/page.tsx    # Edit task
│   │   │       ├── notices/page.tsx
│   │   │       ├── attendance/page.tsx
│   │   │       └── automations/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                      # Shadcn components
│   │   │   └── shared/                  # Shared components
│   │   │       ├── Sidebar.tsx
│   │   │       ├── MobileNav.tsx
│   │   │       └── MobileFooter.tsx
│   │   ├── features/                    # Feature modules
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── notices/
│   │   │   ├── attendance/
│   │   │   └── automations/
│   │   ├── hooks/                       # Custom hooks
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── lib/
│   │       ├── utils.ts                 # cn() helper
│   │       ├── supabase.ts              # Supabase browser client
│   │       └── api.ts                   # Backend API helper with JWT
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── package.json
├── backend/                     # Express
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   ├── notices.js
│   │   │   ├── attendance.js
│   │   │   ├── ai.js
│   │   │   └── automations.js
│   │   ├── services/
│   │   │   ├── supabase.js
│   │   │   ├── groq.js
│   │   │   └── n8n.js
│   │   └── middleware/auth.js
│   ├── .env.example
│   └── package.json
├── n8n/
│   ├── deadline-reminder.json
│   └── notice-broadcast.json
├── sql/
│   └── schema.sql
├── Documents/
│   ├── TRD.md
│   ├── Plan.md
│   ├── FuturePlan.md
│   ├── DESIGN_PLAN.md    ← This file
│   └── V1_TRACKER.md
└── README.md
```

---

## 12. Key Differences from Proddy (Design Reference)

| Aspect | Proddy (Original) | CampusFlow (Adapted) |
|--------|-------------------|----------------------|
| **Product** | Team workspace management | Student productivity hub |
| **Users** | Multi-member workspaces | Single student per account |
| **Sidebar** | Channels, Projects, Members, Planning, Messages | Tasks, Notices, Attendance, Automations |
| **Real-time** | WebSocket chat, threads | No chat — Telegram notifications |
| **Boards** | Kanban + Linear issues | Simple task list |
| **AI** | Assistant with tool loops | Notice summarizer + attendance alerts |
| **Calendar** | Per-user OAuth | Shared Google account via n8n |
| **Notifications** | In-app + email | Telegram Bot API (free) |
| **Backend** | Convex (original) → Supabase | Express.js + Supabase |
| **Route Groups** | `(auth)`, `(workspace)` | `(auth)`, `(dashboard)` |

---

## 13. Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

---

## 14. globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 84% 5%;
    --card: 0 0% 100%;
    --card-foreground: 222 84% 5%;
    --primary: 280 77% 23%;
    --primary-foreground: 210 16% 96%;
    --secondary: 326 100% 55%;
    --secondary-foreground: 222 84% 5%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 84% 5%;
    --destructive: 0 100% 65%;
    --destructive-foreground: 210 16% 96%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 280 77% 23%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 222 8% 12%;
    --foreground: 210 16% 96%;
    --card: 222 8% 15%;
    --card-foreground: 210 16% 96%;
    --primary: 280 77% 23%;
    --primary-foreground: 210 16% 96%;
    --secondary: 326 100% 55%;
    --secondary-foreground: 210 16% 96%;
    --muted: 222 8% 20%;
    --muted-foreground: 215 16% 67%;
    --accent: 222 8% 20%;
    --accent-foreground: 210 16% 96%;
    --destructive: 0 100% 65%;
    --destructive-foreground: 210 16% 96%;
    --border: 222 8% 20%;
    --input: 222 8% 20%;
    --ring: 280 77% 23%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar for purple sidebar */
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}
.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Transition standard utility */
.transition-standard {
  transition: all 200ms ease;
}
```
