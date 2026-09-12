"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import {
  X,
  ShieldCheck,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  User,
  Bed,
  Building2,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

/**
 * CheckoutClearanceModal - Move-out clearance & security deposit settlement modal
 *
 * @param {boolean} isOpen - Modal visibility state
 * @param {function} onClose - Modal close handler
 * @param {object} allocation - Target allocation object { id, tenantName, roomNumber, bedNumber, etc. }
 * @param {function} onSuccess - Callback invoked after successful settlement: onSuccess({ allocationId, bedNumber, ... })
 */
export default function CheckoutClearanceModal({
  isOpen,
  onClose,
  allocation,
  onSuccess,
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Dynamic Damage Assessment list: [ { id: string, description: string, amount: string } ]
  const [damageItems, setDamageItems] = useState([]);

  // Settlement Execution form
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [transactionReference, setTransactionReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isOpen && allocation) {
      fetchSummary(allocation.id);
      setDamageItems([]);
      setPaymentMode("UPI");
      setTransactionReference("");
      setRemarks("");
      setSubmitError("");
    } else {
      setSummary(null);
    }
  }, [isOpen, allocation]);

  const fetchSummary = async (allocId) => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await api.get(`/checkout/${allocId}/summary`);
      setSummary(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load checkout settlement summary.";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Damage row operations
  const handleAddDamageItem = () => {
    setDamageItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", amount: "" },
    ]);
  };

  const handleUpdateDamageItem = (id, field, value) => {
    setDamageItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveDamageItem = (id) => {
    setDamageItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Real-Time Net Settlement Math
  const totalDamages = useMemo(() => {
    return damageItems.reduce((acc, item) => {
      const val = parseFloat(item.amount);
      return acc + (isNaN(val) || val < 0 ? 0 : val);
    }, 0);
  }, [damageItems]);

  const remainingDeposit = summary ? Number(summary.remainingDeposit || 0) : 0;
  const initialDeposit = summary ? Number(summary.initialDeposit || 0) : 0;
  const depositUsedForRent = summary ? Number(summary.depositUsedForRent || 0) : 0;
  const totalUnpaidDues = summary ? Number(summary.totalUnpaidDues || 0) : 0;

  // Net Refund / Due = Remaining Deposit - (Unpaid Dues + Total Damages)
  const netSettlement = remainingDeposit - (totalUnpaidDues + totalDamages);
  const isRefund = netSettlement > 0;
  const isDeficit = netSettlement < 0;
  const isZero = netSettlement === 0;

  const handleFinalize = async () => {
    // Validate damage items if any have empty descriptions or amounts
    for (const d of damageItems) {
      if (!d.description.trim()) {
        setSubmitError("Please fill in descriptions for all damage assessment rows.");
        return;
      }
      const amt = parseFloat(d.amount);
      if (isNaN(amt) || amt <= 0) {
        setSubmitError("Please enter a valid amount greater than zero for all damage rows.");
        return;
      }
    }

    setSubmitLoading(true);
    setSubmitError("");

    try {
      const payload = {
        damages: damageItems.map((d) => ({
          description: d.description.trim(),
          amount: parseFloat(d.amount),
        })),
        paymentMode: paymentMode,
        transactionReference: transactionReference.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };

      const res = await api.post(`/checkout/${allocation.id}/finalize`, payload);
      
      if (onSuccess) {
        onSuccess({
          allocationId: allocation.id,
          bedNumber: allocation.bedNumber || summary?.bedNumber,
          roomNumber: allocation.roomNumber || summary?.roomNumber,
          tenantName: allocation.tenantName || summary?.tenantName,
          clearance: res.data,
        });
      }
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to finalize move-out clearance and settle deposit.";
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen || !allocation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white relative flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Move-Out Clearance & Settlement
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    ALLOC-#{allocation.id}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                  Process Checkout — {allocation.tenantName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Room {allocation.roomNumber} • Bed {allocation.bedNumber} • Check-In: {allocation.checkInDate || "N/A"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={submitLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Retrieving settlement balance and unpaid dues...</p>
            </div>
          ) : fetchError ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
              <div>
                <strong className="block font-semibold">Error Loading Settlement</strong>
                <span>{fetchError}</span>
              </div>
            </div>
          ) : summary ? (
            <>
              {/* Notice Metadata Badge if served */}
              {summary.noticeServedDate && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>
                      Notice served on <strong>{summary.noticeServedDate}</strong> • Planned departure: <strong>{summary.plannedCheckoutDate || "N/A"}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 font-semibold font-mono">
                    NOTICE_SERVED
                  </span>
                </div>
              )}

              {/* 1. Security Deposit Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  1. Security Deposit Breakdown
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                      Initial Deposit Collected
                    </span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      ₹{initialDeposit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">At move-in</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                      Deposit Used for Rent
                    </span>
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                      ₹{depositUsedForRent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 block">
                      {depositUsedForRent > 0 ? "Offset final month's rent" : "No offset applied"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 block">
                      Remaining Deposit
                    </span>
                    <div className="text-lg font-extrabold text-indigo-900 dark:text-indigo-200 mt-1">
                      ₹{remainingDeposit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      Available for refund / deduction
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Outstanding Invoices & Utility Dues */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-rose-500" />
                    2. Outstanding Dues & Pending Invoices ({summary.unpaidInvoices?.length || 0})
                  </h3>
                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    Total Dues: ₹{totalUnpaidDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {summary.unpaidInvoices && summary.unpaidInvoices.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    {summary.unpaidInvoices.map((inv) => (
                      <div key={inv.id} className="p-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                            inv.invoiceType === "UTILITY"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                          }`}>
                            {inv.invoiceType === "UTILITY" ? <Zap className="w-4 h-4 fill-amber-500" /> : <FileText className="w-4 h-4" />}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>INV-{String(inv.id).padStart(6, "0")}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                                {inv.invoiceType || "RENT"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Due: {inv.dueDate || "N/A"} • Month: {inv.invoiceMonth || "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-extrabold text-slate-900 dark:text-white">
                          ₹{Number(inv.dueAmount || inv.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>No outstanding unpaid invoices found for this tenant. All dues are clear!</span>
                  </div>
                )}
              </div>

              {/* 3. Dynamic Damage Assessment Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-amber-500" />
                    3. Physical Damage Assessment
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddDamageItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Damage Item
                  </button>
                </div>

                {damageItems.length > 0 ? (
                  <div className="space-y-2.5">
                    {damageItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5"
                      >
                        <span className="text-xs font-mono font-bold text-slate-400 w-5">
                          #{idx + 1}
                        </span>

                        <input
                          type="text"
                          placeholder="e.g. Wall repaint & patch, Lost wardrobe key..."
                          value={item.description}
                          onChange={(e) => handleUpdateDamageItem(item.id, "description", e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />

                        <div className="relative w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => handleUpdateDamageItem(item.id, "amount", e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDamageItem(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="flex justify-end text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
                      Total Assessed Damages: <strong className="ml-1 text-slate-900 dark:text-white">₹{totalDamages.toFixed(2)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No physical damages recorded. Click <strong>&quot;+ Add Damage Item&quot;</strong> if deductions are required for repairs or lost keys.
                  </div>
                )}
              </div>

              {/* 4. Real-Time Net Settlement Summary Card */}
              <div className={`p-5 rounded-3xl border transition-all ${
                isRefund
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                  : isDeficit
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300"
                  : "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block">
                      {isRefund
                        ? "🎉 Refund Owed to Resident"
                        : isDeficit
                        ? "⚠️ Shortfall / Deficit Owed by Resident"
                        : "⚖️ Balanced Settlement (Zero Dues)"}
                    </span>
                    <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${
                      isRefund ? "text-emerald-600 dark:text-emerald-400" : isDeficit ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                    }`}>
                      ₹{Math.abs(netSettlement).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs space-y-0.5 opacity-90">
                    <div>Remaining Deposit: <strong>₹{remainingDeposit.toFixed(2)}</strong></div>
                    <div>Minus Unpaid Dues: <strong>-₹{totalUnpaidDues.toFixed(2)}</strong></div>
                    <div>Minus Damages: <strong>-₹{totalDamages.toFixed(2)}</strong></div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-current/10 text-xs leading-relaxed">
                  {isRefund && "Management will disburse this refund to the tenant via the selected payment method."}
                  {isDeficit && "The security deposit was insufficient to cover outstanding dues and damages. The tenant must pay this shortfall."}
                  {isZero && "Deposit perfectly offsets all outstanding dues and damages. No financial transfer required."}
                </div>
              </div>

              {/* 5. Payment & Settlement Execution */}
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  4. Finalization & Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Disbursement / Settlement Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online Gateway</option>
                      <option value="SECURITY_DEPOSIT">Security Deposit Offset</option>
                    </select>
                  </div>

                  {/* Transaction Reference / UTR */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Transaction UTR / Reference ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/4289102849 or NEFT-928172"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Settlement Remarks / Inspection Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Room inspected, keys returned, refund disbursed via UPI."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitLoading}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleFinalize}
            disabled={submitLoading || loading || !summary}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {submitLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Finalizing Checkout...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Complete Checkout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
