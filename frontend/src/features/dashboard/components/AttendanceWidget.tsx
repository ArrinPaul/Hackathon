"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import type { Attendance } from "@/features/types";

function getPercentage(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

function getColor(pct: number): string {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 65) return "bg-yellow-500";
  return "bg-destructive";
}

function getTextColor(pct: number): string {
  if (pct >= 75) return "text-green-600";
  if (pct >= 65) return "text-yellow-600";
  return "text-destructive";
}

export function AttendanceWidget() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ attendance: Attendance[] }>("/api/attendance")
      .then((res) => setAttendance(res.attendance || []))
      .catch(() => setAttendance([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-border rounded-[10px] p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-foreground">Attendance Overview</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : attendance.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No attendance records yet.
        </p>
      ) : (
        <div className="space-y-3">
          {attendance.slice(0, 5).map((record) => {
            const pct = getPercentage(record.attended_classes, record.total_classes);
            return (
              <div key={record.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{record.subject}</span>
                  <span className={`text-sm font-semibold ${getTextColor(pct)}`}>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
