"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Receipt,
  IndianRupee,
  Calendar,
  Clock,
  Building2,
  Bed,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ArrowLeft,
  Phone,
  Sparkles,
  Play,
  Filter,
  FileText,
  Printer,
  X,
  History,
  ShieldCheck,
  Zap,
  Home,
  LayoutList,
  MessageSquare,
} from "lucide-react";
import RecordPaymentModal from "@/components/RecordPaymentModal";

export default function RentManagementPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL"); // "ALL" | "RENT" | "UTILITY"
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" | "PENDING" | "PAID"
  const [viewMode, setViewMode] = useState("TABLE"); // "TABLE" | "ROOM"
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Digital Receipt Modal State
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchAllInvoices = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      let response;
      try {
        response = await api.get("/finance/invoices?status=ALL");
      } catch (e) {
        console.warn("Falling back to pending invoices endpoint", e);
        response = await api.get("/finance/invoices/pending");
      }
      setInvoices(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load rent invoices.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        let response;
        try {
          response = await api.get("/finance/invoices?status=ALL");
        } catch (e) {
          console.warn("Falling back to pending invoices endpoint", e);
          response = await api.get("/finance/invoices/pending");
        }
        if (!isMounted) return;
        setInvoices(response.data || []);
      } catch (err) {
        if (!isMounted) return;
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to load rent invoices.";
        setErrorMessage(backendMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleOpenReceipt = (invoice) => {
    setReceiptInvoice(invoice);
    setIsReceiptOpen(true);
  };

  const handlePaymentSuccess = () => {
    setSuccessMessage("Payment successfully recorded! Table updated.");
    fetchAllInvoices();
  };

  const handleTriggerBilling = async () => {
    setTriggering(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await api.post("/finance/invoices/trigger");
      const count = response.data?.length || 0;
      setSuccessMessage(
        count > 0
          ? `Anniversary billing executed: Generated ${count} new invoice(s) for today!`
          : "Anniversary billing check completed: No new invoices due for generation today."
      );
      await fetchAllInvoices();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to trigger anniversary billing cron job.";
      setErrorMessage(backendMessage);
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Filtered invoices based on search, tab, status, and type filter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.tenantName?.toLowerCase().includes(q) ||
        inv.tenantPhone?.toLowerCase().includes(q) ||
        inv.tenantEmail?.toLowerCase().includes(q) ||
        inv.propertyName?.toLowerCase().includes(q) ||
        inv.roomNumber?.toLowerCase().includes(q) ||
        inv.bedNumber?.toLowerCase().includes(q) ||
        inv.invoiceMonth?.toLowerCase().includes(q) ||
        `#inv-${inv.id}`.toLowerCase().includes(q) ||
        `inv-${inv.id}`.toLowerCase().includes(q) ||
        String(inv.id).includes(q) ||
        (inv.invoiceType || "").toLowerCase().includes(q);

      let matchesTab = true;
      if (activeTab === "PENDING") {
        matchesTab = inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID";
      } else if (activeTab === "PAID") {
        matchesTab = inv.status === "PAID";
      }

      const matchesStatus =
        statusFilter === "ALL" || inv.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "RENT" && (!inv.invoiceType || inv.invoiceType === "RENT")) ||
        (typeFilter === "UTILITY" && inv.invoiceType === "UTILITY");

      return matchesSearch && matchesTab && matchesStatus && matchesType;
    });
  }, [invoices, searchQuery, activeTab, statusFilter, typeFilter]);

  // Aggregate KPI Metrics
  const totalOutstanding = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + (Number(inv.dueAmount) || 0),
      0
    );
  }, [invoices]);

  const totalCollected = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + (Number(inv.amountPaid) || 0),
      0
    );
  }, [invoices]);

  const totalInvoiced = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + (Number(inv.totalAmount) || 0),
      0
    );
  }, [invoices]);

  const paidCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === "PAID").length;
  }, [invoices]);

  const pendingCount = useMemo(() => {
    return invoices.filter(
      (inv) => inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID"
    ).length;
  }, [invoices]);

  const handleSendWhatsAppReminder = (inv) => {
    const phone = (inv.tenantPhone || "").replace(/[^0-9]/g, "");
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const dueAmt = formatCurrency(inv.dueAmount || inv.totalAmount);
    const billType =
      inv.invoiceType === "UTILITY" ? "Electricity / Utility bill" : "Monthly Room Rent";
    const text = encodeURIComponent(
      `Hello ${inv.tenantName || "Resident"}, this is a reminder regarding your pending ${billType} of ₹${dueAmt} for Room ${inv.roomNumber || ""} (Bed ${inv.bedNumber || ""}) at ${inv.propertyName || "our PG"}. Please clear the dues at your earliest convenience. Thank you!`
    );
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  // Group invoices into room-level records
  const roomWiseData = useMemo(() => {
    const groups = {};

    invoices.forEach((inv) => {
      // Filter by type filter if selected (RENT or UTILITY)
      if (typeFilter === "RENT" && inv.invoiceType && inv.invoiceType !== "RENT") return;
      if (typeFilter === "UTILITY" && inv.invoiceType !== "UTILITY") return;

      const prop = inv.propertyName || "Unassigned Property";
      const room = inv.roomNumber || "Unassigned Room";
      const key = `${prop}____${room}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          propertyName: prop,
          roomNumber: room,
          invoices: [],
          totalBilled: 0,
          totalCollected: 0,
          totalPending: 0,
        };
      }

      groups[key].invoices.push(inv);
      groups[key].totalBilled += Number(inv.totalAmount) || 0;
      groups[key].totalCollected += Number(inv.amountPaid) || 0;
      groups[key].totalPending += Number(inv.dueAmount) || 0;
    });

    const roomList = Object.values(groups).map((group) => {
      const hasPending =
        group.totalPending > 0 ||
        group.invoices.some(
          (i) => i.status === "UNPAID" || i.status === "PARTIALLY_PAID"
        );
      return {
        ...group,
        hasPending,
        allPaid: !hasPending && group.invoices.length > 0,
      };
    });

    // Filter roomList based on activeTab, statusFilter, and searchQuery
    return roomList.filter((room) => {
      // Tab filter
      if (activeTab === "PENDING" && !room.hasPending) return false;
      if (activeTab === "PAID" && room.hasPending) return false;

      // Status filter
      if (statusFilter === "PAID" && room.hasPending) return false;
      if (statusFilter === "UNPAID" && room.allPaid) return false;
      if (
        statusFilter === "PARTIALLY_PAID" &&
        !room.invoices.some((i) => i.status === "PARTIALLY_PAID")
      )
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRoom =
          room.roomNumber.toLowerCase().includes(q) ||
          room.propertyName.toLowerCase().includes(q) ||
          `room ${room.roomNumber}`.toLowerCase().includes(q);
        const matchesOccupant = room.invoices.some(
          (i) =>
            i.tenantName?.toLowerCase().includes(q) ||
            i.tenantPhone?.toLowerCase().includes(q) ||
            i.bedNumber?.toLowerCase().includes(q) ||
            `#inv-${i.id}`.toLowerCase().includes(q) ||
            String(i.id).includes(q)
        );
        if (!matchesRoom && !matchesOccupant) return false;
      }

      return true;
    });
  }, [invoices, typeFilter, activeTab, statusFilter, searchQuery]);

  const totalRoomsCount = useMemo(() => {
    const roomSet = new Set();
    invoices.forEach((inv) => {
      if (inv.roomNumber) {
        roomSet.add(`${inv.propertyName || ""}____${inv.roomNumber}`);
      }
    });
    return roomSet.size;
  }, [invoices]);

  const pendingRoomsCount = useMemo(() => {
    const pendingSet = new Set();
    invoices.forEach((inv) => {
      if (
        inv.roomNumber &&
        (inv.status === "UNPAID" ||
          inv.status === "PARTIALLY_PAID" ||
          (Number(inv.dueAmount) || 0) > 0)
      ) {
        pendingSet.add(`${inv.propertyName || ""}____${inv.roomNumber}`);
      }
    });
    return pendingSet.size;
  }, [invoices]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Rent & Invoices</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Rent Invoices & Collections
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Track live collections, review past paid invoices, generate anniversary cycles, and record tenant dues.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchAllInvoices}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleTriggerBilling}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${triggering ? "animate-spin" : ""}`} />
            {triggering ? "Running Billing Job..." : "Trigger Billing Check"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <span className="font-bold">Error:</span> {errorMessage}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
          <div className="flex-1">
            <span className="font-bold">Success:</span> {successMessage}
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Collected Revenue */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Collected Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              ₹{formatCurrency(totalCollected)}
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {paidCount} fully settled {paidCount === 1 ? "invoice" : "invoices"}
          </p>
        </div>

        {/* Card 2: Total Outstanding Dues */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Outstanding Dues
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{formatCurrency(totalOutstanding)}
            </span>
          </div>
          <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
            Across {pendingCount} pending billing {pendingCount === 1 ? "cycle" : "cycles"}
          </p>
        </div>

        {/* Card 3: Total Billed Amount */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoiced Rent
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{formatCurrency(totalInvoiced)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Across {invoices.length} total generated stay invoices
          </p>
        </div>
      </div>

      {/* Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        {/* Tabs: All vs Pending vs Paid */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{viewMode === "ROOM" ? "All Rooms" : "All Invoices"}</span>
            <span
              className={`text-xs px-2 py-0.2 rounded-full font-bold ${
                activeTab === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {viewMode === "ROOM" ? totalRoomsCount : invoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "PENDING"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Dues</span>
            {(viewMode === "ROOM" ? pendingRoomsCount : pendingCount) > 0 && (
              <span
                className={`text-xs px-2 py-0.2 rounded-full font-bold ${
                  activeTab === "PENDING"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {viewMode === "ROOM" ? pendingRoomsCount : pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "PAID"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Paid & Settled</span>
            {(viewMode === "ROOM" ? Math.max(0, totalRoomsCount - pendingRoomsCount) : paidCount) > 0 && (
              <span
                className={`text-xs px-2 py-0.2 rounded-full font-bold ${
                  activeTab === "PAID"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {viewMode === "ROOM" ? Math.max(0, totalRoomsCount - pendingRoomsCount) : paidCount}
              </span>
            )}
          </button>
        </div>

        {/* View Mode Toggle: Table vs Room Matrix */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex-shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("TABLE")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "TABLE"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Invoice Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("ROOM")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "ROOM"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Room-Wise Matrix</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              viewMode === "ROOM"
                ? "Search by room number, property, or tenant name..."
                : "Search by tenant name, phone, room, or invoice #..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
          >
            <option value="ALL">All Invoice Types</option>
            <option value="RENT">🏠 Room Rent Only</option>
            <option value="UTILITY">⚡ Electricity / Utility Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
            <option value="UNPAID">UNPAID</option>
          </select>
        </div>
      </div>

      {/* Content: Room-Wise Matrix vs Invoices Table */}
      {viewMode === "ROOM" ? (
        loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
            <p className="text-xs font-medium">Loading room rent matrix...</p>
          </div>
        ) : roomWiseData.length === 0 ? (
          <div className="py-20 px-4 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Rooms Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No rooms or residents matching "${searchQuery}".`
                : activeTab === "PENDING"
                ? "All rooms are fully settled with zero pending rent dues."
                : "No room billing records found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {roomWiseData.map((room) => {
              const percentCollected =
                room.totalBilled > 0
                  ? Math.min(
                      100,
                      Math.round((room.totalCollected / room.totalBilled) * 100)
                    )
                  : 100;

              return (
                <div
                  key={room.key}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                    room.hasPending
                      ? "border-amber-200/90 hover:border-amber-300"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  {/* Room Header */}
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          room.hasPending
                            ? "bg-amber-50 border border-amber-200 text-amber-700"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            Room {room.roomNumber}
                          </h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600 border border-slate-200/60">
                            {room.invoices.length}{" "}
                            {room.invoices.length === 1 ? "bill" : "bills"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {room.propertyName}
                        </p>
                      </div>
                    </div>

                    {/* Room Health Badge */}
                    {room.hasPending ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>₹{formatCurrency(room.totalPending)} Pending</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>All Paid (100%)</span>
                      </span>
                    )}
                  </div>

                  {/* Room Financial Progress Strip */}
                  <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <span className="text-slate-400 font-medium">Billed: </span>
                        <span className="font-bold text-slate-800">
                          ₹{formatCurrency(room.totalBilled)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Collected: </span>
                        <span className="font-bold text-emerald-600">
                          ₹{formatCurrency(room.totalCollected)}
                        </span>
                      </div>
                      {room.totalPending > 0 && (
                        <div>
                          <span className="text-slate-400 font-medium">Due: </span>
                          <span className="font-bold text-rose-600">
                            ₹{formatCurrency(room.totalPending)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden flex-shrink-0 hidden sm:block">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          room.hasPending ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${percentCollected}%` }}
                      />
                    </div>
                  </div>

                  {/* Invoices / Occupants inside Room */}
                  <div className="divide-y divide-slate-100">
                    {room.invoices.map((inv) => {
                      const isPaid = inv.status === "PAID";
                      const isUtility = inv.invoiceType === "UTILITY";

                      return (
                        <div
                          key={inv.id}
                          className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          {/* Left: Bed, Tenant, Type & ID */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 flex-shrink-0 mt-0.5">
                              <Bed className="w-3 h-3" />
                              <span>Bed {inv.bedNumber || "-"}</span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm truncate">
                                  {inv.tenantName || "Unknown Tenant"}
                                </span>
                                {inv.tenantPhone && (
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    ({inv.tenantPhone})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="font-mono font-semibold text-slate-600">
                                  #INV-{String(inv.id).padStart(4, "0")}
                                </span>
                                <span>•</span>
                                <span
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    isUtility ? "text-amber-700" : "text-indigo-700"
                                  }`}
                                >
                                  {isUtility ? (
                                    <Zap className="w-3 h-3 text-amber-500" />
                                  ) : (
                                    <Home className="w-3 h-3 text-indigo-500" />
                                  )}
                                  {isUtility ? "Electricity / Utility" : "Room Rent"}
                                </span>
                                <span>•</span>
                                <span>
                                  {inv.invoiceMonth || formatDate(inv.invoiceDate)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount, Status & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-left sm:text-right">
                              <div className="font-extrabold text-sm text-slate-900">
                                ₹{formatCurrency(inv.totalAmount)}
                              </div>
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                  <CheckCircle2 className="w-3 h-3" /> Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                  <Clock className="w-3 h-3" /> Due: ₹
                                  {formatCurrency(
                                    inv.dueAmount || inv.totalAmount
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              {isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer text-xs"
                                  title="View Digital Receipt"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Receipt</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(inv)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer text-xs"
                                    title="Record Payment"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Collect</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSendWhatsAppReminder(inv)
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer text-xs"
                                    title="Send WhatsApp Reminder"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="hidden sm:inline">
                                      Remind
                                    </span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Invoices Table */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Loading invoices and collection records...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Invoices Found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No invoices matching "${searchQuery}".`
                  : activeTab === "PENDING"
                  ? "All active tenants are currently settled with zero outstanding dues."
                  : "No invoice records found under this view."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Invoice # & Type</th>
                    <th scope="col" className="px-6 py-4">Tenant Name</th>
                    <th scope="col" className="px-6 py-4">Room / Bed</th>
                    <th scope="col" className="px-6 py-4">Property</th>
                    <th scope="col" className="px-6 py-4">Month & Due Date</th>
                    <th scope="col" className="px-6 py-4">Total / Collected</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => {
                    const isPaid = invoice.status === "PAID";
                    const latestPayment =
                      invoice.payments && invoice.payments.length > 0
                        ? invoice.payments[invoice.payments.length - 1]
                        : null;

                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Invoice # & Type */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              #INV-{String(invoice.id).padStart(4, "0")}
                            </span>
                            {invoice.invoiceType === "UTILITY" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Zap className="w-3 h-3 text-amber-600" />
                                Electricity / Utility
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Home className="w-3 h-3 text-indigo-600" />
                                Room Rent
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tenant Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm shadow-xs ${
                                isPaid
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-indigo-50 border-indigo-100 text-indigo-600"
                              }`}
                            >
                              {invoice.tenantName ? invoice.tenantName.charAt(0).toUpperCase() : "T"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {invoice.tenantName || "Unknown"}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                {invoice.tenantPhone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {invoice.tenantPhone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Room & Bed */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Bed className="w-4 h-4 text-slate-400" />
                            <span>Room {invoice.roomNumber || "-"}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 text-xs">
                              Bed {invoice.bedNumber || "-"}
                            </span>
                          </div>
                        </td>

                        {/* Property */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[140px]">
                              {invoice.propertyName || "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* Month & Due Date */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {invoice.invoiceMonth || "N/A"}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Due: {formatDate(invoice.dueDate)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Total & Paid Amount */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              ₹{formatCurrency(invoice.totalAmount)}
                            </div>
                            {isPaid ? (
                              <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                                Paid: ₹{formatCurrency(invoice.amountPaid)}
                              </div>
                            ) : (
                              <div className="text-[11px] font-semibold text-rose-600 mt-0.5">
                                Due: ₹{formatCurrency(invoice.dueAmount || invoice.totalAmount)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PAID
                            </span>
                          ) : invoice.status === "PARTIALLY_PAID" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              PARTIAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              UNPAID
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(invoice)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 shadow-xs transition-all cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Receipt
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(invoice)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Record Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
        onSuccess={handlePaymentSuccess}
      />

      {/* Digital Rent Receipt Modal for Owner */}
      {isReceiptOpen && receiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {receiptInvoice.invoiceType === "UTILITY"
                    ? "Official Utility / Electricity Receipt"
                    : "Official Rent Payment Receipt"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Print receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsReceiptOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              <div className="text-center pb-3 border-b border-slate-100 space-y-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm shadow-sm">
                  PG
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {receiptInvoice.propertyName || "PG Residency"}
                </h4>
                <p className="text-slate-500 text-[11px]">
                  {receiptInvoice.propertyAddress || "Verified PG Property"}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                  <span>#INV-{String(receiptInvoice.id).padStart(4, "0")}</span>
                  <span>&bull;</span>
                  <span>
                    {receiptInvoice.invoiceType === "UTILITY"
                      ? "Electricity / Utility"
                      : "Monthly Rent"}
                  </span>
                  <span>&bull;</span>
                  <span>{receiptInvoice.invoiceMonth}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between text-slate-500">
                  <span>Resident Name:</span>
                  <span className="font-semibold text-slate-900">{receiptInvoice.tenantName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Contact Phone:</span>
                  <span className="font-semibold text-slate-900">{receiptInvoice.tenantPhone || "N/A"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Room & Bed:</span>
                  <span className="font-semibold text-slate-900">
                    Room {receiptInvoice.roomNumber} (Bed {receiptInvoice.bedNumber})
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Billing Cycle:</span>
                  <span className="font-semibold text-slate-900">{receiptInvoice.invoiceMonth}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Date:</span>
                  <span className="font-semibold text-slate-900">
                    {receiptInvoice.payments?.[0]?.paymentDate || receiptInvoice.invoiceDate}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Mode:</span>
                  <span className="font-semibold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {receiptInvoice.payments?.[0]?.mode || "ONLINE"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {receiptInvoice.payments?.[0]?.transactionId || `TXN_${receiptInvoice.id}_SETTLED`}
                  </span>
                </div>
              </div>

              {/* Amount Breakdown Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Base Stay Rent</span>
                  <span className="font-semibold text-slate-900">
                    ₹{formatCurrency(receiptInvoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Maintenance & Electricity</span>
                  <span className="font-semibold text-emerald-600">Included</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Amount Received</span>
                  <span className="text-emerald-700">
                    ₹{formatCurrency(receiptInvoice.amountPaid || receiptInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified & Settled Payment Record
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

