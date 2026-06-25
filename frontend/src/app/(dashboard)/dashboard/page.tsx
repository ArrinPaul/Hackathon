"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { TodayTasksWidget } from "@/features/dashboard/components/TodayTasksWidget";
import { UpcomingDeadlinesWidget } from "@/features/dashboard/components/UpcomingDeadlinesWidget";
import { AiTipWidget } from "@/features/dashboard/components/AiTipWidget";
import { AttendanceWidget } from "@/features/dashboard/components/AttendanceWidget";
import { ListTodo, Clock, CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/features/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ tasks: Task[] }>("/api/tasks")
      .then((res) => setTasks(res.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.name?.split(" ")[0] || "Student"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your deadlines today.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white border border-border rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={ListTodo} label="Total Tasks" value={String(totalCount)} color="bg-primary/10 text-primary" />
          <StatCard icon={Clock} label="Pending" value={String(pendingCount)} color="bg-orange-500/10 text-orange-600" />
          <StatCard icon={CheckCircle} label="Completed" value={String(completedCount)} color="bg-green-500/10 text-green-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasksWidget />
        <UpcomingDeadlinesWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiTipWidget />
        <AttendanceWidget />
      </div>
    </div>
  );
}
