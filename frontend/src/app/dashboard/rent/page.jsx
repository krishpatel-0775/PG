"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import RecordPaymentModal from "@/components/RecordPaymentModal";

export default function RentManagementPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" | "PENDING" | "PAID"
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Digital Receipt Modal State
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  const fetchAllInvoices = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. Try modern endpoint that returns ALL invoices (PAID, PARTIALLY_PAID, UNPAID)
      let response;
      try {
        response = await api.get("/finance/invoices?status=ALL");
      } catch (e) {
        // 2. Fallback to pending endpoint if not yet restarted
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

  // Filtered invoices based on search, tab, and status filter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.tenantName?.toLowerCase().includes(q) ||
        inv.tenantPhone?.toLowerCase().includes(q) ||
        inv.tenantEmail?.toLowerCase().includes(q) ||
        inv.propertyName?.toLowerCase().includes(q) ||
        inv.roomNumber?.toLowerCase().includes(q) ||
        inv.bedNumber?.toLowerCase().includes(q) ||
        inv.invoiceMonth?.toLowerCase().includes(q);

      let matchesTab = true;
      if (activeTab === "PENDING") {
        matchesTab = inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID";
      } else if (activeTab === "PAID") {
        matchesTab = inv.status === "PAID";
      }

      const matchesStatus =
        statusFilter === "ALL" || inv.status === statusFilter;

      return matchesSearch && matchesTab && matchesStatus;
    });
  }, [invoices, searchQuery, activeTab, statusFilter]);

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

      {/* Tabs: All Invoices vs Pending Dues vs Paid Invoices */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
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
          All Invoices
          <span
            className={`text-xs px-2 py-0.2 rounded-full font-bold ${
              activeTab === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {invoices.length}
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
          Pending Dues
          {pendingCount > 0 && (
            <span
              className={`text-xs px-2 py-0.2 rounded-full font-bold ${
                activeTab === "PENDING"
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {pendingCount}
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
          Paid & Settled
          {paidCount > 0 && (
            <span
              className={`text-xs px-2 py-0.2 rounded-full font-bold ${
                activeTab === "PAID"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {paidCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, phone, room, or invoice month..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-slate-400" />
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

      {/* Invoices Table */}
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
                ? "No invoices match your search query."
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
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                              {invoice.tenantName || "Unknown Tenant"}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              {invoice.tenantPhone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {invoice.tenantPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Room / Bed */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
                          <Bed className="w-3.5 h-3.5 text-indigo-600" />
                          {invoice.roomNumber ? `Room ${invoice.roomNumber}` : "Room -"}
                          {invoice.bedNumber && ` • Bed ${invoice.bedNumber}`}
                        </span>
                      </td>

                      {/* Property */}
                      <td className="px-6 py-4">
                        <div className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {invoice.propertyName || "PG Property"}
                        </div>
                      </td>

                      {/* Month & Due Date */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">
                            {invoice.invoiceMonth || "Monthly Rent"}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Due: {formatDate(invoice.dueDate)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Total / Collected */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            ₹{formatCurrency(invoice.totalAmount)}
                          </div>
                          {isPaid ? (
                            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid ₹{formatCurrency(invoice.amountPaid)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                              Due: ₹{formatCurrency(invoice.dueAmount)}
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
                <h3 className="font-bold text-slate-900 text-sm">Official Rent Payment Receipt</h3>
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
                <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  Invoice #{receiptInvoice.id} &bull; {receiptInvoice.invoiceMonth}
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

