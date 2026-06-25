"use client";

import { useEffect, useState } from "react";
import { Flame, Clock, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/features/types";

export function StudyStreakWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ tasks: Task[] }>("/api/tasks")
      .then((res) => setTasks(res.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const getStreakData = () => {
    const now = new Date();
    let streak = 0;
    let totalHours = 0;
    let totalFinished = 0;

    for (let i = 0; i < 365; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const dayTasks = tasks.filter((t) => {
        const d = new Date(t.created_at);
        return d >= day && d < nextDay;
      });

      const completed = dayTasks.filter((t) => t.status === "completed");

      if (i === 0 || (dayTasks.length > 0 && completed.length > 0)) {
        if (completed.length > 0) {
          streak++;
          totalFinished += completed.length;
          totalHours += completed.length * 0.5;
        } else if (i === 0) {
          // today counts if there are any tasks
        } else {
          break;
        }
      } else if (dayTasks.length === 0) {
        if (i > 0) break;
      } else {
        break;
      }
    }

    if (streak === 0 && tasks.some((t) => t.status === "completed")) {
      streak = 1;
      totalFinished = tasks.filter((t) => t.status === "completed").length;
      totalHours = totalFinished * 0.5;
    }

    return { streak, totalHours: totalHours.toFixed(1), totalFinished };
  };

  const { streak, totalHours, totalFinished } = getStreakData();

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-5 h-full text-white">
        <div className="h-4 bg-white/20 rounded animate-pulse w-1/3 mb-4" />
        <div className="h-20 bg-white/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-xl p-5 card-hover h-full text-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <h3 className="font-semibold">Study Streak</h3>
      </div>

      <div className="text-center mb-4">
        <p className="text-4xl font-bold tracking-tight">{streak}</p>
        <p className="text-xs text-white/70 mt-0.5">Day Streak</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-white/70" />
            <span className="text-xs text-white/70">Hours</span>
          </div>
          <p className="text-lg font-bold">{totalHours}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-white/70" />
            <span className="text-xs text-white/70">Tasks</span>
          </div>
          <p className="text-lg font-bold">{totalFinished}</p>
        </div>
      </div>
    </div>
  );
}
