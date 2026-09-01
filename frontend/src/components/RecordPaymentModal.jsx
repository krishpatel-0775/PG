"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  X,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  CreditCard,
  Building2,
  Bed,
} from "lucide-react";

export default function RecordPaymentModal({ isOpen, onClose, invoice, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("CASH");
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen && invoice) {
      const remaining = Number(invoice.dueAmount || invoice.totalAmount) || 0;
      setAmount(remaining > 0 ? remaining.toString() : "");
      setMode("CASH");
      setReferenceId("");
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const remainingDue = Number(invoice.dueAmount || invoice.totalAmount) || 0;

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
      setErrorMessage(
        `Payment amount cannot exceed remaining due of ₹${remainingDue.toLocaleString("en-IN")}.`
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/finance/payments/record", {
        invoiceId: invoice.id,
        amount: payAmount,
        mode: mode,
        referenceId: referenceId.trim() || null,
      });

      setSuccessMessage("Payment recorded successfully!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 700);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Record Payment / Clear Dues
              </h3>
              <p className="text-xs text-slate-400">
                Invoice #{invoice.id} &bull; {invoice.tenantName || "Tenant"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-white text-sm">
                  {invoice.tenantName || "Tenant"}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {invoice.propertyName}
                  {invoice.roomNumber && ` • Room ${invoice.roomNumber}`}
                  {invoice.bedNumber && ` (${invoice.bedNumber})`}
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {invoice.status || "UNPAID"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Total Rent</span>
                <span className="font-semibold text-white">
                  ₹{Number(invoice.totalAmount)?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Paid So Far</span>
                <span className="font-semibold text-emerald-400">
                  ₹{Number(invoice.amountPaid || 0)?.toLocaleString("en-IN")}
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

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="paymentAmount"
                  className="block text-xs font-medium text-slate-300"
                >
                  Payment Amount (₹) *
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(remainingDue.toString())}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Full Due (₹{remainingDue.toLocaleString("en-IN")})
                </button>
              </div>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  ₹
                </div>
                <input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingDue}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max ₹${remainingDue}`}
                  className="block w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label
                htmlFor="paymentMode"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Payment Mode *
              </label>
              <select
                id="paymentMode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            {/* Reference ID */}
            <div>
              <label
                htmlFor="referenceId"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Reference ID (Optional)
              </label>
              <input
                id="referenceId"
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. Cash Receipt # or UPI Ref: 32948291039"
                className="block w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Record Payment</span>
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
