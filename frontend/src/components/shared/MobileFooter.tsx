"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bot, ListTodo, Megaphone, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFooterProps {
  onMenuClick: () => void;
}

export function MobileFooter({ onMenuClick }: MobileFooterProps) {
  const pathname = usePathname();

  const items = [
    { icon: Menu, label: "Menu", onClick: onMenuClick },
    { href: "/dashboard/ai", icon: Bot, label: "AI" },
    { href: "/dashboard/tasks", icon: ListTodo, label: "Tasks" },
    { href: "/dashboard/notices", icon: Megaphone, label: "Notices" },
    { href: "/dashboard/automations", icon: Workflow, label: "More" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-primary border-t border-white/10 z-50">
      <nav className="flex items-center justify-around h-16">
        {items.map((item, i) => {
          if ("onClick" in item && item.onClick) {
            return (
              <button
                key={i}
                onClick={item.onClick}
                className="flex flex-col items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground transition-standard"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          }

          const href = "href" in item ? item.href : "";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 transition-standard",
                isActive(href) ? "text-primary-foreground" : "text-primary-foreground/70"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
