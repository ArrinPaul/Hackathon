"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/features/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyCalendarWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    api
      .get<{ tasks: Task[] }>("/api/tasks")
      .then((res) => setTasks(res.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const isSelected = (day: number) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  const getTasksForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(dayDate);
    nextDay.setDate(dayDate.getDate() + 1);

    return tasks.filter((t) => {
      const d = new Date(t.deadline);
      return d >= dayDate && d < nextDay;
    });
  };

  const getSelectedDayTasks = () => {
    if (!selectedDate) return [];
    return getTasksForDay(selectedDate.getDate());
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const selectedTasks = getSelectedDayTasks();

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl p-5 h-full">
        <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-4" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-5 card-hover h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Previous month">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground px-2 min-w-[120px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Next month">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden mb-4">
        {DAY_NAMES.map((day) => (
          <div key={day} className="bg-muted/50 py-1.5 text-center text-[10px] font-semibold text-muted-foreground uppercase">
            {day}
          </div>
        ))}

        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-white min-h-[48px]" />;
          }

          const dayTasks = getTasksForDay(day);
          const hasTasks = dayTasks.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(new Date(year, month, day))}
              className={`relative bg-white min-h-[48px] p-1 transition-colors hover:bg-primary/5 ${
                isSelected(day) ? "bg-primary/10" : ""
              }`}
            >
              <span
                className={`text-xs font-medium block text-left ${
                  isToday(day)
                    ? "bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center -ml-0.5 -mt-0.5"
                    : "text-foreground"
                }`}
              >
                {day}
              </span>
              {hasTasks && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`w-full h-1 rounded-full ${
                        task.status === "completed" ? "bg-emerald-400" : "bg-primary"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No events</p>
          ) : (
            <div className="space-y-1.5">
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    task.status === "completed" ? "bg-emerald-50" : "bg-primary/5"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      task.status === "completed" ? "bg-emerald-500" : "bg-primary"
                    }`}
                  />
                  <span className={`font-medium truncate ${task.status === "completed" ? "text-emerald-700 line-through" : "text-foreground"}`}>
                    {task.title}
                  </span>
                  <span className="ml-auto text-muted-foreground flex-shrink-0">{task.subject}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
