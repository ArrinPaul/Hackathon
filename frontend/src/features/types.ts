export type TaskStatus = "pending" | "completed" | "cancelled";

export type TaskFilter = "all" | "today" | "upcoming" | "completed";

export interface Task {
  id: string;
  student_id: string;
  title: string;
  subject: string;
  description: string | null;
  deadline: string;
  reminder_time: string | null;
  add_to_calendar: boolean;
  status: TaskStatus;
  n8n_triggered: boolean;
  created_at: string;
}

export interface Notice {
  id: string;
  student_id: string;
  notice_text: string;
  ai_summary: string | null;
  event_date: string | null;
  event_title: string | null;
  broadcast_status: "pending" | "sent" | "failed";
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  subject: string;
  total_classes: number;
  attended_classes: number;
  threshold: number;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  student_id: string;
  workflow_type: "deadline_reminder" | "notice_broadcast" | "attendance_alert";
  status: "triggered" | "success" | "failed";
  details: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingDeadlines: Task[];
  todayTasks: Task[];
  attendance: Attendance[];
  aiTip: string;
}
