"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  Building,
  Users,
  IndianRupee,
  Wrench,
  Megaphone,
  LogOut,
  Menu,
  X,
  Building2,
  Home,
  FileText,
  UserCheck,
  Shield,
  ChevronDown,
  User,
  Bell,
  BarChart3,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.replace("/login");
    } else {
      const role = Cookies.get("role") || "ROLE_TENANT";
      const name = Cookies.get("user_name") || "Valued User";
      const email = Cookies.get("user_email") || "";
      setUserRole(role);
      setUserName(name);
      setUserEmail(email);
    }
  }, [router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("user_name");
    Cookies.remove("user_email");
    router.replace("/login");
  };

  // Owner & Staff Navigation Links
  const ownerNavItems = [
    { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Tenant Directory", href: "/dashboard/tenants", icon: Users },
    { name: "Properties & Beds", href: "/dashboard/properties", icon: Building },
    { name: "Allocations", href: "/dashboard/allocations", icon: Users },
    { name: "Rent & Invoices", href: "/dashboard/rent", icon: IndianRupee },
    { name: "Finance & Billing", href: "/dashboard/finance", icon: FileText },
    { name: "Complaints", href: "/dashboard/admin-complaints", icon: Wrench },
    { name: "Notice Board", href: "/dashboard/announcements", icon: Megaphone },
  ];

  // Tenant Navigation Links
  const tenantNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Room & Bed", href: "/dashboard/my-room", icon: Home },
    { name: "My Rent & Bills", href: "/dashboard/my-rent", icon: IndianRupee },
    { name: "My Complaints", href: "/dashboard/my-complaints", icon: Wrench },
  ];

  const isTenant = userRole === "ROLE_TENANT";
  const navItems = isTenant ? tenantNavItems : ownerNavItems;

  const isActive = (href) => {
    if (href === "/dashboard/overview" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FIXED SIDEBAR (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Brand Logo */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-white tracking-tight">
                  PG Manager
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-0.5">
                  {isTenant ? "Resident Portal" : "Enterprise Hub"}
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation Menu
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-indigo-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info & Quick Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {userRole.replace("ROLE_", "")}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WRAPPER (Header + Scrollable Content) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
          {/* Left: Mobile Hamburger Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xs font-semibold text-gray-500 hidden sm:inline-block">
              {isTenant ? "Resident Dashboard" : "Property Management System"}
            </span>
          </div>

          {/* Right: User Profile Menu & Logout */}
          <div className="flex items-center gap-3">
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {userName ? userName[0].toUpperCase() : "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-800 leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {userRole.replace("ROLE_", "")}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{userName}</p>
                    {userEmail && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {userEmail}
                      </p>
                    )}
                    <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {userRole}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-1 min-w-0 bg-slate-950 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
