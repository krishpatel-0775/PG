"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Bell,
  CheckCheck,
  Trash2,
  Download,
  Search,
  Filter,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ExternalLink,
  CreditCard,
  Share2,
  Calendar,
  X,
  ChevronRight,
  ShieldCheck,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

const PAYMENT_TYPES = [
  "PAYMENT_RECEIPT",
  "INVOICE_GENERATED",
  "RENT_DUE_REMINDER",
  "RENT_OVERDUE",
];

const normalizeNotification = (n) => ({
  ...n,
  isRead: Boolean(n.isRead !== undefined ? n.isRead : n.read),
});

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // ALL, UNREAD, PAYMENTS, NOTICES
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, WEEK, MONTH
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/notifications");
        if (!isMounted) return;
        setNotifications((res.data || []).map(normalizeNotification));
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Parse financial amount from text
  const extractAmount = (text) => {
    if (!text) return null;
    const match = text.match(/(?:₹|Rs\.?\s*)\s*([\d,]+(?:\.\d{2})?)/i);
    return match ? `₹${match[1]}` : null;
  };

  // Helper for time grouping
  const getTimeGroup = (dateStr) => {
    if (!dateStr) return "Older";
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (date >= startOfToday) return "Today";
    if (date >= startOfYesterday) return "Yesterday";
    if (date >= startOfWeek) return "Earlier this Week";
    return "Older";
  };

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Category tab filter
      if (categoryFilter === "UNREAD" && n.isRead) return false;
      if (categoryFilter === "PAYMENTS" && !PAYMENT_TYPES.includes(n.type)) return false;
      if (categoryFilter === "NOTICES" && PAYMENT_TYPES.includes(n.type)) return false;

      // Date filter
      if (dateFilter !== "ALL") {
        const group = getTimeGroup(n.createdAt);
        if (dateFilter === "TODAY" && group !== "Today") return false;
        if (dateFilter === "WEEK" && !["Today", "Yesterday", "Earlier this Week"].includes(group)) {
          return false;
        }
        if (dateFilter === "MONTH") {
          const date = new Date(n.createdAt);
          const now = new Date();
          if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      // Keyword search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (n.title || "").toLowerCase().includes(query);
        const msgMatch = (n.message || "").toLowerCase().includes(query);
        const typeMatch = (n.type || "").toLowerCase().includes(query);
        if (!titleMatch && !msgMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [notifications, categoryFilter, dateFilter, searchQuery]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Single Item Mark as Read
  const handleMarkSingleRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Card Click: Mark as read and navigate
  const handleCardClick = (notif) => {
    if (!notif.isRead) {
      handleMarkSingleRead(notif.id);
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  // Single Item Delete
  const handleDeleteSingle = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // One-Click WhatsApp Share
  const handleShareWhatsApp = (notif, e) => {
    e?.stopPropagation();
    const text = `*PGManager Payment Alert*\n\n📌 *${notif.title}*\n${notif.message}\n\nGenerated automatically via PGManager.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredNotifications.length === 0) return;

    const headers = ["ID", "Type", "Title", "Message", "Is Read", "Date"];
    const rows = filteredNotifications.map((n) => [
      n.id,
      n.type,
      `"${(n.title || "").replace(/"/g, '""')}"`,
      `"${(n.message || "").replace(/"/g, '""')}"`,
      n.isRead ? "Read" : "Unread",
      n.createdAt ? new Date(n.createdAt).toISOString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `notifications_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group notifications by time section
  const groupedNotifications = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      "Earlier this Week": [],
      Older: [],
    };

    filteredNotifications.forEach((n) => {
      const group = getTimeGroup(n.createdAt);
      if (groups[group]) {
        groups[group].push(n);
      } else {
        groups.Older.push(n);
      }
    });

    return Object.entries(groups).filter(([_, list]) => list.length > 0);
  }, [filteredNotifications]);

  // Icon renderer
  const renderIcon = (type) => {
    switch (type) {
      case "INVOICE_GENERATED":
        return (
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
        );
      case "PAYMENT_RECEIPT":
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case "RENT_DUE_REMINDER":
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        );
      case "RENT_OVERDUE":
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
            <AlertCircle className="w-5 h-5" />
          </div>
        );
      case "WELCOME":
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/80 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
        );
    }
  };

  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const paymentsCount = notifications.filter((n) =>
    ["PAYMENT_RECEIPT", "INVOICE_GENERATED", "RENT_DUE_REMINDER", "RENT_OVERDUE"].includes(n.type)
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Notification Center
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {unreadCount} unread
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized audit history of automated rent invoices, payment receipts, and stay alerts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredNotifications.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Notifications
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unread Alerts
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {unreadCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment & Invoices
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {paymentsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tenant, invoice, room or keyword..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today Only</option>
              <option value="WEEK">Past 7 Days</option>
              <option value="MONTH">This Month</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: "ALL", label: `All (${notifications.length})` },
            { id: "UNREAD", label: `Unread (${unreadCount})` },
            { id: "PAYMENTS", label: `Payments (${paymentsCount})` },
            { id: "NOTICES", label: "Other Alerts" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Grouped List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Feed Header */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Activity Stream
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              • {filteredNotifications.length} {filteredNotifications.length === 1 ? "alert" : "alerts"}
            </span>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Loading notifications...
            </div>
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Bell className="w-7 h-7 opacity-40" />
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              No notifications found
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No alerts match your current filter criteria. Try resetting your search or filter tags.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {groupedNotifications.map(([groupName, groupItems]) => (
              <div key={groupName}>
                {/* Time Group Section Header */}
                <div className="px-5 py-2 bg-slate-50/50 dark:bg-slate-850/40 border-y border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {groupName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {groupItems.length} alert{groupItems.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Items in this group */}
                <div className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                  {groupItems.map((n) => {
                    const amount = extractAmount(n.title + " " + n.message);

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleCardClick(n)}
                        className={`p-4 sm:p-5 flex items-start gap-4 transition-all group relative cursor-pointer ${
                          n.isRead
                            ? "bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                            : "bg-indigo-50/20 dark:bg-indigo-950/20 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30"
                        }`}
                      >
                        {/* Icon */}
                        <div className="shrink-0 pt-0.5">
                          {renderIcon(n.type)}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0 pr-8 sm:pr-12">
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`text-sm font-bold ${
                                  n.isRead
                                    ? "text-slate-800 dark:text-slate-200"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {n.title}
                              </h3>

                              {!n.isRead && (
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 ring-4 ring-indigo-50 dark:ring-indigo-950" title="Unread" />
                              )}
                            </div>

                            {/* Prominent Amount Badge */}
                            {amount && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 shadow-2xs ${
                                  n.type === "PAYMENT_RECEIPT"
                                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                    : "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                                }`}
                              >
                                {n.type === "PAYMENT_RECEIPT" ? `+ ${amount}` : `Due: ${amount}`}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                            {n.message}
                          </p>

                          {/* Action Zone: Deep Links & Quick Actions */}
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(n.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              • {new Date(n.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>

                            {/* One-Click Action: Pay Now (for unpaid invoices) */}
                            {(n.type === "INVOICE_GENERATED" || n.type === "RENT_DUE_REMINDER") && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(n.actionUrl || "/dashboard/my-dues");
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Now</span>
                              </button>
                            )}

                            {/* One-Click Action: Share Receipt on WhatsApp (for payments) */}
                            {n.type === "PAYMENT_RECEIPT" && (
                              <button
                                type="button"
                                onClick={(e) => handleShareWhatsApp(n, e)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share Receipt</span>
                              </button>
                            )}

                            {/* Standard View Details */}
                            {n.actionUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(n.actionUrl);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                              >
                                <span>View Details</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Hover Quick Action: Dismiss */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white/95 dark:bg-slate-900/95 rounded-lg p-1 shadow-2xs border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSingle(n.id, e)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
