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
  Search,
  Bell,
  BarChart3,
  Calendar,
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import ThemeToggle from "@/components/ThemeToggle";


export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

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

      fetchOpenComplaints(role);
    }

    const handleProfileUpdate = () => {
      const updatedName = Cookies.get("user_name");
      if (updatedName) setUserName(updatedName);
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [router]);

  const [openComplaintsCount, setOpenComplaintsCount] = useState(0);

  const fetchOpenComplaints = async (role) => {
    try {
      if (role === "ROLE_TENANT") {
        const res = await api.get("/complaints/my");
        if (Array.isArray(res.data)) {
          const count = res.data.filter((c) => c.status === "OPEN").length;
          setOpenComplaintsCount(count);
        }
      } else {
        const res = await api.get("/complaints/owner");
        if (Array.isArray(res.data)) {
          const count = res.data.filter((c) => c.status === "OPEN").length;
          setOpenComplaintsCount(count);
        }
      }
    } catch (err) {
      console.warn("Could not fetch active complaints count", err);
    }
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
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
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Tenant Directory", href: "/dashboard/tenants", icon: Users },
    { name: "Properties & Beds", href: "/dashboard/properties", icon: Building },
    { name: "Allocations", href: "/dashboard/allocations", icon: Calendar },
    { name: "Rent & Invoices", href: "/dashboard/rent", icon: IndianRupee },
    { name: "Finance & Billing", href: "/dashboard/finance", icon: FileText },
    {
      name: "Complaints",
      href: "/dashboard/admin-complaints",
      icon: Wrench,
      badge: openComplaintsCount > 0 ? openComplaintsCount : null,
    },
    { name: "Notice Board", href: "/dashboard/announcements", icon: Megaphone },
  ];

  // Tenant Navigation Links
  const tenantNavItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Room & Bed", href: "/dashboard/my-room", icon: Home },
    { name: "Rent & Payments", href: "/dashboard/my-dues", icon: IndianRupee },
    {
      name: "Complaints",
      href: "/dashboard/my-complaints",
      icon: Wrench,
      badge: openComplaintsCount > 0 ? openComplaintsCount : null,
    },
  ];

  const isTenant = userRole === "ROLE_TENANT";
  const navItems = isTenant ? tenantNavItems : ownerNavItems;

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/dashboard/overview";
    }
    return pathname.startsWith(href);
  };

  // Get Initials from user name
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formattedRole = userRole.replace("ROLE_", "");

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen flex selection:bg-indigo-500 selection:text-white">
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* BEGIN: LeftSidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-indigo-950 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  PGManager
                </h1>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wide uppercase mt-1 inline-block">
                  {isTenant ? "Resident Portal" : "Enterprise Hub"}
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 md:hidden focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6 flex-1 overflow-y-auto space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation Menu
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition group ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom Profile Section */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 min-w-0 hover:opacity-85 transition cursor-pointer group"
                title="View & Edit Profile"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shadow-xs shrink-0 transition-colors">
                  {getInitials(userName)}
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                    {userName || "User"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {formattedRole}
                  </p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
      {/* END: LeftSidebar */}

      {/* BEGIN: MainContentArea */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Header Bar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                <span>PGManager</span>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-200">Dashboard</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Property Management System
              </h2>
            </div>
          </div>

          {/* Search and Top Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Bar */}
            <div className="relative w-44 sm:w-64 lg:w-72 hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
                placeholder="Search tenants, rooms, invoices..."
                type="text"
              />
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* User Badge Status */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/60 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700 rounded-full py-1.5 pl-2 pr-3 sm:pr-4 shadow-xs transition-all cursor-pointer group"
              title="Manage Account Profile"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center shrink-0 transition-colors shadow-xs">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors hidden sm:inline-block">
                  {userName}
                </span>
                <span className="text-[10px] font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                  {formattedRole}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Session" />
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">{children}</main>
      </div>
      {/* END: MainContentArea */}
    </div>
  );
}
