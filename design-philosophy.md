# CampusFlow UI/UX Design Philosophy

This document defines the core visual language, layout principles, and component standards of **CampusFlow**. All agents and developers building new pages or features for CampusFlow must strictly follow these rules to ensure design consistency, structure, and spacing across the entire application.

---

## 1. Core Visual Language

CampusFlow is an AI-powered academic dashboard. The aesthetic is clean, professional, and functional. It balances a quiet, highly-readable layout with targeted, vibrant color accents that denote action and AI assistance.

### Key Visual Pillars:
1. **Restraint Over Clutter**: White/light gray canvas with crisp borders instead of heavy colorful backgrounds.
2. **Vibrant Color Accents**: A deep purple primary color (`hsl(280 77% 23%)`) serves as the core action color, and a vibrant magenta/pink secondary color (`hsl(326 100% 55%)`) signals AI operations or alerts.
3. **Soft, Uniform Corners**: Components (inputs, cards, buttons) consistently use a `10px` (`rounded-[10px]`) radius to feel modern and friendly but structured.
4. **Subtle Elevation**: Depth is defined by light gray borders (`hsl(214 32% 91%)`) and faint layered shadows (`shadow-sm`), keeping the interface lightweight.
5. **Consistent Micro-interactions**: Hover actions translate or fade smoothly using a uniform `200ms ease` transition.

---

## 2. Color Palette (CSS Variables)

Colors are defined using CSS variables in HSL format inside [globals.css](file:///D:/Project/frontend/src/app/globals.css).

| Color Token | Light Theme Value (HSL) | Dark Theme Value (HSL) | Purpose |
|---|---|---|---|
| `--background` | `0 0% 100%` (White) | `222 8% 12%` (Charcoal) | Base page canvas |
| `--foreground` | `222 84% 5%` (Deep Navy) | `210 16% 96%` (Off-white) | Standard text / glyphs |
| `--card` | `0 0% 100%` (White) | `222 8% 15%` (Raised Charcoal) | Container backgrounds |
| `--primary` | `280 77% 23%` (Deep Purple) | `280 77% 23%` (Deep Purple) | Primary actions, branding, title icons |
| `--secondary` | `326 100% 55%` (Magenta) | `326 100% 55%` (Magenta) | AI accents, helper widgets, key signals |
| `--muted` | `210 40% 96%` (Soft Blue-Gray) | `222 8% 20%` (Muted Charcoal) | Secondary backgrounds, subtle tags |
| `--muted-foreground`| `215 16% 47%` (Medium Slate) | `215 16% 67%` (Light Slate) | Explanations, subtitles, labels |
| `--border` | `214 32% 91%` (Light Slate Border)| `222 8% 20%` (Dark Slate Border) | 1px dividers, card boundaries |
| `--input` | `214 32% 91%` (Light Slate Border)| `222 8% 20%` (Dark Slate Border) | Form element borders |
| `--ring` | `280 77% 23%` (Deep Purple) | `280 77% 23%` (Deep Purple) | Active input focus ring |
| `--destructive` | `0 100% 65%` (Vibrant Red) | `0 100% 65%` (Vibrant Red) | Errors, delete warnings |

---

## 3. Typography Standards

The typography uses the **Geist** font family (`--font-geist-sans` for sans-serif text, and `--font-geist-mono` for code and metadata).

### Type Hierarchy:
- **Dashboard Section Titles (H1)**: `text-2xl font-bold text-foreground` (with a subtitle/description below).
- **Widget / Card Headers (H3)**: `text-base font-semibold text-foreground` or `text-lg font-bold text-foreground` for larger details.
- **Body Bold / Labels**: `text-sm font-medium text-foreground`.
- **Default Body text**: `text-sm text-muted-foreground` or `text-sm text-foreground`.
- **Metadata / Small badges**: `text-xs text-muted-foreground` or `text-xs font-semibold`.

---

## 4. Layout Grid & Spacing

To keep pages consistent, build layouts according to these structural specifications:

- **Desktop Shell**: 
  - Left navigation sidebar: `w-[280px]` (collapsed to `w-[70px]`).
  - Active layout: `flex min-h-screen`.
  - Main container: `flex-1 overflow-auto p-6`.
  - Mobile Padding: On screens smaller than `768px`, the sidebar hidden state switches to a bottom mobile menu (`pb-16` on main view, bottom navbar absolute height).
- **Grid Layout Rhythms**:
  - Main page content wrapper: `max-w-5xl mx-auto space-y-6`.
  - Dashboard panels/widgets: `grid grid-cols-1 lg:grid-cols-2 gap-6`.
  - Stat cards: `grid grid-cols-1 sm:grid-cols-3 gap-4`.

---

## 5. UI Component Spec & Templates

Use these exact HTML structure and Tailwind classes when generating new elements.

### A. Page Header & Section Title Block
Placed at the top of every dashboard sub-page. If there is a page action button (e.g., "New Task"), place it on the right side of a flex container.

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
    <p className="text-muted-foreground mt-1">Manage your deadlines and assignments</p>
  </div>
  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-[10px] hover:opacity-90 transition-standard cursor-pointer">
    <Plus className="w-4 h-4" />
    New Task
  </button>
</div>
```

### B. Standard Card / Widget Container
Standard cards sit on the page background, bordered with 10px rounded corners and a soft shadow.

```tsx
<div className="bg-white border border-border rounded-[10px] p-5 shadow-sm h-full">
  <div className="flex items-center gap-2 mb-4">
    <CalendarClock className="w-5 h-5 text-primary" />
    <h3 className="font-semibold text-foreground">Widget Title</h3>
  </div>
  <div className="space-y-3">
    {/* Card Content */}
  </div>
</div>
```

### C. AI / Sparkle Feature Card
Use a subtle background gradient going from primary (purple) to secondary (magenta) at low opacity to distinguish AI tools.

```tsx
<div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-border rounded-[10px] p-5 shadow-sm h-full">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-primary" />
    </div>
    <h3 className="font-semibold text-foreground">AI Assistant</h3>
  </div>
  <p className="text-sm text-muted-foreground leading-relaxed italic">
    "Your content goes here..."
  </p>
</div>
```

### D. Form Elements
Form fields use a tight `rounded-[10px]` styling. Labels are small and placed above the inputs.

```tsx
{/* Text / Number Input */}
<div>
  <label className="block text-sm font-medium text-foreground mb-1.5">
    Email Address *
  </label>
  <input
    type="email"
    className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    placeholder="you@example.com"
    required
  />
</div>

{/* Select Field */}
<div>
  <label className="block text-sm font-medium text-foreground mb-1.5">
    Status
  </label>
  <select className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white">
    <option value="pending">Pending</option>
    <option value="completed">Completed</option>
  </select>
</div>

{/* Textarea Field */}
<div>
  <label className="block text-sm font-medium text-foreground mb-1.5">
    Description
  </label>
  <textarea className="w-full h-24 px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Enter notes..." />
</div>
```

### E. Alert Banners & Banners
Banners display errors, success indicators, or inline warnings.

```tsx
{/* Success Alert */}
<div className="p-3 bg-green-500/10 border border-green-500/20 rounded-[10px] text-sm text-green-600">
  Action completed successfully!
</div>

{/* Error / Destructive Alert */}
<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[10px] text-sm text-destructive">
  Something went wrong. Please check your inputs.
</div>

{/* Warning Alert (e.g. Low attendance alert) */}
<div className="p-3 text-xs rounded-[8px] flex items-start gap-2 border bg-destructive/5 border-destructive/10 text-destructive leading-relaxed">
  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
  <span>Warning: You are below the required threshold of 75% attendance.</span>
</div>
```

### F. Lists & Row Layouts
Item lists within cards or pages stack vertically with flexible dividers.

```tsx
<div className="divide-y divide-border">
  <div className="p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-standard">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate">Item Title</p>
      <p className="text-xs text-muted-foreground">Subtitle or date metadata</p>
    </div>
    <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
      Status Label
    </span>
  </div>
</div>
```

### G. Buttons & Tabs
Button variations and layout tabs.

```tsx
{/* Primary Action Button */}
<button className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-[10px] hover:opacity-90 transition-standard cursor-pointer">
  Submit Task
</button>

{/* Secondary Action / Cancel Button */}
<button className="px-4 py-2 border border-border text-foreground font-medium rounded-[10px] hover:bg-accent transition-standard cursor-pointer">
  Cancel
</button>

{/* Destructive / Trash Button */}
<button className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-standard cursor-pointer">
  <Trash2 className="w-4 h-4" />
</button>

{/* Filter / Layout Tabs */}
<div className="flex gap-2 border-b border-border pb-1">
  <button className="px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary capitalize cursor-pointer">
    Active Tab
  </button>
  <button className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-standard capitalize cursor-pointer">
    Inactive Tab
  </button>
</div>
```

---

## 6. Interaction & Animation Principles

All interactive buttons or links must have smooth transitions:
- Include the Tailwind transition utility: `transition-standard` which matches the CSS `.transition-standard { transition: all 200ms ease; }`.
- Input fields must have `focus:outline-none focus:ring-2 focus:ring-ring` to style focus active outlines.
- Action loading states should replace the text or icon with a `Loader2` icon spinning: `<Loader2 className="w-4 h-4 animate-spin" />` and have `disabled:opacity-50`.
- Toggles and check circles must transit color changes smoothly.

---

## 7. Do's and Don'ts

### Do:
- Always use `rounded-[10px]` for cards, buttons, input fields, and lists.
- Always use `transition-standard` for interactive hover states.
- Group layouts inside `max-w-5xl mx-auto` and keep spacing vertically standard using `space-y-6`.
- Keep icons consistently sized: `w-4 h-4` for action inline text labels, `w-5 h-5` for title sections and panel headers.
- Reserve the primary color (`hsl(280 77% 23%)`) for high-level branding and active actions, and the secondary color (`hsl(326 100% 55%)`) for AI-focused highlights.

### Don't:
- Don't use standard Tailwind standard rounding like `rounded-md` or `rounded-lg` on main page components — use the exact `rounded-[10px]` standard corner radius.
- Don't hardcode Hex values in code; always use utility color classes (e.g. `bg-primary`, `text-muted-foreground`, `border-border`) so dark-mode adapts automatically.
- Don't create pages without a proper responsive collapsible sidebar strategy (ensure `isDesktop` layout splits page components properly).
- Don't overlay heavy shadow boxes or thick borders; keep backgrounds clean white and borders minimal (`border-border`).
