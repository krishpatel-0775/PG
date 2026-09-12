"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Bed,
  Layers,
  IndianRupee,
  Wind,
  Plus,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Info,
} from "lucide-react";

const ROOM_SHARING_OPTIONS = [
  { value: "SINGLE", label: "SINGLE (1 Bed)", count: 1 },
  { value: "DOUBLE", label: "DOUBLE (2 Beds)", count: 2 },
  { value: "TRIPLE", label: "TRIPLE (3 Beds)", count: 3 },
  { value: "FOUR_SHARING", label: "FOUR SHARING (4 Beds)", count: 4 },
  { value: "FIVE_SHARING", label: "FIVE SHARING (5 Beds)", count: 5 },
  { value: "SIX_SHARING", label: "SIX SHARING (6 Beds)", count: 6 },
  { value: "SEVEN_SHARING", label: "SEVEN SHARING (7 Beds)", count: 7 },
  { value: "EIGHT_SHARING", label: "EIGHT SHARING (8 Beds)", count: 8 },
  { value: "NINE_SHARING", label: "NINE SHARING (9 Beds)", count: 9 },
  { value: "TEN_SHARING", label: "TEN SHARING (10 Beds)", count: 10 },
];

export default function AddRoomPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id;

  const [formData, setFormData] = useState({
    roomNumber: "",
    floor: 1,
    roomType: "DOUBLE",
    baseRent: "",
    hasAc: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "floor"
          ? value === "" ? "" : parseInt(value, 10)
          : name === "baseRent"
          ? value === "" ? "" : parseFloat(value)
          : value,
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await api.post(`/properties/${propertyId}/rooms`, {
        roomNumber: formData.roomNumber.trim(),
        floor: Number(formData.floor),
        roomType: formData.roomType,
        baseRent: Number(formData.baseRent),
        hasAc: Boolean(formData.hasAc),
      });

      // Redirect back to property details page
      router.push(`/dashboard/properties/${propertyId}`);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to add room. Please verify your details.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const getBedCountHint = (type) => {
    const option = ROOM_SHARING_OPTIONS.find((opt) => opt.value === type);
    if (!option) return "";
    if (option.count === 1) {
      return "1 bed will be automatically generated (e.g. 101-A)";
    }
    const endLetter = String.fromCharCode(65 + option.count - 1);
    return `${option.count} beds will be automatically generated (e.g. 101-A to 101-${endLetter})`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full pb-16">
      {/* Navigation & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
          <Link
            href={`/dashboard/properties/${propertyId}`}
            className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Property Details
          </Link>
          <span>/</span>
          <span className="text-slate-900">Add Room</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Add Room to Property
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Define room parameters and automatically provision beds
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 sm:p-8">
        {/* Error message alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top duration-200"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
          {/* Room Number & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="roomNumber"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Room Number *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Bed className="h-5 h-5" />
                </div>
                <input
                  id="roomNumber"
                  name="roomNumber"
                  type="text"
                  required
                  maxLength={20}
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. 101"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="floor"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Floor Number *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Layers className="h-5 h-5" />
                </div>
                <input
                  id="floor"
                  name="floor"
                  type="number"
                  min={0}
                  required
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="e.g. 1"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label
              htmlFor="roomType"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Room Sharing Type *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <select
                id="roomType"
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
              >
                {ROOM_SHARING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{getBedCountHint(formData.roomType)}</span>
            </div>
          </div>

          {/* Base Rent */}
          <div>
            <label
              htmlFor="baseRent"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Base Rent (Monthly ₹) *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <span className="text-sm font-bold text-slate-400">₹</span>
              </div>
              <input
                id="baseRent"
                name="baseRent"
                type="number"
                step="0.01"
                min={0}
                required
                value={formData.baseRent}
                onChange={handleChange}
                placeholder="e.g. 7500"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* AC Checkbox / Toggle */}
          <div>
            <label className="relative flex items-center gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 cursor-pointer transition-all">
              <input
                id="hasAc"
                name="hasAc"
                type="checkbox"
                checked={formData.hasAc}
                onChange={handleChange}
                className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-semibold text-slate-800">
                  Air Conditioning (AC Available)
                </span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <Link
              href={`/dashboard/properties/${propertyId}`}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 shadow-xs transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all active:scale-[0.99] text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding Room & Beds...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
