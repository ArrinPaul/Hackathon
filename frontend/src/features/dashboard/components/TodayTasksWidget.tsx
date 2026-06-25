"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus, ArrowRight, ClipboardList } from "lucide-react";
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
    <div className="bg-white border border-border rounded-xl p-5 card-hover h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Today&apos;s Tasks</h3>
        </div>
        {tasks.length > 0 && (
          <Link href="/dashboard/tasks" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No tasks due today</p>
          <p className="text-xs text-muted-foreground mb-4">Enjoy your free day!</p>
          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-medium rounded-full hover:bg-primary/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.subject}</p>
              </div>
              <span className="ml-2 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full whitespace-nowrap">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
