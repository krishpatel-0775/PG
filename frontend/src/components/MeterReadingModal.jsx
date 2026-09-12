"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import {
  X,
  Zap,
  Gauge,
  Calculator,
  IndianRupee,
  Users,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Bed,
  Info,
  Sparkles,
  ArrowRight,
} from "lucide-react";

/**
 * MeterReadingModal - Sub-meter reading recording & prorated split generator
 *
 * @param {boolean} isOpen - Modal visibility state
 * @param {function} onClose - Modal close handler
 * @param {object} room - Selected room object { id, roomNumber, floor, capacity, totalCapacity, propertyName, lastReading }
 * @param {string} billingMonth - Active billing month formatted as "MMM-YYYY" (e.g. "OCT-2026")
 * @param {function} onSuccess - Callback invoked after successful commit
 */
export default function MeterReadingModal({
  isOpen,
  onClose,
  room,
  billingMonth,
  onSuccess,
}) {
  const [previousReading, setPreviousReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [ratePerUnit, setRatePerUnit] = useState("10");

  // Real-time Preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Commit state
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const debounceTimerRef = useRef(null);

  // Initialize previous reading from room lastReading on open
  useEffect(() => {
    if (isOpen && room) {
      const prevVal = room.lastReading?.currentReading ?? 0;
      setPreviousReading(String(prevVal));
      setCurrentReading("");
      setRatePerUnit("10");
      setPreviewData(null);
      setPreviewError("");
      setCommitError("");
      setSuccessMessage("");
    }
  }, [isOpen, room]);

  // Live Auto-Calculation derived values
  const prevNum = parseFloat(previousReading) || 0;
  const currNum = parseFloat(currentReading);
  const rateNum = parseFloat(ratePerUnit) || 10;

  const isValidReading =
    !isNaN(currNum) && currNum >= prevNum && !isNaN(rateNum) && rateNum > 0;
  const unitsConsumedLive =
    isValidReading ? (currNum - prevNum).toFixed(2) : "--";
  const totalCostLive =
    isValidReading ? ((currNum - prevNum) * rateNum).toFixed(2) : "--";

  // Debounced preview API call
  useEffect(() => {
    if (!isOpen || !room) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isValidReading || currentReading === "") {
      setPreviewData(null);
      if (currentReading !== "" && currNum < prevNum) {
        setPreviewError(
          `Current reading (${currNum}) cannot be less than previous reading (${prevNum}).`
        );
      } else {
        setPreviewError("");
      }
      return;
    }

    setPreviewError("");
    setPreviewLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const payload = {
          roomId: room.id,
          currentReading: currNum,
          ratePerUnit: rateNum,
          billingMonth: billingMonth,
          previousReading: prevNum,
        };

        const res = await api.post("/utilities/preview", payload);
        setPreviewData(res.data);
        setPreviewError("");
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to calculate prorated preview.";
        setPreviewError(msg);
        setPreviewData(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentReading, ratePerUnit, previousReading, isOpen, room, billingMonth, isValidReading, currNum, prevNum, rateNum]);

  // Save & Generate Split Invoices
  const handleCommit = async () => {
    if (!isValidReading) {
      setCommitError("Please provide a valid current reading greater than or equal to previous reading.");
      return;
    }

    setCommitLoading(true);
    setCommitError("");
    setSuccessMessage("");

    try {
      const payload = {
        roomId: room.id,
        currentReading: currNum,
        ratePerUnit: rateNum,
        billingMonth: billingMonth,
        previousReading: prevNum,
      };

      const res = await api.post("/utilities/commit", payload);
      setSuccessMessage("Electricity invoices successfully generated and dispatched to tenants!");

      setTimeout(() => {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }, 1200);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to commit utility reading and generate invoices.";
      setCommitError(msg);
    } finally {
      setCommitLoading(false);
    }
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white relative flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Zap className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Sub-Meter Billing
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                    {billingMonth}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                  Record Reading — Room {room.roomNumber}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {room.propertyName || "Selected Property"} • Floor {room.floor ?? "N/A"} • Capacity: {room.totalCapacity || room.capacity || (room.beds ? room.beds.length : 1)} Beds
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={commitLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Header KPI Chips */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-300 font-medium block">Units Consumed</span>
              <div className="text-lg sm:text-xl font-extrabold text-amber-400 mt-0.5 flex items-baseline gap-1">
                {unitsConsumedLive}
                <span className="text-xs font-normal text-slate-300">kWh</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-300 font-medium block">Rate per Unit</span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-100 mt-0.5 flex items-baseline gap-1">
                ₹{rateNum}
                <span className="text-xs font-normal text-slate-300">/ kWh</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-300 font-medium block">Total Room Cost</span>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5 flex items-baseline gap-1">
                ₹{totalCostLive !== "--" ? Number(totalCostLive).toLocaleString("en-IN") : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Previous Reading */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                Previous Reading (kWh)
              </label>
              <input
                type="number"
                step="any"
                readOnly
                value={previousReading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-sm font-mono cursor-not-allowed"
                title="Auto-populated from the latest recorded reading for this room"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 block">
                Last recorded benchmark
              </span>
            </div>

            {/* Current Reading */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                Current Reading (kWh) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min={prevNum}
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                placeholder={`e.g. ${(prevNum + 120).toFixed(0)}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 block">
                Enter physical meter dial value
              </span>
            </div>

            {/* Rate per Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                Rate per Unit (₹/kWh) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(e.target.value)}
                placeholder="10"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 block">
                Standard default: ₹10/unit
              </span>
            </div>
          </div>

          {/* Validation or Feedback Alert */}
          {previewError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{previewError}</span>
            </div>
          )}

          {commitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{commitError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Live Preview Section Header */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Real-Time Prorated Split Preview
                </h3>
              </div>

              {previewLoading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Calculating splits...
                </span>
              )}
            </div>

            {!currentReading ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Gauge className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Enter the current meter reading above to calculate live tenant splits and owner absorption.
                </p>
              </div>
            ) : previewLoading && !previewData ? (
              <div className="space-y-2 py-4">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              </div>
            ) : previewData ? (
              <div className="space-y-4">
                {/* 1. Tenant Splits Table */}
                <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      Active Tenant Splits ({previewData.tenantShares?.length || 0})
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Base Share per Bed: <strong>₹{previewData.baseSharePerBed ?? 0}</strong>
                    </span>
                  </div>

                  {previewData.tenantShares && previewData.tenantShares.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700/50">
                          <tr>
                            <th className="px-4 py-3">Tenant</th>
                            <th className="px-4 py-3">Bed</th>
                            <th className="px-4 py-3">Stay Duration</th>
                            <th className="px-4 py-3 text-right">Calculated Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {previewData.tenantShares.map((split, idx) => (
                            <tr
                              key={split.tenantId || idx}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-750 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {split.tenantName}
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                  {split.tenantEmail}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800">
                                  <Bed className="w-3 h-3" />
                                  {split.bedNumber}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {split.fullMonthOccupied ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Full Month ({split.daysOccupied}/{split.totalDaysInMonth} days)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Prorated ({split.daysOccupied}/{split.totalDaysInMonth} days)
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                                ₹{Number(split.shareAmount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700/60 font-semibold">
                          <tr>
                            <td colSpan={3} className="px-4 py-2.5 text-slate-600 dark:text-slate-400 text-right">
                              Total Tenant Dues Generated:
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              ₹{Number(previewData.totalTenantShareAmount || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No active residents currently occupied in this room.
                    </div>
                  )}
                </div>

                {/* 2. Owner Absorption Card */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Owner Absorption (Vacant Capacity)
                      </h4>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 max-w-lg">
                        Unoccupied bed shares and unallocated fractional days are legally absorbed by the property owner and not passed to residents.
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-400 block">
                      Absorbed Cost
                    </span>
                    <span className="text-base font-extrabold text-amber-900 dark:text-amber-200">
                      ₹{Number(previewData.ownerAbsorbedAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={commitLoading}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommit}
            disabled={commitLoading || !isValidReading || previewLoading || !previewData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {commitLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Invoices...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Save & Generate Split Invoices</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
