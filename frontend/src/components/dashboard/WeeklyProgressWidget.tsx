"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Task } from "@/features/types";

export function WeeklyProgressWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ tasks: Task[] }>("/api/tasks")
      .then((res) => setTasks(res.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const getWeekData = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((label, i) => {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dayTasks = tasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= dayStart && d < dayEnd;
      });

      return {
        label,
        completed: dayTasks.filter((t) => t.status === "completed").length,
        pending: dayTasks.filter((t) => t.status !== "completed").length,
      };
    });
  };

  const weekData = getWeekData();
  const maxVal = Math.max(...weekData.map((d) => d.completed + d.pending), 1);
  const totalCompleted = weekData.reduce((s, d) => s + d.completed, 0);
  const totalPending = weekData.reduce((s, d) => s + d.pending, 0);

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl p-5 h-full">
        <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-4" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-5 card-hover h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">Weekly Progress</h3>
        <span className="text-xs text-muted-foreground">{totalCompleted} done this week</span>
      </div>

      <div className="flex items-end gap-2 h-32 mb-4">
        {weekData.map((day, i) => {
          const totalH = ((day.completed + day.pending) / maxVal) * 100;
          const completedH = (day.completed / (day.completed + day.pending || 1)) * totalH;
          return (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                <div
                  className="w-full rounded-t-sm bg-primary animate-progress-fill"
                  style={{ height: `${completedH}%`, animationDelay: `${i * 0.08}s` }}
                />
                <div
                  className="w-full rounded-b-sm bg-muted"
                  style={{ height: `${totalH - completedH}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{day.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span className="text-muted-foreground">Completed ({totalCompleted})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-muted" />
          <span className="text-muted-foreground">Pending ({totalPending})</span>
        </div>
      </div>
    </div>
  );
}
