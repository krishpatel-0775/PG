"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  X,
  Zap,
  Gauge,
  Calculator,
  IndianRupee,
  Calendar,
  Bed,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  CreditCard,
  ChevronRight,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";

/**
 * UtilityBreakdownModal - Transparent sub-meter electricity breakdown for tenants
 *
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close callback
 * @param {object} invoice - Selected invoice { id, totalAmount, dueAmount, status, invoiceMonth, roomNumber, propertyName, etc. }
 * @param {function} onPayNow - Callback to open the payment gateway
 */
export default function UtilityBreakdownModal({
  isOpen,
  onClose,
  invoice,
  onPayNow,
}) {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && invoice) {
      fetchTenantShareDetails();
    } else {
      setShareData(null);
      setError("");
    }
  }, [isOpen, invoice]);

  const fetchTenantShareDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/utilities/tenant/my-shares");
      const shares = res.data || [];
      // Match by invoiceId first, or fallback to billingMonth
      const matched =
        shares.find((s) => s.invoiceId === invoice.id) ||
        shares.find((s) => s.billingMonth === invoice.invoiceMonth) ||
        (shares.length > 0 ? shares[0] : null);

      setShareData(matched);
    } catch (err) {
      console.warn("Could not fetch detailed utility share data", err);
      // Not fatal; we can still render based on invoice values
      setError("Unable to load live meter telemetry; displaying invoice billing record.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  // Derive display values from shareData or invoice fallback
  const roomNumber = shareData?.roomNumber || invoice.roomNumber || "N/A";
  const startReading = shareData?.previousReading ?? 0;
  const endReading = shareData?.currentReading ?? 0;
  const unitsConsumed = shareData?.unitsConsumed ?? (endReading - startReading > 0 ? endReading - startReading : 0);
  const ratePerUnit = shareData?.ratePerUnit ?? 10;
  const totalRoomCost =
    shareData?.totalRoomCost ??
    (unitsConsumed > 0 ? unitsConsumed * ratePerUnit : Number(invoice.totalAmount) * (shareData?.roomCapacity || 2));

  const roomCapacity = shareData?.roomCapacity || 2;
  const daysOccupied = shareData?.daysOccupied ?? 30;
  const totalDays = shareData?.totalDaysInMonth ?? 30;
  const tenantShareAmount = shareData?.shareAmount ?? Number(invoice.totalAmount);

  const isPaid = invoice.status === "PAID";
  const isUnpaid = invoice.status === "UNPAID";
  const isPartial = invoice.status === "PARTIALLY_PAID";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/20 via-slate-900 to-indigo-950/60 border-b border-slate-800 relative flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Zap className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    ⚡ Electricity Sub-Meter Breakdown
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    INV-{String(invoice.id).padStart(6, "0")}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                  Room {roomNumber} • {invoice.invoiceMonth || "Monthly Cycle"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {invoice.propertyName || "Resident PG Property"} • Bed {invoice.bedNumber || shareData?.bedNumber || "Assigned"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge & Due Date Banner */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Payment Status:</span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Paid & Settled
                </span>
              ) : isPartial ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                  <Clock className="w-3 h-3" /> Partially Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                  <AlertCircle className="w-3 h-3" /> Unpaid Due
                </span>
              )}
            </div>

            {invoice.dueDate && (
              <div className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Due: <strong className="text-slate-200">{invoice.dueDate}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
              <p className="text-xs">Loading sub-meter transparency breakdown...</p>
            </div>
          ) : (
            <>
              {/* Error Notice if any */}
              {error && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Room-Level Transparency Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    Physical Room Sub-Meter Reading
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Room {roomNumber} Sub-Meter
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[11px] font-medium text-slate-400">Meter Start Reading</div>
                    <div className="mt-1 text-base sm:text-lg font-mono font-bold text-white">
                      {Number(startReading).toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[11px] font-medium text-slate-400">Meter End Reading</div>
                    <div className="mt-1 text-base sm:text-lg font-mono font-bold text-white">
                      {Number(endReading).toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[11px] font-medium text-slate-400">Units Consumed</div>
                    <div className="mt-1 text-base sm:text-lg font-mono font-bold text-amber-400">
                      {Number(unitsConsumed).toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[11px] font-medium text-slate-400">Rate per Unit</div>
                    <div className="mt-1 text-base sm:text-lg font-mono font-bold text-slate-200">
                      ₹{Number(ratePerUnit).toFixed(2)} <span className="text-xs font-normal text-slate-400">/ kWh</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 col-span-2 sm:col-span-2">
                    <div className="text-[11px] font-medium text-slate-400">Total Room Electricity Cost</div>
                    <div className="mt-1 text-lg sm:text-xl font-mono font-extrabold text-emerald-400 flex items-baseline gap-1">
                      ₹{Number(totalRoomCost).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({Number(unitsConsumed).toFixed(0)} kWh × ₹{ratePerUnit})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Personal Split Math Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-800/70 to-slate-800/40 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        Personal Split Calculation Math
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Prorated by bed capacity and actual active stay days in the billing cycle
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {roomCapacity} Beds Capacity
                  </span>
                </div>

                {/* Mathematical Formula Breakdown Card */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-2">
                  <div className="text-[11px] text-slate-400 font-medium">Calculation Formula:</div>
                  <div className="text-xs sm:text-sm font-mono text-indigo-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800 overflow-x-auto">
                    (Total Room Cost ÷ Room Capacity) × (Days Occupied ÷ Days in Month) = Your Share
                  </div>

                  {/* Plugged in Numbers */}
                  <div className="pt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Total Room Cost:</span>
                      <strong className="text-white font-mono">₹{Number(totalRoomCost).toFixed(2)}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Room Total Capacity:</span>
                      <strong className="text-white font-mono">{roomCapacity} Beds</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Base Share per Bed:</span>
                      <strong className="text-white font-mono">
                        ₹{(Number(totalRoomCost) / (roomCapacity || 1)).toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Your Occupancy in Month:</span>
                      <strong className="text-white font-mono">
                        {daysOccupied} of {totalDays} days ({daysOccupied === totalDays ? "Full Month" : "Prorated"})
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-bold text-amber-400">Your Prorated Electricity Dues:</span>
                      <strong className="text-lg font-mono font-extrabold text-amber-400">
                        ₹{Number(tenantShareAmount).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Owner Absorption Assurance */}
                <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Fair-share Guarantee:</strong> Empty beds or unallocated fractional days in your room are legally absorbed by PG management. You are never charged for vacant capacity.
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="text-left">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              {isPaid ? "Settled Amount" : "Amount to Pay"}
            </span>
            <div className="text-xl font-extrabold text-white">
              ₹{Number(isPaid ? invoice.amountPaid || invoice.totalAmount : invoice.dueAmount || invoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>

            {!isPaid && onPayNow && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPayNow(invoice);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all group cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Electricity Bill</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
