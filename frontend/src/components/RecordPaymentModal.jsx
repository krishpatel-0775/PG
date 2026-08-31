"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  X,
  IndianRupee,
  CreditCard,
  User,
  Calendar,
  Building2,
  Bed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  FileText,
} from "lucide-react";

export default function RecordPaymentModal({ isOpen, onClose, invoice, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen && invoice) {
      const remaining = Number(invoice.dueAmount) || 0;
      setAmount(remaining.toString());
      setMode("UPI");
      setTransactionId("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setRemarks("");
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const remainingDue = Number(invoice.dueAmount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than 0.");
      return;
    }

    if (payAmount > remainingDue) {
      setErrorMessage(`Payment amount cannot exceed outstanding due of ₹${remainingDue.toLocaleString("en-IN")}.`);
      return;
    }

    setLoading(true);

    try {
      await api.post("/finance/payments", {
        invoiceId: invoice.id,
        amount: payAmount,
        mode: mode,
        transactionId: transactionId.trim() || null,
        paymentDate: paymentDate,
        remarks: remarks.trim() || null,
      });

      setSuccessMessage("Payment recorded successfully!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to record payment.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Record Rent Payment
              </h3>
              <p className="text-xs text-slate-400">
                Invoice #{invoice.id} &bull; {invoice.invoiceMonth}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2.5 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start gap-2.5 text-xs animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-white text-sm">
                  {invoice.tenantName}
                </div>
                <div className="text-xs text-slate-400">
                  {invoice.propertyName} &bull; Room {invoice.roomNumber} ({invoice.bedNumber})
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {invoice.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Total Rent</span>
                <span className="font-semibold text-white">
                  ₹{Number(invoice.totalAmount)?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Paid So Far</span>
                <span className="font-semibold text-emerald-400">
                  ₹{Number(invoice.amountPaid)?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Remaining Due</span>
                <span className="font-bold text-rose-400">
                  ₹{remainingDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            {/* Amount Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="amount"
                  className="block text-xs font-medium text-slate-300"
                >
                  Payment Amount (₹) *
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(remainingDue.toString())}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Pay Full Due (₹{remainingDue.toLocaleString("en-IN")})
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  ₹
                </div>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingDue}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max ₹${remainingDue}`}
                  className="block w-full pl-8 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Payment Mode and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="mode"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Payment Mode *
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="paymentDate"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Payment Date *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label
                htmlFor="transactionId"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Transaction / UTR Number (Optional)
              </label>
              <input
                id="transactionId"
                name="transactionId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. UPI Ref / Bank UTR: 32948291039"
                className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Remarks */}
            <div>
              <label
                htmlFor="remarks"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Remarks / Notes (Optional)
              </label>
              <input
                id="remarks"
                name="remarks"
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Paid in full for Oct rent"
                className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Confirm Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
