"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Receipt,
  IndianRupee,
  Calendar,
  Building2,
  Bed,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Info,
  CreditCard,
  RefreshCw,
  History,
  FileText,
  Printer,
  X,
  Sparkles,
} from "lucide-react";
import SimulatedCheckoutModal from "@/components/SimulatedCheckoutModal";

export default function TenantDuesPage() {
  const [dues, setDues] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState("dues"); // "dues" | "history"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Checkout Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Digital Receipt Modal State
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchDuesAndInvoices();
  }, []);

  const fetchDuesAndInvoices = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      // Fetch both pending dues and all invoices concurrently
      const [duesRes, allRes] = await Promise.allSettled([
        api.get("/finance/my-dues"),
        api.get("/finance/invoices/my"),
      ]);

      if (duesRes.status === "fulfilled") {
        setDues(duesRes.value.data || []);
      } else {
        console.warn("Could not fetch my-dues", duesRes.reason);
      }

      if (allRes.status === "fulfilled") {
        setAllInvoices(allRes.value.data || []);
      } else {
        console.warn("Could not fetch all invoices", allRes.reason);
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Unable to load your pending dues.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    setSuccessMessage("");
    fetchDuesAndInvoices();
  };

  const handleOpenCheckout = (inv) => {
    setSelectedInvoice(inv);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (txnData) => {
    setSuccessMessage(
      `Payment successfully authorized! Invoice settled. Transaction ID: ${
        txnData?.referenceId || txnData?.transactionId || "Confirmed"
      }`
    );
    // Refresh list to update status across backend
    fetchDuesAndInvoices();
  };

  const handleOpenReceipt = (inv) => {
    setReceiptInvoice(inv);
    setIsReceiptOpen(true);
  };

  const totalOutstanding = dues.reduce(
    (acc, inv) => acc + (Number(inv.dueAmount || inv.totalAmount) || 0),
    0
  );

  const settledInvoices = allInvoices.filter(
    (inv) => inv.status === "PAID"
  );

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-IN");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full pb-16">
      {/* Header & Breadcrumb */}
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
            <span className="text-slate-900 font-semibold">Rent & Payments</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Rent Invoices & Dues
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                View upcoming rent cycles, pending balances, and pay your dues online.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${
                refreshing ? "animate-spin text-indigo-600" : ""
              }`}
            />
            {refreshing ? "Refreshing..." : "Sync Balance"}
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Feedback Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-xs sm:text-sm shadow-xs"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Total Balance Hero Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Subtle accent background glow */}
        <div
          className={`absolute -right-16 -top-16 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
            totalOutstanding > 0 ? "bg-rose-50" : "bg-emerald-50"
          }`}
        />

        <div className="space-y-2 relative z-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {totalOutstanding > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Outstanding Balance
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All Caught Up
              </span>
            )}
          </div>

          <div className="text-3xl sm:text-4xl font-black text-slate-900 flex items-center gap-1 tracking-tight">
            <IndianRupee
              className={`w-8 h-8 ${
                totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            />
            {formatCurrency(totalOutstanding)}
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {totalOutstanding > 0
              ? `Across ${dues.length} pending billing ${
                  dues.length === 1 ? "cycle" : "cycles"
                }`
              : "Zero pending rent dues. All past invoices have been settled."}
          </p>
        </div>

        {/* Right Hero Action / Info Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-0">
          {totalOutstanding > 0 && dues.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenCheckout(dues[0])}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-200 text-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Pay Bill Now (₹{formatCurrency(totalOutstanding)})
            </button>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 max-w-sm space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Instant Settlement
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Pay via Card, UPI, or QR to immediately settle your dues and receive an official digital receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Pending Invoices vs. Payment History */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("dues")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "dues"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Pending Dues
          <span
            className={`text-xs px-2 py-0.2 rounded-full font-bold ${
              activeTab === "dues"
                ? "bg-white/20 text-white"
                : dues.length > 0
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {dues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4" />
          Payment History & Receipts
          {settledInvoices.length > 0 && (
            <span
              className={`text-xs px-2 py-0.2 rounded-full font-bold ${
                activeTab === "history"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {settledInvoices.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Checking your dues and billing records...
          </p>
        </div>
      ) : activeTab === "dues" ? (
        /* TAB 1: PENDING DUES */
        dues.length === 0 ? (
          /* Zero-Balance Celebratory Card */
          <div className="text-center py-16 px-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              All Caught Up! 🎉
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              You have zero pending rent dues. All your past invoices have been settled in full.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm transition-all cursor-pointer"
              >
                <History className="w-4 h-4 text-slate-500" />
                View Settled Invoices
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm shadow-xs transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Outstanding Invoices List */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Pending Invoices Due
              </h2>
              <span className="text-xs text-slate-500">
                Click &quot;Pay Bill&quot; to test the online gateway workflow
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dues.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-all"
                >
                  {/* Header: Month & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                          Invoice for {inv.invoiceMonth}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            inv.status === "UNPAID"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {inv.status === "UNPAID" ? "Unpaid" : "Partially Paid"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          {inv.propertyName || "PG Stay"}
                        </span>
                        <span>&bull;</span>
                        <span>Room {inv.roomNumber} ({inv.bedNumber})</span>
                      </p>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5 self-start sm:self-auto">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="text-slate-500 font-normal">Due Date:</span>
                      <span>{inv.dueDate}</span>
                    </div>
                  </div>

                  {/* Financial Figures Grid */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium">
                        Monthly Rent
                      </span>
                      <span className="font-bold text-slate-900 text-sm sm:text-base mt-0.5 block">
                        ₹{formatCurrency(inv.totalAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium">
                        Paid Amount
                      </span>
                      <span className="font-bold text-emerald-600 text-sm sm:text-base mt-0.5 block">
                        ₹{formatCurrency(inv.amountPaid)}
                      </span>
                    </div>

                    <div>
                      <span className="text-rose-600 block text-[11px] font-bold">
                        Due Balance
                      </span>
                      <span className="font-extrabold text-rose-600 text-sm sm:text-base mt-0.5 block">
                        ₹{formatCurrency(inv.dueAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar with Direct Notice & Pay Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-[11px]">
                        Transfer <strong>₹{formatCurrency(inv.dueAmount)}</strong> online or pay via owner UPI
                      </span>
                    </div>

                    {/* Pay Bill CTA Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(inv)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-200 text-xs sm:text-sm transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay Bill (₹{formatCurrency(inv.dueAmount)})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* TAB 2: PAYMENT HISTORY & RECEIPTS */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Settled Invoices & Billing History
            </h2>
            <span className="text-xs text-slate-500">
              {settledInvoices.length} settled billing records
            </span>
          </div>

          {settledInvoices.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No settled invoices yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you settle a pending invoice using the Pay Bill button, it will automatically appear here with full transaction records and receipts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {settledInvoices.map((inv) => {
                const latestPayment =
                  inv.payments && inv.payments.length > 0
                    ? inv.payments[inv.payments.length - 1]
                    : null;

                return (
                  <div
                    key={inv.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold text-slate-900">
                            Invoice for {inv.invoiceMonth}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Paid & Settled
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inv.propertyName} &bull; Room {inv.roomNumber} ({inv.bedNumber})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block font-medium">Settled Amount</span>
                        <span className="text-base font-bold text-slate-900">
                          ₹{formatCurrency(inv.amountPaid || inv.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-slate-500">
                        {latestPayment?.transactionId && (
                          <div>
                            <span>Txn Ref: </span>
                            <span className="font-mono text-slate-800 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              {latestPayment.transactionId}
                            </span>
                          </div>
                        )}
                        <div>
                          <span>Mode: </span>
                          <span className="font-semibold text-slate-700 uppercase">
                            {latestPayment?.mode || "ONLINE"}
                          </span>
                        </div>
                        {latestPayment?.paymentDate && (
                          <div>
                            <span>Date: </span>
                            <span className="font-semibold text-slate-700">
                              {latestPayment.paymentDate}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(inv)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Simulated Checkout Modal */}
      <SimulatedCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        invoice={selectedInvoice}
        onSuccess={handlePaymentSuccess}
      />

      {/* Digital Rent Receipt Modal */}
      {isReceiptOpen && receiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900"
            role="dialog"
            aria-modal="true"
          >
            {/* Receipt Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Official Rent Receipt</h3>
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

            {/* Receipt Body */}
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
                  Receipt #{receiptInvoice.id} &bull; {receiptInvoice.invoiceMonth}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between text-slate-500">
                  <span>Resident Name:</span>
                  <span className="font-semibold text-slate-900">{receiptInvoice.tenantName}</span>
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
                    {receiptInvoice.payments?.[0]?.paymentDate || new Date().toISOString().split("T")[0]}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {receiptInvoice.payments?.[0]?.transactionId || `TXN_${receiptInvoice.id}_ONLINE`}
                  </span>
                </div>
              </div>

              {/* Amount Breakdown Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Room Accommodation Rent</span>
                  <span className="font-semibold text-slate-900">
                    ₹{formatCurrency(receiptInvoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Maintenance & Amenities</span>
                  <span className="font-semibold text-emerald-600">Included</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Amount Settled</span>
                  <span className="text-emerald-700">
                    ₹{formatCurrency(receiptInvoice.amountPaid || receiptInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Electronic Rent Receipt Confirmed
              </div>
            </div>

            {/* Receipt Modal Footer */}
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
