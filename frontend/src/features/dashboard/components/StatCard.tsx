"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, color = "bg-primary/10 text-primary" }: StatCardProps) {
  return (
    <div className="bg-white border border-border rounded-[10px] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
