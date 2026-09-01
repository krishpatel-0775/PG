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
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  History,
} from "lucide-react";
import SimulatedCheckoutModal from "@/components/SimulatedCheckoutModal";

export default function TenantMyRentPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Checkout Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    fetchMyInvoices();
  }, []);

  const fetchMyInvoices = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/finance/invoices/my");
      setInvoices(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load your rent invoices and billing history.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = (invoice) => {
    setSelectedInvoice(invoice);
    setIsCheckoutOpen(true);
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

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "ALL") return invoices;
    return invoices.filter((inv) => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID")
      .reduce((acc, inv) => acc + (Number(inv.dueAmount) || Number(inv.totalAmount) || 0), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (Number(inv.amountPaid) || 0), 0);
  }, [invoices]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link
                href="/dashboard"
                className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-200">My Rent & Invoices</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Receipt className="w-8 h-8 text-indigo-400" />
              My Rent & Billing History
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              View your monthly anniversary invoices, track payment status, and make online rent payments.
            </p>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchMyInvoices}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Error:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* KPI Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Outstanding Due */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Due Balance
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  totalOutstanding > 0
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}
              >
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold tracking-tight ${
                  totalOutstanding > 0 ? "text-rose-400" : "text-white"
                }`}
              >
                ₹{formatCurrency(totalOutstanding)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {totalOutstanding > 0
                ? "Pending rent payment required"
                : "All payments are up to date! 🎉"}
            </p>
          </div>

          {/* Total Paid */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Amount Paid
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                ₹{formatCurrency(totalPaid)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Settled across past stay billing cycles
            </p>
          </div>

          {/* Total Invoices */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Invoices
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <History className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {invoices.length}
              </span>
              <span className="text-xs text-slate-400">billing records</span>
            </div>
            <p className="mt-1 text-xs text-indigo-400/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto anniversary cycle
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {["ALL", "UNPAID", "PARTIALLY_PAID", "PAID"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              {status === "ALL"
                ? "All Invoices"
                : status === "UNPAID"
                ? "Unpaid Dues"
                : status === "PARTIALLY_PAID"
                ? "Partially Paid"
                : "Paid / Settled"}
            </button>
          ))}
        </div>

        {/* Invoice Cards List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Loading your invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 px-4 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white">No Invoices Found</h3>
              <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
                {statusFilter !== "ALL"
                  ? `You have no ${statusFilter.toLowerCase()} invoices at the moment.`
                  : "No billing invoices have been generated for your stay yet."}
              </p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const isUnpaid = invoice.status === "UNPAID";
              const isPartial = invoice.status === "PARTIALLY_PAID";
              const isPaid = invoice.status === "PAID";

              return (
                <div
                  key={invoice.id}
                  className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
                    isUnpaid
                      ? "bg-slate-900/80 border-rose-500/30 shadow-lg shadow-rose-950/20 hover:border-rose-500/50"
                      : isPartial
                      ? "bg-slate-900/80 border-amber-500/30 hover:border-amber-500/50"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    {/* Left: Invoice Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        )}
                        {isPartial && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            Partially Paid
                          </span>
                        )}
                        {isUnpaid && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Unpaid
                          </span>
                        )}

                        <span className="text-xs text-slate-400 font-mono">
                          INV-{String(invoice.id).padStart(6, "0")}
                        </span>
                      </div>

                      {/* Dates and Property Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <span>
                            <span className="text-slate-500">Invoice Date:</span>{" "}
                            <strong className="text-slate-200">
                              {formatDate(invoice.invoiceDate)}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>
                            <span className="text-slate-500">Due Date:</span>{" "}
                            <strong className="text-slate-200">
                              {formatDate(invoice.dueDate)}
                            </strong>
                          </span>
                        </div>

                        {invoice.propertyName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span>
                              {invoice.propertyName}
                              {invoice.roomNumber && ` • Room ${invoice.roomNumber}`}
                              {invoice.bedNumber && ` (Bed ${invoice.bedNumber})`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount & Action */}
                    <div className="flex flex-col sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 uppercase tracking-wider block">
                          Total Rent
                        </span>
                        <div className="text-2xl font-bold text-white flex items-center sm:justify-end gap-1 mt-0.5">
                          ₹{formatCurrency(invoice.totalAmount)}
                        </div>
                        {Number(invoice.amountPaid) > 0 && !isPaid && (
                          <div className="text-xs text-amber-400 mt-0.5">
                            Remaining Due: ₹{formatCurrency(invoice.dueAmount)}
                          </div>
                        )}
                      </div>

                      {/* Pay Now Button (Opens Simulated Gateway Modal) */}
                      {(isUnpaid || isPartial) ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(invoice)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all group"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay Now
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3.5 py-1.5 rounded-2xl border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Settled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Simulated Payment Gateway Checkout Modal */}
      <SimulatedCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        invoice={selectedInvoice}
        onSuccess={fetchMyInvoices}
      />
    </div>
  );
}
