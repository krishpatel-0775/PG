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
    switch (type) {
      case "SINGLE":
        return "1 bed will be automatically generated (e.g. 101-A)";
      case "DOUBLE":
        return "2 beds will be automatically generated (e.g. 101-A, 101-B)";
      case "TRIPLE":
        return "3 beds will be automatically generated (e.g. 101-A, 101-B, 101-C)";
      case "FOUR_SHARING":
        return "4 beds will be automatically generated (e.g. 101-A to 101-D)";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link
              href={`/dashboard/properties/${propertyId}`}
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Property Details
            </Link>
            <span>/</span>
            <span className="text-slate-200">Add Room</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Bed className="w-8 h-8 text-indigo-400" />
            Add Room to Property
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Define room parameters and automatically provision beds
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          {/* Error message alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top duration-200"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
            {/* Room Number & Floor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="roomNumber"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Room Number *
                </label>
                <div className="relative rounded-xl shadow-sm">
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
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="floor"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Floor Number *
                </label>
                <div className="relative rounded-xl shadow-sm">
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
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label
                htmlFor="roomType"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Room Sharing Type *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <select
                  id="roomType"
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm cursor-pointer"
                >
                  <option value="SINGLE" className="bg-slate-900 text-white">
                    SINGLE (1 Bed)
                  </option>
                  <option value="DOUBLE" className="bg-slate-900 text-white">
                    DOUBLE (2 Beds)
                  </option>
                  <option value="TRIPLE" className="bg-slate-900 text-white">
                    TRIPLE (3 Beds)
                  </option>
                  <option value="FOUR_SHARING" className="bg-slate-900 text-white">
                    FOUR SHARING (4 Beds)
                  </option>
                </select>
              </div>
              <p className="mt-1.5 text-xs text-indigo-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                {getBedCountHint(formData.roomType)}
              </p>
            </div>

            {/* Base Rent */}
            <div>
              <label
                htmlFor="baseRent"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Base Rent (Monthly ₹) *
              </label>
              <div className="relative rounded-xl shadow-sm">
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
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>

            {/* AC Checkbox / Toggle */}
            <div className="pt-2">
              <label className="relative flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <input
                  id="hasAc"
                  name="hasAc"
                  type="checkbox"
                  checked={formData.hasAc}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-200">
                    Air Conditioning (AC Available)
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <Link
                href={`/dashboard/properties/${propertyId}`}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99] text-sm"
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
    </div>
  );
}
