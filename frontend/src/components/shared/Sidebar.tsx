"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Bot,
  ListTodo,
  Megaphone,
  BarChart3,
  Workflow,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/ai", icon: Bot, label: "AI Assistant" },
  ];

  const toolItems = [
    { href: "/dashboard/tasks", icon: ListTodo, label: "Tasks" },
    { href: "/dashboard/notices", icon: Megaphone, label: "Notices" },
    { href: "/dashboard/attendance", icon: BarChart3, label: "Attendance" },
  ];

  const systemItems = [
    { href: "/dashboard/automations", icon: Workflow, label: "Automations" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-primary text-primary-foreground transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className={cn("flex items-center h-16 border-b border-white/10", isCollapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8" />
          {!isCollapsed && <span className="text-lg font-bold">CampusFlow</span>}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-standard",
              isActive(item.href)
                ? "bg-white/20 shadow-sm"
                : "hover:bg-white/10 hover:translate-x-1"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <div className="pt-4 pb-2">
          {!isCollapsed && (
            <p className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Tools</p>
          )}
        </div>

        {toolItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-standard",
              isActive(item.href)
                ? "bg-white/20 shadow-sm"
                : "hover:bg-white/10 hover:translate-x-1"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <div className="pt-4 pb-2">
          {!isCollapsed && (
            <p className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider">System</p>
          )}
        </div>

        {systemItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-standard",
              isActive(item.href)
                ? "bg-white/20 shadow-sm"
                : "hover:bg-white/10 hover:translate-x-1"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2 space-y-1">
        {!isCollapsed && user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-white/60 truncate">{user.email}</p>
          </div>
        )}

        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-sm font-medium transition-standard hover:bg-white/10",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>

        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-sm font-medium transition-standard hover:bg-white/10",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
