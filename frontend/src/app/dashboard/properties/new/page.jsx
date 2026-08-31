"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Building2,
  MapPin,
  Layers,
  Globe,
  Plus,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    totalFloors: 1,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalFloors" ? (value === "" ? "" : parseInt(value, 10)) : value,
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
      await api.post("/properties", {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        totalFloors: Number(formData.totalFloors),
      });

      // Redirect back to properties listing
      router.push("/dashboard/properties");
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to create property. Please verify your details.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link
              href="/dashboard/properties"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Properties
            </Link>
            <span>/</span>
            <span className="text-slate-200">New Property</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" />
            Add New Property
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Register a new PG hostel or residential branch
          </p>
        </div>

        {/* Card Form */}
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
            {/* Property Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Property Name *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="h-5 h-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={150}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunshine Luxury PG"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Street Address *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-5 h-5" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  maxLength={255}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 124, 4th Cross, Koramangala"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>

            {/* City and State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  City *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="h-5 h-5" />
                  </div>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    maxLength={100}
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  State *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="h-5 h-5" />
                  </div>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    maxLength={100}
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Total Floors */}
            <div>
              <label
                htmlFor="totalFloors"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Total Floors *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Layers className="h-5 h-5" />
                </div>
                <input
                  id="totalFloors"
                  name="totalFloors"
                  type="number"
                  min={1}
                  required
                  value={formData.totalFloors}
                  onChange={handleChange}
                  placeholder="e.g. 4"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Specify the maximum number of floors available in this building.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <Link
                href="/dashboard/properties"
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
                    <span>Creating Property...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save Property</span>
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
