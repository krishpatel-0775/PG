"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import {
  LogOut,
  Building2,
  UserCheck,
  Shield,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Wrench,
  KeyRound,
  FileText,
  Megaphone,
  Calendar,
  User,
  Loader2,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Announcements Widget State
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  // Route protection & Data Loading
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
      setIsAuthenticated(true);

      fetchRecentNotices(role);
    }
  }, [router]);

  const fetchRecentNotices = async (role) => {
    setLoadingNotices(true);
    try {
      if (role === "ROLE_TENANT") {
        // Find resident's active allocation property ID
        const allocationRes = await api.get("/allocations/my");
        if (allocationRes.data && allocationRes.data.propertyId) {
          const noticeRes = await api.get(`/notices/property/${allocationRes.data.propertyId}`);
          setNotices((noticeRes.data || []).slice(0, 3));
        } else {
          setNotices([]);
        }
      } else {
        // For Owners/Staff: fetch first property's notices
        const propRes = await api.get("/properties");
        if (propRes.data && propRes.data.length > 0) {
          const firstPropId = propRes.data[0].id;
          const noticeRes = await api.get(`/notices/property/${firstPropId}`);
          setNotices((noticeRes.data || []).slice(0, 3));
        } else {
          setNotices([]);
        }
      }
    } catch (err) {
      console.error("Failed to load recent announcements", err);
      setNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("user_name");
    Cookies.remove("user_email");
    router.replace("/login");
  };

  // Helper for role formatting and styling
  const getRoleConfig = (role) => {
    switch (role) {
      case "ROLE_PG_OWNER":
        return {
          label: "PG Owner",
          description: "Full property, room allocation, billing, and notice broadcast access",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: Building2,
          features: [
            { title: "Operations Overview", icon: Building2, desc: "Live occupancy, pending revenue, and ticket triage KPI metrics.", href: "/dashboard/overview" },
            { title: "Manage Properties", icon: Home, desc: "Add or edit PG branches and room capacities.", href: "/dashboard/properties" },
            { title: "Tenant Directory", icon: Users, desc: "Review occupancy status and registered tenants.", href: "/dashboard/allocations" },
            { title: "Billing & Invoices", icon: FileText, desc: "Track rent cycles, deposits, and payments.", href: "/dashboard/finance" },
            { title: "Maintenance Tickets", icon: Wrench, desc: "Review and resolve tenant maintenance requests.", href: "/dashboard/admin-complaints" },
            { title: "Notice Board", icon: Megaphone, desc: "Broadcast announcements and alerts to residents.", href: "/dashboard/announcements" },
          ],
        };
      case "ROLE_STAFF":
        return {
          label: "Staff / Support",
          description: "Facility maintenance, cleaning schedules, and service operations",
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: Wrench,
          features: [
            { title: "Maintenance Requests", icon: Wrench, desc: "Review and resolve active tenant tickets.", href: "/dashboard/admin-complaints" },
            { title: "Housekeeping", icon: Clock, desc: "Check daily cleaning and supply checklists." },
            { title: "Access Control", icon: KeyRound, desc: "Manage visitor logs and facility entry." },
          ],
        };
      case "ROLE_TENANT":
      default:
        return {
          label: "Tenant (Resident)",
          description: "Room booking, rent dues, and maintenance ticket portal",
          badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          icon: UserCheck,
          features: [
            { title: "My Room & Bed", icon: Home, desc: "View your current allocation and amenities.", href: "/dashboard/my-room" },
            { title: "Rent & Payments", icon: FileText, desc: "Check upcoming dues and download receipts.", href: "/dashboard/my-dues" },
            { title: "Raise a Complaint", icon: Wrench, desc: "Submit tickets for maintenance or service.", href: "/dashboard/my-complaints" },
          ],
        };
    }
  };

  // Prevent flash while checking auth status
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  const roleConfig = getRoleConfig(userRole);
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">PG Manager</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-white">{userName}</span>
              {userEmail && <span className="text-xs text-slate-400">{userEmail}</span>}
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner / Hero Card */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/80 to-slate-900/80 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${roleConfig.badgeColor}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {roleConfig.label}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Session
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {userName}!
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
                {roleConfig.description}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Authenticated Role</p>
                <p className="text-sm font-semibold text-white font-mono">{userRole}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Announcements Widget (Tenant & Owner Bulletin) */}
        <section className="bg-slate-900/50 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Recent Announcements</h2>
                <p className="text-xs text-slate-400">Latest building updates and notices from management</p>
              </div>
            </div>

            {userRole === "ROLE_PG_OWNER" && (
              <Link
                href="/dashboard/announcements"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                Manage Board <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loadingNotices ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <Megaphone className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              No recent announcements.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        {new Date(n.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                      <span className="font-medium text-slate-400">{n.createdBy}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">
                      {n.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Feature Cards Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Quick Actions & Modules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleConfig.features.map((feature, idx) => {
              const FeatureIcon = feature.icon;
              const CardContent = (
                <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all rounded-xl p-6 flex flex-col justify-between group hover:shadow-lg hover:shadow-indigo-500/5 h-full">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                      <FeatureIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                    <span>{feature.href ? "Active Module" : "Module Ready"}</span>
                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                      Explore &rarr;
                    </span>
                  </div>
                </div>
              );

              return feature.href ? (
                <Link key={idx} href={feature.href} className="block h-full">
                  {CardContent}
                </Link>
              ) : (
                <div key={idx} className="h-full">
                  {CardContent}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>PG Management Portal &bull; Secured with Spring Boot JWT & Next.js App Router</p>
      </footer>
    </div>
  );
}
