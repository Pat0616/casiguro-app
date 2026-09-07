import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/lib/constants";
import Sidebar from "./Sidebar";
import Logo from "./Logo";
import Avatar from "@/components/ui/Avatar";

interface AppShellProps {
  unreadCount: number;
}

export default function AppShell({ unreadCount }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const pageTitle = NAV_ITEMS.find((item) => `/${item.key}` === pathname)?.label || "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white md:block">
        <Sidebar unreadCount={unreadCount} />
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-72 bg-white shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              unreadCount={unreadCount}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="md:hidden">
              <Logo compact />
            </div>
            <h1 className="hidden font-display text-lg font-bold text-slate-900 md:block">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative rounded-full p-2.5 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-600" />}
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar name="Admin User" size="sm" />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
