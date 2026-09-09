"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  IndianRupee,
  Receipt,
  ArrowLeft,
  Building2,
  Bed,
  Calendar,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  CreditCard,
  User,
  Phone,
  RefreshCw,
  FileText,
  Printer,
  X,
  History,
  ShieldCheck,
} from "lucide-react";
import RecordPaymentModal from "@/components/RecordPaymentModal";

export default function OwnerFinancePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" | "PENDING" | "PAID"
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
        // 2. Fallback to dues endpoint if not yet restarted
        console.warn("Falling back to dues endpoint", e);
        response = await api.get("/finance/invoices/dues");
      }
      setInvoices(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load finance billing records.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoicesManual = async () => {
    setGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await api.post("/finance/invoices/generate-manual");
      const count = response.data?.length || 0;
      setSuccessMessage(
        count > 0
          ? `Successfully generated ${count} monthly invoices for active tenants!`
          : "All active tenants already have invoices generated for this month."
      );
      await fetchAllInvoices();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to generate monthly invoices.";
      setErrorMessage(backendMessage);
    } finally {
      setGenerating(false);
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
    setSuccessMessage("Payment successfully recorded against invoice!");
    fetchAllInvoices();
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-IN");
  };

  // Filtered invoices based on search, tab
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.tenantName?.toLowerCase().includes(q) ||
        inv.tenantPhone?.toLowerCase().includes(q) ||
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

      return matchesSearch && matchesTab;
    });
  }, [invoices, searchQuery, activeTab]);

  // Aggregate KPI Metrics across ALL invoices
  const totalOutstanding = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + (Number(inv.dueAmount) || 0),
      0
    );
  }, [invoices]);

  const totalInvoiced = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + (Number(inv.totalAmount) || 0),
      0
    );
  }, [invoices]);

  const totalCollected = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + (Number(inv.amountPaid) || 0),
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
            <span className="text-slate-900 font-semibold">Billing & Finance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Rent Billing & Finance Hub
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Track revenue collection, review historical paid bills, generate monthly cycles, and manage tenant payments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            onClick={handleGenerateInvoicesManual}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating Cycle...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Generate Invoices Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Collected Amount */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Collected Amount
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600 flex items-center gap-1">
            <span>₹</span>
            {formatCurrency(totalCollected)}
          </div>
          <p className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {paidCount} settled {paidCount === 1 ? "invoice" : "invoices"}
          </p>
        </div>

        {/* Card 2: Total Outstanding Dues */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Outstanding Dues
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 flex items-center gap-1">
            <span className="text-rose-600">₹</span>
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="mt-1 text-xs text-rose-600 font-medium">
            Across {pendingCount} pending {pendingCount === 1 ? "invoice" : "invoices"}
          </p>
        </div>

        {/* Card 3: Total Invoiced */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoiced (All Cycles)
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 flex items-center gap-1">
            <span className="text-indigo-600">₹</span>
            {formatCurrency(totalInvoiced)}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Total stay rent across {invoices.length} billing cycles
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Tabs: All Invoices vs Pending Dues vs Settled Collection History */}
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
          Settled Collection History
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by tenant name, phone, room, or month..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm shadow-xs transition-all"
        />
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading invoices and collection records...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 px-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? "No matching invoices found" : "No Invoices in This View"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No invoices match your search query."
              : activeTab === "PENDING"
              ? "All active tenants are currently settled with zero outstanding dues."
              : "No invoices found for this selection."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Property / Room</th>
                  <th className="px-6 py-4">Billing Month</th>
                  <th className="px-6 py-4">Total Rent</th>
                  <th className="px-6 py-4">Collected</th>
                  <th className="px-6 py-4">Remaining Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Tenant Name and Contact */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {inv.tenantName}
                        </div>
                        {inv.tenantPhone && (
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {inv.tenantPhone}
                          </div>
                        )}
                      </td>

                      {/* Property & Room / Bed */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {inv.propertyName}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Bed className="w-3 h-3 text-slate-400" />
                          Room {inv.roomNumber} &bull; Bed {inv.bedNumber}
                        </div>
                      </td>

                      {/* Billing Month */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200/80">
                          {inv.invoiceMonth}
                        </span>
                      </td>

                      {/* Total Rent */}
                      <td className="px-6 py-4 font-semibold text-slate-900 text-sm">
                        ₹{formatCurrency(inv.totalAmount)}
                      </td>

                      {/* Collected / Paid So Far */}
                      <td className="px-6 py-4 text-emerald-600 font-semibold text-sm">
                        ₹{formatCurrency(inv.amountPaid)}
                      </td>

                      {/* Remaining Due */}
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-sm ${
                            Number(inv.dueAmount) > 0 ? "text-rose-600" : "text-slate-400"
                          }`}
                        >
                          ₹{formatCurrency(inv.dueAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PAID
                          </span>
                        ) : inv.status === "PARTIALLY_PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            UNPAID
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {isPaid ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Receipt
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98] cursor-pointer"
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
        </div>
      )}

      {/* Manual Payment Recording Modal */}
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
