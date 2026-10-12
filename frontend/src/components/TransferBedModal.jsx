"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import {
  X,
  ArrowRightLeft,
  Calendar,
  IndianRupee,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function TransferBedModal({ isOpen, onClose, allocation, onSuccess }) {
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form selections
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [newMonthlyRent, setNewMonthlyRent] = useState("");
  const [transferDeposit, setTransferDeposit] = useState(true);
  const [newDepositAmount, setNewDepositAmount] = useState("");
  const [transferUnpaidInvoices, setTransferUnpaidInvoices] = useState(true);
  const [transferDate, setTransferDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [reason, setReason] = useState("");

  // Trigger loading when modal opens
  useEffect(() => {
    if (!isOpen || !allocation) return;

    let isMounted = true;

    api.get("/properties")
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setProperties(list);

        const currentProp = list.find((p) => String(p.id) === String(allocation.propertyId)) || list[0];
        if (currentProp) {
          setSelectedPropertyId(String(currentProp.id));

          const rooms = (currentProp.rooms || []).filter((r) =>
            (r.beds || []).some((b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId))
          );

          if (rooms.length > 0) {
            const firstRoom = rooms[0];
            setSelectedRoomId(String(firstRoom.id));

            const beds = (firstRoom.beds || []).filter(
              (b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId)
            );
            if (beds.length > 0) {
              setSelectedBedId(String(beds[0].id));
            }

            const base = firstRoom.baseRent != null ? firstRoom.baseRent : allocation?.monthlyRent;
            setNewMonthlyRent(String(base || ""));
          } else {
            setSelectedRoomId("");
            setSelectedBedId("");
            setNewMonthlyRent(String(allocation?.monthlyRent || ""));
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to load available properties and rooms.";
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) setLoadingProperties(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, allocation]);

  // Currently selected property object
  const currentPropertyObj = useMemo(() => {
    return properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
  }, [properties, selectedPropertyId]);

  // Rooms in selected property with at least 1 vacant bed (excluding current bed)
  const availableRooms = useMemo(() => {
    if (!currentPropertyObj || !Array.isArray(currentPropertyObj.rooms)) return [];

    return currentPropertyObj.rooms.filter((room) => {
      const beds = Array.isArray(room.beds) ? room.beds : [];
      return beds.some(
        (b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId)
      );
    });
  }, [currentPropertyObj, allocation?.bedId]);

  // Selected room object
  const currentRoomObj = useMemo(() => {
    if (!currentPropertyObj || !Array.isArray(currentPropertyObj.rooms)) return null;
    return currentPropertyObj.rooms.find((r) => String(r.id) === String(selectedRoomId)) || null;
  }, [currentPropertyObj, selectedRoomId]);

  // Vacant beds in selected room
  const availableBeds = useMemo(() => {
    if (!currentRoomObj || !Array.isArray(currentRoomObj.beds)) return [];
    return currentRoomObj.beds.filter(
      (b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId)
    );
  }, [currentRoomObj, allocation?.bedId]);

  // Target bed object
  const currentBedObj = useMemo(() => {
    return availableBeds.find((b) => String(b.id) === String(selectedBedId)) || null;
  }, [availableBeds, selectedBedId]);

  // Event handler when property selection changes
  const handlePropertyChange = (propId) => {
    setSelectedPropertyId(propId);
    const prop = properties.find((p) => String(p.id) === String(propId));
    const rooms = (prop?.rooms || []).filter((r) =>
      (r.beds || []).some((b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId))
    );
    if (rooms.length > 0) {
      const firstRoom = rooms[0];
      setSelectedRoomId(String(firstRoom.id));
      const beds = (firstRoom.beds || []).filter(
        (b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId)
      );
      setSelectedBedId(beds.length > 0 ? String(beds[0].id) : "");
      const base = firstRoom.baseRent != null ? firstRoom.baseRent : allocation?.monthlyRent;
      setNewMonthlyRent(String(base || ""));
    } else {
      setSelectedRoomId("");
      setSelectedBedId("");
      setNewMonthlyRent(String(allocation?.monthlyRent || ""));
    }
  };

  // Event handler when room selection changes
  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    const room = availableRooms.find((r) => String(r.id) === String(roomId));
    const beds = (room?.beds || []).filter(
      (b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId)
    );
    setSelectedBedId(beds.length > 0 ? String(beds[0].id) : "");
    if (room) {
      const base = room.baseRent != null ? room.baseRent : allocation?.monthlyRent;
      setNewMonthlyRent(String(base || ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allocation?.id) return;

    if (!selectedBedId) {
      setErrorMessage("Please select a target vacant bed to transfer the tenant to.");
      return;
    }

    if (String(selectedBedId) === String(allocation.bedId)) {
      setErrorMessage("Target bed cannot be the tenant's current bed.");
      return;
    }

    const rentNum = Number(newMonthlyRent);
    if (isNaN(rentNum) || rentNum <= 0) {
      setErrorMessage("Please enter a valid positive monthly rent for the new room.");
      return;
    }

    let depositNum = null;
    if (!transferDeposit) {
      depositNum = Number(newDepositAmount);
      if (isNaN(depositNum) || depositNum < 0) {
        setErrorMessage("Please enter a valid deposit amount or choose to carry forward existing deposit.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        newBedId: Number(selectedBedId),
        newMonthlyRent: rentNum,
        newDepositAmount: depositNum,
        transferDeposit: transferDeposit,
        transferUnpaidInvoices: transferUnpaidInvoices,
        transferDate: transferDate || new Date().toLocaleDateString("en-CA"),
        reason: reason?.trim() || "Room transfer requested by owner/resident",
      };

      const res = await api.post(`/allocations/${allocation.id}/transfer`, payload);
      setSuccessMessage("Room transfer completed successfully!");

      if (onSuccess) {
        onSuccess(res.data);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to transfer resident to new room.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !allocation) return null;

  const currentRentNum = Number(allocation.monthlyRent) || 0;
  const targetRentNum = Number(newMonthlyRent) || 0;
  const rentDifference = targetRentNum - currentRentNum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Transfer Bed / Switch Room
              </h3>
              <p className="text-xs text-slate-500">
                Moving resident <strong>{allocation.tenantName || "Resident"}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Status Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="font-bold">{successMessage}</div>
            </div>
          )}

          {/* Current vs Target Comparison Card */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-indigo-100/80 rounded-xl p-4">
            <div className="grid grid-cols-11 items-center gap-2 text-xs">
              {/* Current */}
              <div className="col-span-5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Current Allocation
                </span>
                <div className="font-bold text-slate-800 truncate">
                  {allocation.propertyName || "Current PG"}
                </div>
                <div className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                  <span>Room {allocation.roomNumber || "-"}</span>
                  <span>•</span>
                  <span>Bed {allocation.bedNumber || "-"}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  ₹{Number(allocation.monthlyRent)?.toLocaleString("en-IN")}/mo
                </div>
              </div>

              {/* Transfer Arrow */}
              <div className="col-span-1 flex justify-center text-indigo-500">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Target */}
              <div className="col-span-5 space-y-1">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
                  Target Allocation
                </span>
                <div className="font-bold text-indigo-950 truncate">
                  {currentPropertyObj?.name || "Select Property"}
                </div>
                <div className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                  <span>{currentRoomObj ? `Room ${currentRoomObj.roomNumber}` : "Select Room"}</span>
                  <span>•</span>
                  <span>{currentBedObj ? `Bed ${currentBedObj.bedNumber}` : "Select Bed"}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-700">
                  ₹{targetRentNum.toLocaleString("en-IN")}/mo
                  {rentDifference !== 0 && (
                    <span
                      className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        rentDifference > 0
                          ? "text-emerald-700 bg-emerald-100"
                          : "text-amber-700 bg-amber-100"
                      }`}
                    >
                      {rentDifference > 0 ? `+₹${rentDifference}` : `-₹${Math.abs(rentDifference)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Loading state for properties */}
          {loadingProperties && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning available vacant rooms and beds...</span>
            </div>
          )}

          {!loadingProperties && properties.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              No properties found for your account. Please create properties first.
            </div>
          )}

          {!loadingProperties && properties.length > 0 && (
            <>
              {/* Property & Room Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Property */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Property *
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    disabled={submitting}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.address || "Main Branch"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Room */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Room (with Vacancies) *
                  </label>
                  {availableRooms.length === 0 ? (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      No vacant beds available in this property.
                    </div>
                  ) : (
                    <select
                      value={selectedRoomId}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      disabled={submitting}
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    >
                      {availableRooms.map((r) => {
                        const vacantCount = (r.beds || []).filter(
                          (b) => b.status === "VACANT" && String(b.id) !== String(allocation?.bedId)
                        ).length;
                        return (
                          <option key={r.id} value={r.id}>
                            Room {r.roomNumber} - Floor {r.floor} ({vacantCount} vacant) • ₹{r.baseRent}/mo
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              {/* Select Bed & Transfer Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Bed */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Vacant Bed *
                  </label>
                  {availableBeds.length === 0 ? (
                    <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      Please select a room first
                    </div>
                  ) : (
                    <select
                      value={selectedBedId}
                      onChange={(e) => setSelectedBedId(e.target.value)}
                      disabled={submitting}
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    >
                      {availableBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          Bed {b.bedNumber} (Vacant)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Transfer Effective Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Effective Transfer Date *
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Financial Terms Section */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Financial &amp; Billing Terms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Rent Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      New Monthly Rent (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMonthlyRent}
                      onChange={(e) => setNewMonthlyRent(e.target.value)}
                      disabled={submitting}
                      placeholder="e.g. 7500"
                      required
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Auto-populated from room base rent, customizable.
                    </span>
                  </div>

                  {/* Security Deposit Settings */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Security Deposit
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={transferDeposit}
                          onChange={(e) => setTransferDeposit(e.target.checked)}
                          disabled={submitting}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Carry forward ₹{Number(allocation.depositAmount)?.toLocaleString("en-IN")}</span>
                      </label>
                      {!transferDeposit && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            New Deposit Amount (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newDepositAmount}
                            onChange={(e) => setNewDepositAmount(e.target.value)}
                            disabled={submitting}
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
                            placeholder="e.g. 10000"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Billing & Invoice Continuity Toggle */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="transferInvoices"
                    checked={transferUnpaidInvoices}
                    onChange={(e) => setTransferUnpaidInvoices(e.target.checked)}
                    disabled={submitting}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 flex-shrink-0"
                  />
                  <label htmlFor="transferInvoices" className="text-xs text-slate-700 cursor-pointer">
                    <span className="font-bold text-slate-900 block">
                      Transfer Unpaid / Pending Invoices to New Room
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Recommended. Automatically re-links pending dues so the new room immediately reflects accurate outstanding balances in the Room-Wise Rent Matrix.
                    </span>
                  </label>
                </div>

                {/* Reason / Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Transfer Reason / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={submitting}
                    placeholder="e.g. Room upgrade requested by resident"
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 shadow-xs transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingProperties || availableBeds.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Transfer...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Confirm Bed Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
