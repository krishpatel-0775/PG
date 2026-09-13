"use client";

import { useState } from "react";
import api from "@/lib/api";
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Ban,
  ArrowRight,
  Info,
} from "lucide-react";

export default function NoticeReviewModal({ isOpen, onClose, allocation, onSuccess }) {
  const [depositHandlingPolicy, setDepositHandlingPolicy] = useState("OFFSET_RENT");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !allocation) return null;

  const handleApprove = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      await api.post(`/allocations/${allocation.id}/notice/approve`, {
        depositHandlingPolicy,
        approvalNotes: approvalNotes.trim() || null,
      });
      if (onSuccess) onSuccess("Move-out notice approved successfully.");
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to approve move-out notice.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrorMessage("Please enter a reason for rejecting this move-out request.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await api.post(`/allocations/${allocation.id}/notice/reject`, {
        reason: rejectionReason.trim(),
      });
      if (onSuccess) onSuccess("Move-out notice request declined.");
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to reject move-out notice.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const deposit = Number(allocation.depositAmount || 0);
  const rent = Number(allocation.monthlyRent || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Review Move-Out Notice</h3>
              <p className="text-xs text-slate-500">
                {allocation.tenantName} &bull; Room {allocation.roomNumber} ({allocation.bedNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Request Overview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Requested Move-Out Details
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Pending Approval
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Planned Checkout
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
                  {allocation.plannedCheckoutDate || "Not Specified"}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  Deposit Balance
                </div>
                <div className="text-sm font-bold text-emerald-600 mt-1">
                  ₹{deposit.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>Notice Submitted: <strong>{allocation.noticeServedDate || "Today"}</strong></span>
              <span>Monthly Rent: <strong>₹{rent.toLocaleString("en-IN")}</strong></span>
            </div>
          </div>

          {!isRejectMode ? (
            <>
              {/* Deposit Policy Selection Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Choose Security Deposit Handling Policy</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Required</span>
                </div>

                {/* Option 1: OFFSET_RENT */}
                <div
                  onClick={() => setDepositHandlingPolicy("OFFSET_RENT")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    depositHandlingPolicy === "OFFSET_RENT"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="depositPolicy"
                    checked={depositHandlingPolicy === "OFFSET_RENT"}
                    onChange={() => setDepositHandlingPolicy("OFFSET_RENT")}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        Offset Rent with Deposit
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Upcoming monthly rent invoice(s) during the notice period will be automatically paid using the tenant&apos;s security deposit balance (₹{deposit.toLocaleString("en-IN")}).
                    </p>
                    <div className="text-[11px] text-indigo-700 font-medium pt-1 flex items-center gap-1">
                      <span>Leftover deposit refunded on checkout day</span>
                    </div>
                  </div>
                </div>

                {/* Option 2: REFUND_AT_CHECKOUT */}
                <div
                  onClick={() => setDepositHandlingPolicy("REFUND_AT_CHECKOUT")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    depositHandlingPolicy === "REFUND_AT_CHECKOUT"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="depositPolicy"
                    checked={depositHandlingPolicy === "REFUND_AT_CHECKOUT"}
                    onChange={() => setDepositHandlingPolicy("REFUND_AT_CHECKOUT")}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        Retain Deposit & Refund at Checkout
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        Direct Settlement
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tenant pays notice-period rent invoices normally. The full deposit (₹{deposit.toLocaleString("en-IN")}) remains untouched and is settled/refunded after final inspection.
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Approval Notes / Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved. Please clear personal belongings by 11 AM on checkout day."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </>
          ) : (
            /* Rejection Form Mode */
            <div className="space-y-3 p-4 rounded-xl bg-rose-50/80 border border-rose-200">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Decline Move-Out Request</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Declining will revert this allocation back to <strong>ACTIVE</strong> status and notify the tenant of your reason.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-900">
                  Reason for Declining <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this request is declined (e.g. minimum 3-month lock-in period applies, requested date invalid)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isRejectMode ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsRejectMode(true);
                  setErrorMessage("");
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Decline Request...
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Move-Out</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsRejectMode(false);
                  setErrorMessage("");
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                &larr; Back to Approval
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirm Decline</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
