"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { X, DoorOpen, Loader2, AlertCircle, IndianRupee, Wind } from "lucide-react";

export default function EditRoomModal({ isOpen, onClose, room, maxFloors, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    roomNumber: "",
    floor: 0,
    baseRent: "",
    hasAc: false,
  });

  useEffect(() => {
    if (room && isOpen) {
      setFormData({
        roomNumber: room.roomNumber || "",
        floor: room.floor ?? 0,
        baseRent: room.baseRent || "",
        hasAc: Boolean(room.hasAc),
      });
      setErrorMessage("");
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "floor"
          ? parseInt(value, 10) || 0
          : name === "baseRent"
          ? parseFloat(value) || ""
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.put(`/rooms/${room.id}`, {
        roomNumber: formData.roomNumber.trim(),
        floor: formData.floor,
        baseRent: parseFloat(formData.baseRent),
        hasAc: formData.hasAc,
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to update room. Please try again.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Room</h3>
              <p className="text-xs text-slate-500">Update room identifier and pricing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Room Number / Name *
            </label>
            <input
              type="text"
              name="roomNumber"
              required
              value={formData.roomNumber}
              onChange={handleChange}
              placeholder="e.g. 101 or 101-Deluxe"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Floor *
              </label>
              <input
                type="number"
                name="floor"
                min="0"
                max={maxFloors || undefined}
                required
                value={formData.floor}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              />
              {maxFloors && (
                <p className="mt-1 text-[11px] text-slate-400">Max floor: {maxFloors}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Monthly Rent (₹) *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <input
                  type="number"
                  name="baseRent"
                  min="0"
                  step="100"
                  required
                  value={formData.baseRent}
                  onChange={handleChange}
                  placeholder="8500"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* AC Option */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-100/60 transition-all">
              <input
                type="checkbox"
                name="hasAc"
                checked={formData.hasAc}
                onChange={handleChange}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
              />
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Wind className="w-4 h-4 text-cyan-600" />
                Air Conditioned (AC Room)
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
