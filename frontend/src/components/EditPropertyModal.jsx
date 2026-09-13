"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { X, Building2, Loader2, AlertCircle, AlertTriangle, Calendar, CalendarDays } from "lucide-react";

export default function EditPropertyModal({ isOpen, onClose, property, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    totalFloors: 1,
    billingCyclePreference: "ANNIVERSARY",
  });

  useEffect(() => {
    if (property && isOpen) {
      setFormData({
        name: property.name || "",
        address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        totalFloors: property.totalFloors || 1,
        billingCyclePreference: property.billingCyclePreference || "ANNIVERSARY",
      });
      setErrorMessage("");
    }
  }, [property, isOpen]);

  if (!isOpen || !property) return null;

  const initialCycle = property.billingCyclePreference || "ANNIVERSARY";
  const isCycleChanged = formData.billingCyclePreference !== initialCycle;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalFloors" ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        totalFloors: Number(formData.totalFloors),
        billingCyclePreference: formData.billingCyclePreference,
      };

      const response = await api.put(`/properties/${property.id}`, payload);
      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to update property. Please try again.";
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Property</h3>
              <p className="text-xs text-slate-500">Update property details and floors</p>
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

        {/* Modal Form */}
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
              Property Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sunrise Luxury PG"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Address *
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address, landmark"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City *
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Bangalore"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                State *
              </label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Karnataka"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Total Floors *
            </label>
            <input
              type="number"
              name="totalFloors"
              min="1"
              required
              value={formData.totalFloors}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Billing Cycle Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing Cycle Preference *
            </label>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Determines when rent invoices are generated for tenants.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Anniversary */}
              <label
                className={`relative flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.billingCyclePreference === "ANNIVERSARY"
                    ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="billingCyclePreference"
                  value="ANNIVERSARY"
                  checked={formData.billingCyclePreference === "ANNIVERSARY"}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-start gap-2.5 w-full">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                      formData.billingCyclePreference === "ANNIVERSARY"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {formData.billingCyclePreference === "ANNIVERSARY" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-900">
                        Anniversary Billing
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                      Tenants are billed monthly on the exact date they checked in.
                    </p>
                  </div>
                </div>
              </label>

              {/* Option 2: 1st of Month */}
              <label
                className={`relative flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.billingCyclePreference === "FIRST_OF_MONTH"
                    ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="billingCyclePreference"
                  value="FIRST_OF_MONTH"
                  checked={formData.billingCyclePreference === "FIRST_OF_MONTH"}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-start gap-2.5 w-full">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                      formData.billingCyclePreference === "FIRST_OF_MONTH"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {formData.billingCyclePreference === "FIRST_OF_MONTH" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-900">
                        1st of the Month
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                      All tenants are billed on 1st. Move-ins are prorated.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Warning Banner if billing cycle changed */}
          {isCycleChanged && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1 font-medium leading-relaxed">
                Warning: Changing this on an active property will alter the billing schedule for all current tenants starting next month.
              </div>
            </div>
          )}

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
