"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/features/types";

function getDaysLeft(deadline: string): number {
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysLabel(days: number): string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function getDaysColor(days: number): string {
  if (days < 0) return "bg-destructive/10 text-destructive";
  if (days <= 2) return "bg-orange-500/10 text-orange-600";
  if (days <= 5) return "bg-yellow-500/10 text-yellow-600";
  return "bg-green-500/10 text-green-600";
}

export function UpcomingDeadlinesWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ tasks: Task[] }>("/api/tasks/upcoming")
      .then((res) => setTasks(res.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-border rounded-[10px] p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-secondary" />
        <h3 className="font-semibold text-foreground">Upcoming Deadlines</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No upcoming deadlines. You&apos;re all clear!
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => {
            const days = getDaysLeft(task.deadline);
            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-[10px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.subject}</p>
                </div>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getDaysColor(days)}`}>
                  {getDaysLabel(days)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
