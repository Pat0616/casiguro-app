import { LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import Avatar from "@/components/ui/Avatar";
import { useNavigate } from "react-router-dom";
import { logout } from "@/utils/authAPI";
import { useAuth } from "@/context/AuthenticationContext";

interface SidebarProps {
  unreadCount: number;
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate, unreadCount }: SidebarProps) {

  const navigate = useNavigate();
  const { user } = useAuth();
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => user?.role === "admin" || !["dashboard", "statistics", "products-services"].includes(item.key)
  );

  const EnterLogout = async () =>
  {
    const res = logout();
    console.log("logout", res);
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
       <div className="sidebar-logocard"></div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={`/${item.key}`}
              onClick={onNavigate}
              className={({ isActive }) => cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-sky-600" : "text-slate-400")} />
                    {item.label}
                  </span>
                  {item.key === "notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <Avatar name={user?.full_name || "User"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.full_name || "Staff"}</p>
            <p className="truncate text-xs text-slate-400 capitalize">{user?.role || "Employee"}</p>
          </div>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-sky-600 transition" title="Log out"
          onClick={EnterLogout}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
