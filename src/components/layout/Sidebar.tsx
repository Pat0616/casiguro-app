import { LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import Avatar from "@/components/ui/Avatar";
import { useNavigate } from "react-router-dom";
import { logout } from "@/utils/authAPI";

interface SidebarProps {
  unreadCount: number;
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate, unreadCount }: SidebarProps) {

  const navigate = useNavigate();

  const EnterLogout = async () =>
  {
    const res = logout();
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
       <div className="sidebar-logocard"></div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={`/${item.key}`}
              onClick={onNavigate}
              className={({ isActive }) => cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-pink-50 to-sky-50 text-pink-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-pink-600" : "text-slate-400")} />
                    {item.label}
                  </span>
                  {item.key === "notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-pink-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <Avatar name="Admin User" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">Admin User</p>
            <p className="truncate text-xs text-slate-400">Administrator</p>
          </div>
          <button  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-pink-600" title="Log out"
          onClick={EnterLogout}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
