"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileFooter } from "@/components/shared/MobileFooter";
import { MobileNav } from "@/components/shared/MobileNav";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isCollapsed, isMobileOpen, toggleCollapse, openMobile, closeMobile } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      {isDesktop ? (
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleCollapse} />
      ) : (
        <MobileNav
          isOpen={isMobileOpen}
          onClose={closeMobile}
          isCollapsed={false}
          onToggle={toggleCollapse}
        />
      )}

      <main className={`flex-1 overflow-auto ${!isDesktop ? "pb-16" : ""}`}>
        <div className="p-6">{children}</div>
      </main>

      {!isDesktop && <MobileFooter onMenuClick={openMobile} />}
    </div>
  );
}
