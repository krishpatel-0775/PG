"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import {
  Building2,
  UserCheck,
  Shield,
  Home,
  Users,
  Wrench,
  FileText,
  Megaphone,
  Calendar,
  Loader2,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  LayoutDashboard,
  Clock,
  KeyRound,
  ArrowRight,
  Plus,
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

  // Operational Summary Metrics State
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

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
      fetchDashboardMetrics(role);
    }
  }, [router]);

  const fetchDashboardMetrics = async (role) => {
    if (role !== "ROLE_PG_OWNER" && role !== "ROLE_SUPER_ADMIN") {
      setLoadingSummary(false);
      return;
    }
    setLoadingSummary(true);
    try {
      // 1. Try owner aggregated endpoint
      try {
        const res = await api.get("/dashboard/summary/owner");
        if (res.data) {
          setSummary(res.data);
          setLoadingSummary(false);
          return;
        }
      } catch (e) {
        console.warn("Direct owner summary endpoint not reachable, aggregating via properties...", e);
      }

      // 2. Resilient fallback: fetch properties and compute
      const propRes = await api.get("/properties");
      const properties = propRes.data || [];
      if (properties.length === 0) {
        setSummary({
          totalBeds: 0,
          occupiedBeds: 0,
          vacantBeds: 0,
          maintenanceBeds: 0,
          totalPendingRent: 0,
          unpaidInvoicesCount: 0,
          currentMonthRevenue: 0,
          lastMonthRevenue: 0,
          revenueGrowthRate: 0,
          openComplaintsCount: 0,
          inProgressComplaintsCount: 0,
          resolvedComplaintsCount: 0,
          occupancyRate: 0,
        });
        setLoadingSummary(false);
        return;
      }

      let totalBeds = 0;
      let occupiedBeds = 0;
      let totalPendingRent = 0;
      let openComplaintsCount = 0;
      let inProgressComplaintsCount = 0;
      let resolvedComplaintsCount = 0;
      let currentMonthRevenue = 0;
      let lastMonthRevenue = 0;
      let unpaidInvoicesCount = 0;

      // Count unpaid invoices
      try {
        const pendingInvRes = await api.get("/finance/invoices/pending");
        if (Array.isArray(pendingInvRes.data)) {
          unpaidInvoicesCount = pendingInvRes.data.length;
        }
      } catch (e) {
        console.warn("Could not fetch pending invoices count", e);
      }

      // Complaints breakdown
      try {
        const compRes = await api.get("/complaints/owner");
        if (Array.isArray(compRes.data)) {
          openComplaintsCount = compRes.data.filter((c) => c.status === "OPEN").length;
          inProgressComplaintsCount = compRes.data.filter((c) => c.status === "IN_PROGRESS").length;
          resolvedComplaintsCount = compRes.data.filter((c) => c.status === "RESOLVED").length;
        }
      } catch (e) {
        console.warn("Could not fetch owner complaints", e);
      }

      for (const p of properties) {
        try {
          const sRes = await api.get(`/dashboard/summary/property/${p.id}`);
          if (sRes.data) {
            totalBeds += sRes.data.totalBeds || 0;
            occupiedBeds += sRes.data.occupiedBeds || 0;
            totalPendingRent += Number(sRes.data.totalPendingRent) || 0;
            if (sRes.data.currentMonthRevenue !== undefined) {
              currentMonthRevenue += Number(sRes.data.currentMonthRevenue) || 0;
            }
            if (sRes.data.lastMonthRevenue !== undefined) {
              lastMonthRevenue += Number(sRes.data.lastMonthRevenue) || 0;
            }
            if (sRes.data.unpaidInvoicesCount !== undefined) {
              unpaidInvoicesCount = Math.max(unpaidInvoicesCount, sRes.data.unpaidInvoicesCount);
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch summary for property ${p.id}`, e);
        }
      }

      const occupancyRate =
        totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

      let revenueGrowthRate = 0;
      if (lastMonthRevenue > 0) {
        revenueGrowthRate = Number(
          (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
        );
      } else if (currentMonthRevenue > 0) {
        revenueGrowthRate = 100.0;
      }

      setSummary({
        totalBeds,
        occupiedBeds,
        occupancyRate,
        totalPendingRent,
        unpaidInvoicesCount,
        currentMonthRevenue,
        lastMonthRevenue,
        revenueGrowthRate,
        openComplaintsCount,
        inProgressComplaintsCount,
        resolvedComplaintsCount,
      });
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchRecentNotices = async (role) => {
    setLoadingNotices(true);
    try {
      if (role === "ROLE_TENANT") {
        try {
          const allocationRes = await api.get("/allocations/my");
          if (allocationRes.data && allocationRes.data.propertyId) {
            const noticeRes = await api.get(`/notices/property/${allocationRes.data.propertyId}`);
            setNotices(noticeRes.data || []);
          } else {
            setNotices([]);
          }
        } catch {
          setNotices([]);
        }
      } else {
        const propRes = await api.get("/properties");
        const props = propRes.data || [];
        if (props.length > 0) {
          const allPromises = props.map((p) =>
            api
              .get(`/notices/property/${p.id}`)
              .then((res) =>
                (res.data || []).map((n) => ({ ...n, propertyName: p.name }))
              )
              .catch(() => [])
          );
          const results = await Promise.all(allPromises);
          const combined = results.flat();
          combined.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setNotices(combined);
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

  // Helper for role formatting and styling
  const getRoleConfig = (role) => {
    switch (role) {
      case "ROLE_PG_OWNER":
        return {
          label: "PG Owner",
          description: "Full property, room allocation, billing, and notice broadcast access",
          badgeColor: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80",
          icon: Shield,
          features: [
            {
              title: "Operations Overview",
              icon: LayoutDashboard,
              desc: "Live occupancy, pending revenue, and ticket triage KPI metrics for day-to-day operations.",
              href: "/dashboard/overview",
            },
            {
              title: "Manage Properties",
              icon: Home,
              desc: "Add or edit PG branches, configure rooms, define bed configurations, and adjust floor plans.",
              href: "/dashboard/properties",
            },
            {
              title: "Tenant Directory",
              icon: Users,
              desc: "Review occupancy status, stay history, verified documents, and KYC records of tenants.",
              href: "/dashboard/tenants",
            },
            {
              title: "Billing & Invoices",
              icon: FileText,
              desc: "Track recurring rent cycles, deposit balances, penalty calculations, and GST receipts.",
              href: "/dashboard/finance",
            },
            {
              title: "Maintenance Tickets",
              icon: Wrench,
              desc: "Review and resolve tenant maintenance requests, assign vendors, and track repair SLA times.",
              href: "/dashboard/admin-complaints",
            },
            {
              title: "Notice Board",
              icon: Megaphone,
              desc: "Broadcast building announcements, policy guidelines, gate timings, and alerts to residents.",
              href: "/dashboard/announcements",
            },
          ],
        };
      case "ROLE_STAFF":
        return {
          label: "Staff / Support",
          description: "Facility maintenance, cleaning schedules, and service operations",
          badgeColor: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80",
          icon: Wrench,
          features: [
            {
              title: "Maintenance Requests",
              icon: Wrench,
              desc: "Review and resolve active tenant maintenance tickets.",
              href: "/dashboard/admin-complaints",
            },
            {
              title: "Housekeeping",
              icon: Clock,
              desc: "Check daily cleaning schedules and supply replenishment checklists.",
            },
            {
              title: "Access Control",
              icon: KeyRound,
              desc: "Manage visitor records, parking approvals, and facility entries.",
            },
          ],
        };
      case "ROLE_TENANT":
      default:
        return {
          label: "Resident",
          description: "Room booking, rent dues, and maintenance ticket portal",
          badgeColor: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80",
          icon: UserCheck,
          features: [
            {
              title: "My Room & Bed",
              icon: Home,
              desc: "View your active bed allocation, amenities, and room mates.",
              href: "/dashboard/my-room",
            },
            {
              title: "Rent & Payments",
              icon: FileText,
              desc: "Check upcoming rent dues, payment history, and download receipts.",
              href: "/dashboard/my-dues",
            },
            {
              title: "Raise a Complaint",
              icon: Wrench,
              desc: "Submit requests for room maintenance, Wi-Fi, or plumbing fixes.",
              href: "/dashboard/my-complaints",
            },
          ],
        };
    }
  };

  // Only display real notices fetched from the database
  const displayedNotices = Array.isArray(notices) ? notices.slice(0, 4) : [];

  // Prevent flash while checking auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const roleConfig = getRoleConfig(userRole);
  const RoleIcon = roleConfig.icon;
  const isOwner = userRole === "ROLE_PG_OWNER";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* BEGIN: WelcomeBanner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden transition-colors">
        {/* Subtle Accent Background Blur */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-0">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${roleConfig.badgeColor}`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                {roleConfig.label.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE SESSION
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {userName}!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-normal">
              {roleConfig.description}. Monitor high-level PG metrics and manage live occupancies with ease.
            </p>
          </div>

          {/* Role Badge Pill */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-xl p-4 shrink-0 shadow-inner">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <RoleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Authenticated Role
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide font-mono">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* END: WelcomeBanner */}

      {/* BEGIN: MetricsBar (KPI Metrics Grid) */}
      {isOwner && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Occupancy */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Occupancy
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            {loadingSummary ? (
              <div className="py-3 flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Loading occupancy...</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {summary?.occupancyRate !== undefined ? `${summary.occupancyRate}%` : "0%"}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {summary?.occupiedBeds ?? 0} / {summary?.totalBeds ?? 0} Beds
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.max(summary?.occupancyRate || 0, 0), 100)}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Card 2: Revenue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Month Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            {loadingSummary ? (
              <div className="py-3 flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>Loading revenue...</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    ₹{Number(summary?.currentMonthRevenue || 0).toLocaleString("en-IN")}
                  </span>
                  {summary?.revenueGrowthRate !== undefined && summary?.revenueGrowthRate !== null && (
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        summary.revenueGrowthRate >= 0
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
                          : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60"
                      }`}
                    >
                      <TrendingUp
                        className={`w-3 h-3 ${summary.revenueGrowthRate < 0 ? "rotate-180" : ""}`}
                      />
                      {summary.revenueGrowthRate >= 0
                        ? `+${summary.revenueGrowthRate}%`
                        : `${summary.revenueGrowthRate}%`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  vs. ₹{Number(summary?.lastMonthRevenue || 0).toLocaleString("en-IN")} last month
                </p>
              </>
            )}
          </div>

          {/* Card 3: Pending Dues */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Dues
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            {loadingSummary ? (
              <div className="py-3 flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Loading dues...</span>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    ₹{Number(summary?.totalPendingRent || 0).toLocaleString("en-IN")}
                  </span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {summary?.unpaidInvoicesCount || 0} unpaid invoice
                    {summary?.unpaidInvoicesCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  href="/dashboard/finance"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                >
                  Collect
                </Link>
              </div>
            )}
          </div>

          {/* Card 4: Maintenance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Maintenance
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            {loadingSummary ? (
              <div className="py-3 flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
                <span>Loading maintenance...</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {summary?.openComplaintsCount || 0} Open
                  </span>
                  {summary?.inProgressComplaintsCount > 0 ? (
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 px-1.5 py-0.5 rounded">
                      {summary.inProgressComplaintsCount} In Progress
                    </span>
                  ) : summary?.openComplaintsCount === 0 ? (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-1.5 py-0.5 rounded">
                      All Clear
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {summary?.resolvedComplaintsCount ?? 0} resolved ticket
                  {summary?.resolvedComplaintsCount === 1 ? "" : "s"}
                </p>
              </>
            )}
          </div>
        </section>
      )}
      {/* END: MetricsBar */}

      {/* BEGIN: AnnouncementsWidget */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Announcements</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest building updates and notices broadcasted to residents
              </p>
            </div>
          </div>

          {isOwner && (
            <Link
              href="/dashboard/announcements"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
            >
              Manage Board
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          )}
        </div>

        {/* Notice Cards Grid */}
        {loadingNotices ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500">Loading notices...</p>
          </div>
        ) : displayedNotices.length === 0 ? (
          <div className="py-8 px-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-850/40">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-xs">
              <Megaphone className="w-5 h-5 opacity-70" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No Announcements Yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {isOwner
                ? "Broadcast important updates, maintenance schedules, or community notices to your residents."
                : "Your property manager has not broadcasted any active announcements at this time."}
            </p>
            {isOwner && (
              <Link
                href="/dashboard/announcements"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Post First Announcement
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedNotices.map((n) => (
              <div
                key={n.id}
                className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recently"}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    {n.propertyName || (n.createdBy ? `by ${n.createdBy}` : "Notice Board")}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{n.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* END: AnnouncementsWidget */}

      {/* BEGIN: QuickActionsGrid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">✨</span> Quick Actions &amp; Modules
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Select any workspace module below</span>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roleConfig.features.map((feature, idx) => {
            const FeatureIcon = feature.icon;
            const CardContent = (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/80 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group h-full">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                    <FeatureIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{feature.desc}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded">
                    Active Module
                  </span>
                  <span className="font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1">
                    Explore <span className="group-hover:translate-x-1 transition-transform">→</span>
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
      {/* END: QuickActionsGrid */}
    </div>
  );
}

