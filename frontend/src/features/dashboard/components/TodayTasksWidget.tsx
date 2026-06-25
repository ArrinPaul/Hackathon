"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/features/types";

export function TodayTasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ tasks: Task[] }>("/api/tasks/today")
      .then((res) => setTasks(res.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-border rounded-[10px] p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Today&apos;s Tasks</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No tasks due today. Enjoy your day!
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-[10px]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.subject}</p>
              </div>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full whitespace-nowrap">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
