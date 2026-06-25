"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Zap, Target } from "lucide-react";
import { api } from "@/lib/api";
import type { Task, Attendance } from "@/features/types";

interface Badge {
  icon: typeof Trophy;
  label: string;
  earned: boolean;
  color: string;
  iconBg: string;
}

export function AchievementWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ tasks: Task[] }>("/api/tasks").catch(() => ({ tasks: [] })),
      api.get<{ attendance: Attendance[] }>("/api/attendance").catch(() => ({ attendance: [] })),
    ]).then(([taskRes, attRes]) => {
      setTasks(taskRes.tasks || []);
      setAttendance(attRes.attendance || []);
    }).finally(() => setLoading(false));
  }, []);

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalAttended = attendance.reduce((s, r) => s + r.attended_classes, 0);
  const totalClasses = attendance.reduce((s, r) => s + r.total_classes, 0);
  const attendancePct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  const earlyBirds = tasks.filter((t) => {
    const d = new Date(t.deadline);
    const now = new Date();
    return t.status === "completed" && d > now;
  }).length;

  const badges: Badge[] = [
    {
      icon: Target,
      label: "Task Master",
      earned: completedCount >= 10,
      color: completedCount >= 10 ? "text-primary" : "text-muted-foreground",
      iconBg: completedCount >= 10 ? "bg-primary/10" : "bg-muted",
    },
    {
      icon: Star,
      label: "Early Bird",
      earned: earlyBirds >= 3,
      color: earlyBirds >= 3 ? "text-primary" : "text-muted-foreground",
      iconBg: earlyBirds >= 3 ? "bg-primary/10" : "bg-muted",
    },
    {
      icon: Zap,
      label: "Attendance Hero",
      earned: attendancePct >= 75,
      color: attendancePct >= 75 ? "text-primary" : "text-muted-foreground",
      iconBg: attendancePct >= 75 ? "bg-primary/10" : "bg-muted",
    },
    {
      icon: Trophy,
      label: "Top Performer",
      earned: completedCount >= 20 && attendancePct >= 80,
      color: completedCount >= 20 && attendancePct >= 80 ? "text-primary" : "text-muted-foreground",
      iconBg: completedCount >= 20 && attendancePct >= 80 ? "bg-primary/10" : "bg-muted",
    },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;
  const xp = earnedCount * 200 + completedCount * 10;
  const maxXp = 1000;
  const level = Math.floor(xp / maxXp) + 1;
  const xpPercent = Math.min((xp % maxXp) / maxXp, 1) * 100;

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl p-5 h-full">
        <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-4" />
        <div className="h-6 bg-muted rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-5 card-hover h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Achievements</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-foreground">Level {level}</span>
          <span className="text-xs text-muted-foreground">{xp} / {maxXp} XP</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary animate-progress-fill"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {badges.map((badge, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
              badge.earned ? "bg-primary/5" : "bg-muted/30 opacity-60"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg ${badge.iconBg} flex items-center justify-center`}>
              <badge.icon className={`w-3.5 h-3.5 ${badge.color}`} />
            </div>
            <span className="text-xs font-medium text-foreground truncate">{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
