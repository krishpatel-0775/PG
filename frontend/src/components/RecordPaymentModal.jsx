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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Record Payment / Clear Dues
              </h3>
              <p className="text-xs text-slate-500">
                Invoice #{invoice.id} &bull; {invoice.tenantName || "Tenant"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {invoice.tenantName || "Tenant"}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {invoice.propertyName}
                  {invoice.roomNumber && ` • Room ${invoice.roomNumber}`}
                  {invoice.bedNumber && ` (${invoice.bedNumber})`}
                </div>
              </div>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                  invoice.status === "PAID"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : invoice.status === "PARTIALLY_PAID" || invoice.status === "PARTIAL"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {invoice.status || "UNPAID"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Total Rent</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  ₹{Number(invoice.totalAmount)?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Paid So Far</span>
                <span className="font-semibold text-emerald-600 mt-0.5 block">
                  ₹{Number(invoice.amountPaid || 0)?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Remaining Due</span>
                <span className="font-bold text-rose-600 mt-0.5 block">
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
                  className="block text-xs font-semibold text-slate-700"
                >
                  Payment Amount (₹) *
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(remainingDue.toString())}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Fill Full Due (₹{remainingDue.toLocaleString("en-IN")})
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
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
                  className="block w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold transition-all"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label
                htmlFor="paymentMode"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Payment Mode *
              </label>
              <select
                id="paymentMode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-medium"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            {/* Reference ID */}
            <div>
              <label
                htmlFor="referenceId"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Reference ID / Note (Optional)
              </label>
              <input
                id="referenceId"
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. Cash Receipt # or UPI Ref ID"
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 shadow-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
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
