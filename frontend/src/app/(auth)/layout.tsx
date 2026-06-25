"use client";

import { GraduationCap, CheckCircle, Bell, CalendarClock } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-primary">
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
            <span className="text-2xl font-bold text-primary-foreground">CampusFlow</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-4">
            Your AI-Powered Student Hub
          </h1>
          <p className="text-primary-foreground/80 mb-8">
            Never miss a deadline again. Smart reminders, AI summaries, and attendance tracking — all in one place.
          </p>
          <div className="space-y-4">
            {[
              { icon: CalendarClock, text: "Automatic Telegram reminders" },
              { icon: CheckCircle, text: "AI notice summarization" },
              { icon: Bell, text: "Attendance risk alerts" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
