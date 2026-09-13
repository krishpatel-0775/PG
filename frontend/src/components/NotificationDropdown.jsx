"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import ToastContainer from "./ToastContainer";
import {
  Bell,
  CheckCircle2,
  Receipt,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCheck,
  Trash2,
  ExternalLink,
  Loader2,
  Search,
  X,
  CreditCard,
  Share2,
  ChevronRight,
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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, UNREAD, PAYMENTS
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const dropdownRef = useRef(null);
  const autoReadTimerRef = useRef(null);
  const unreadBatchRef = useRef([]);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications");
      const list = (response.data || []).map(normalizeNotification);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.debug("Could not fetch notifications:", err?.message);
    }
  }, []);

  // Fetch initial notifications and establish Real-time Server-Sent Events (SSE) stream
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const response = await api.get("/notifications");
        if (!isMounted) return;
        const list = (response.data || []).map(normalizeNotification);
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch (err) {
        console.debug("Could not fetch notifications:", err?.message);
      }
    };

    loadInitialData();

    // 1. Establish SSE Connection
    const token =
      Cookies.get("token") ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    let eventSource = null;

    if (token) {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const sseUrl = `${baseUrl}/notifications/stream?token=${encodeURIComponent(
        token
      )}`;

      try {
        eventSource = new EventSource(sseUrl);

        eventSource.addEventListener("INIT", () => {
          console.debug("SSE notification channel connected successfully.");
        });

        eventSource.addEventListener("notification", (event) => {
          try {
            const raw = JSON.parse(event.data);
            const newNotif = normalizeNotification(raw);
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            setUnreadCount((prev) => prev + 1);

            // Trigger floating Toast alert banner
            setToasts((prev) => [
              { ...newNotif, toastId: Date.now() + Math.random() },
              ...prev,
            ]);
          } catch (err) {
            console.debug("Error parsing SSE event payload:", err);
          }
        });

        eventSource.onerror = (err) => {
          console.debug(
            "SSE stream temporarily interrupted, browser will auto-reconnect.",
            err
          );
        };
      } catch (err) {
        console.debug("Unable to initialize SSE:", err);
      }
    }

    // 2. Light fallback polling (every 60s) in case network completely dropped
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Smart Auto-Mark as Read when dropdown is open (2-second viewing grace period)
  useEffect(() => {
    if (!isOpen) {
      if (autoReadTimerRef.current) {
        clearTimeout(autoReadTimerRef.current);
        autoReadTimerRef.current = null;
      }
      return;
    }

    autoReadTimerRef.current = setTimeout(() => {
      setNotifications((current) => {
        const unreadIds = current.filter((n) => !n.isRead).map((n) => n.id);
        if (unreadIds.length > 0) {
          api.patch("/notifications/bulk-read", unreadIds).catch((err) => {
            console.debug("Auto bulk-read error:", err?.message);
          });
          return current.map((n) =>
            unreadIds.includes(n.id) ? { ...n, isRead: true } : n
          );
        }
        return current;
      });
      setUnreadCount(0);
    }, 2000);

    return () => {
      if (autoReadTimerRef.current) {
        clearTimeout(autoReadTimerRef.current);
      }
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      // Clear bell badge immediately when user opens the dropdown
      setUnreadCount(0);
      api
        .get("/notifications")
        .then((response) => {
          const list = (response.data || []).map(normalizeNotification);
          setNotifications(list);
          // Keep bell badge cleared to 0 while actively viewing dropdown
          setUnreadCount(0);
        })
        .catch((err) =>
          console.debug("Could not fetch notifications:", err?.message)
        );
    } else {
      // If closing, clear the auto-read timer and immediately persist any remaining unread as read
      if (autoReadTimerRef.current) {
        clearTimeout(autoReadTimerRef.current);
        autoReadTimerRef.current = null;
      }
      setNotifications((current) => {
        const unreadIds = current.filter((n) => !n.isRead).map((n) => n.id);
        if (unreadIds.length > 0) {
          api.patch("/notifications/bulk-read", unreadIds).catch((err) => {
            console.debug("Auto bulk-read on close error:", err?.message);
          });
          return current.map((n) => ({ ...n, isRead: true }));
        }
        return current;
      });
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = useCallback(async (id, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      setDeletingId(id);
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const handleDismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => (t.toastId || t.id) !== toastId));
  }, []);

  const handleToastAction = useCallback(
    (toast) => {
      handleDismissToast(toast.toastId || toast.id);
      if (!toast.isRead) {
        handleMarkAsRead(toast.id);
      }
      if (toast.actionUrl) {
        router.push(toast.actionUrl);
      }
    },
    [handleDismissToast, handleMarkAsRead, router]
  );

  // Extract monetary amounts
  const extractAmount = (text) => {
    if (!text) return null;
    const match = text.match(/(?:₹|Rs\.?\s*)\s*([\d,]+(?:\.\d{2})?)/i);
    return match ? `₹${match[1]}` : null;
  };

  // WhatsApp Share receipt
  const handleShareWhatsApp = (notif, e) => {
    e?.stopPropagation();
    const text = `*PGManager Payment Receipt*\n\n📌 *${notif.title}*\n${notif.message}\n\nGenerated via PGManager.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case "INVOICE_GENERATED":
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
        );
      case "PAYMENT_RECEIPT":
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case "RENT_DUE_REMINDER":
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case "RENT_OVERDUE":
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case "WELCOME":
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  const renderCategoryChip = (type) => {
    switch (type) {
      case "PAYMENT_RECEIPT":
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Payment
          </span>
        );
      case "INVOICE_GENERATED":
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Invoice
          </span>
        );
      case "RENT_DUE_REMINDER":
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Reminder
          </span>
        );
      case "RENT_OVERDUE":
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Overdue
          </span>
        );
      case "WELCOME":
      default:
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Stay Info
          </span>
        );
    }
  };

  // Filter list by category tab & search query
  const unreadList = notifications.filter((n) => !n.isRead);
  const paymentsList = notifications.filter((n) => PAYMENT_TYPES.includes(n.type));

  const displayedNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "UNREAD" && n.isRead) return false;
      if (activeTab === "PAYMENTS" && !PAYMENT_TYPES.includes(n.type)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (n.title || "").toLowerCase().includes(q);
        const matchMsg = (n.message || "").toLowerCase().includes(q);
        const matchType = (n.type || "").toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchType) return false;
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Group by time
  const groupedNotifications = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      "Earlier this Week": [],
      Older: [],
    };

    displayedNotifications.forEach((n) => {
      const g = getTimeGroup(n.createdAt);
      if (groups[g]) {
        groups[g].push(n);
      } else {
        groups.Older.push(n);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [displayedNotifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs animate-in zoom-in duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-88 sm:w-105 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Notifications
                </span>
                {unreadList.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-800">
                    {unreadList.length} new
                  </span>
                )}
              </div>

              {unreadList.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("UNREAD")}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  activeTab === "UNREAD"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Unread ({unreadList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("PAYMENTS")}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  activeTab === "PAYMENTS"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Payments ({paymentsList.length})
              </button>
            </div>

            {/* Micro-Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick search by room, tenant, amount..."
                className="w-full pl-8 pr-7 py-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications Grouped by Time */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {groupedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No notifications found
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {searchQuery
                    ? `No alerts matching "${searchQuery}".`
                    : activeTab === "UNREAD"
                    ? "You've read all your recent notifications."
                    : activeTab === "PAYMENTS"
                    ? "No payment or invoice notifications yet."
                    : "You have no pending alerts or announcements."}
                </div>
              </div>
            ) : (
              groupedNotifications.map(([groupName, groupItems]) => (
                <div key={groupName}>
                  {/* Time Section Subheader */}
                  <div className="px-4 py-1.5 bg-slate-50/70 dark:bg-slate-850/60 border-y border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {groupName}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {groupItems.length}
                    </span>
                  </div>

                  {/* Items in Time Section */}
                  <div className="divide-y divide-slate-100/80 dark:divide-slate-800/70">
                    {groupItems.map((n) => {
                      const amount = extractAmount(n.title + " " + n.message);

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleItemClick(n)}
                          className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                            n.isRead
                              ? "hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900"
                              : "bg-indigo-50/30 dark:bg-indigo-950/30 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/50"
                          }`}
                        >
                          {renderIcon(n.type)}

                          <div className="flex-1 min-w-0 pr-10">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {renderCategoryChip(n.type)}
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {formatRelativeTime(n.createdAt)}
                              </span>

                              {/* Prominent Amount Highlight Badge */}
                              {amount && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                    n.type === "PAYMENT_RECEIPT"
                                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                      : "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                                  }`}
                                >
                                  {n.type === "PAYMENT_RECEIPT"
                                    ? `+ ${amount}`
                                    : `Due: ${amount}`}
                                </span>
                              )}
                            </div>

                            <div
                              className={`text-xs font-bold leading-tight mb-1 truncate ${
                                n.isRead
                                  ? "text-slate-800 dark:text-slate-200"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {n.title}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>

                            {/* One-Click Action Zone */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {/* 1-Click Pay Now */}
                              {(n.type === "INVOICE_GENERATED" ||
                                n.type === "RENT_DUE_REMINDER") && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    router.push(n.actionUrl || "/dashboard/my-dues");
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay Now</span>
                                </button>
                              )}

                              {/* 1-Click WhatsApp Share */}
                              {n.type === "PAYMENT_RECEIPT" && (
                                <button
                                  type="button"
                                  onClick={(e) => handleShareWhatsApp(n, e)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Share Receipt</span>
                                </button>
                              )}

                              {n.actionUrl && (
                                <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 opacity-90 group-hover:opacity-100">
                                  <span>View Details</span>
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right side: Hover Action Buttons & Unread Indicator */}
                          <div className="absolute right-3 top-3 flex items-center gap-1">
                            {/* Hover dismiss button */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white/90 dark:bg-slate-900/90 rounded-lg p-0.5 shadow-xs border border-slate-200 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={(e) => handleDelete(n.id, e)}
                                disabled={deletingId === n.id}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Delete notification"
                              >
                                {deletingId === n.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 ring-4 ring-indigo-50 dark:ring-indigo-950" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Upgraded Footer: Direct Access to Full-Page Notification Center */}
          <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live SSE Active
            </span>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/notifications");
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition cursor-pointer"
            >
              <span>View All History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Alert Stack */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onAction={handleToastAction}
      />
    </div>
  );
}
