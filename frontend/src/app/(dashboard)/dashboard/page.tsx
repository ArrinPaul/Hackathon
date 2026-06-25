"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { TodayTasksWidget } from "@/features/dashboard/components/TodayTasksWidget";
import { UpcomingDeadlinesWidget } from "@/features/dashboard/components/UpcomingDeadlinesWidget";
import { AttendanceWidget } from "@/features/dashboard/components/AttendanceWidget";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import { WeeklyProgressWidget } from "@/components/dashboard/WeeklyProgressWidget";
import { StudyStreakWidget } from "@/components/dashboard/StudyStreakWidget";
import { UpcomingEventsWidget } from "@/components/dashboard/UpcomingEventsWidget";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { ProductivityScoreWidget } from "@/components/dashboard/ProductivityScoreWidget";
import { FocusTimerWidget } from "@/components/dashboard/FocusTimerWidget";
import { CampusNewsWidget } from "@/components/dashboard/CampusNewsWidget";
import { AchievementWidget } from "@/components/dashboard/AchievementWidget";
import { QuoteWidget } from "@/components/dashboard/QuoteWidget";
import { MonthlyCalendarWidget } from "@/components/dashboard/MonthlyCalendarWidget";
import { ListTodo, Clock, CheckCircle, CalendarDays } from "lucide-react";
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

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1 tracking-tight" style={{ letterSpacing: "-0.04em" }}>
              {getGreeting()}, {user?.name?.split(" ")[0] || "Student"} 👋
            </h1>
            <p className="text-white/70 text-sm">
              Here&apos;s what&apos;s happening with your deadlines today.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
              <CalendarDays className="w-4 h-4" />
              <span className="font-medium">{getFormattedDate()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{getFormattedTime()}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
          <StatCard icon={ListTodo} label="Total Tasks" value={String(totalCount)} color="bg-primary/10 text-primary" />
          <StatCard icon={Clock} label="Pending" value={String(pendingCount)} color="bg-primary/5 text-primary" />
          <StatCard icon={CheckCircle} label="Completed" value={String(completedCount)} color="bg-primary/10 text-primary" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyCalendarWidget />
        <div className="space-y-6">
          <TodayTasksWidget />
          <UpcomingDeadlinesWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceWidget />
        <StudyStreakWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionsWidget />
        <WeeklyProgressWidget />
        <UpcomingEventsWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecentActivityWidget />
        <ProductivityScoreWidget />
        <FocusTimerWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CampusNewsWidget />
        <AchievementWidget />
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          <QuoteWidget />
        </div>
      </div>
    </div>
  );
}
