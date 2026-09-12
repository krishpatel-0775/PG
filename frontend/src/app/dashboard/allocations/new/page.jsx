"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Users,
  Bed,
  Calendar,
  IndianRupee,
  Plus,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Info,
} from "lucide-react";

export default function NewAllocationPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    tenantId: "",
    bedId: "",
    checkInDate: new Date().toLocaleDateString("en-CA"),
    depositAmount: "",
    monthlyRent: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "tenantId" || name === "bedId"
          ? value === "" ? "" : parseInt(value, 10)
          : name === "depositAmount" || name === "monthlyRent"
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
      await api.post("/allocations", {
        tenantId: Number(formData.tenantId),
        bedId: Number(formData.bedId),
        checkInDate: formData.checkInDate,
        depositAmount: Number(formData.depositAmount),
        monthlyRent: Number(formData.monthlyRent),
      });

      // Redirect back to allocations listing
      router.push("/dashboard/allocations");
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to allocate bed. Please verify Tenant ID and Bed availability.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full pb-16">
      {/* Navigation & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
          <Link
            href="/dashboard/allocations"
            className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Allocations
          </Link>
          <span>/</span>
          <span className="text-slate-900">New Allocation</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Allocate Bed to Tenant
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Assign a vacant bed to a registered tenant and activate their rental lease
            </p>
          </div>
        </div>
      </div>

      {/* Card Form */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 sm:p-8">
        {/* Error alert */}
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
          {/* Tenant ID and Bed ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tenantId"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Tenant User ID *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Users className="h-5 h-5" />
                </div>
                <input
                  id="tenantId"
                  name="tenantId"
                  type="number"
                  min={1}
                  required
                  value={formData.tenantId}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                User must have ROLE_TENANT
              </p>
            </div>

            <div>
              <label
                htmlFor="bedId"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Bed ID *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Bed className="h-5 h-5" />
                </div>
                <input
                  id="bedId"
                  name="bedId"
                  type="number"
                  min={1}
                  required
                  value={formData.bedId}
                  onChange={handleChange}
                  placeholder="e.g. 12"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Must be in VACANT state
              </p>
            </div>
          </div>

          {/* Check-In Date */}
          <div>
            <label
              htmlFor="checkInDate"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Check-In Date *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-5 h-5" />
              </div>
              <input
                id="checkInDate"
                name="checkInDate"
                type="date"
                required
                value={formData.checkInDate}
                onChange={handleChange}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Deposit and Monthly Rent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="depositAmount"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Security Deposit (₹) *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="text-sm font-bold text-slate-400">₹</span>
                </div>
                <input
                  id="depositAmount"
                  name="depositAmount"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={formData.depositAmount}
                  onChange={handleChange}
                  placeholder="e.g. 10000"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="monthlyRent"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Monthly Rent (₹) *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="text-sm font-bold text-slate-400">₹</span>
                </div>
                <input
                  id="monthlyRent"
                  name="monthlyRent"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={formData.monthlyRent}
                  onChange={handleChange}
                  placeholder="e.g. 8000"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-800">
              <Info className="w-4 h-4 text-indigo-600" />
              Automatic Provisioning
            </div>
            <p className="leading-relaxed">
              Submitting this allocation will mark the selected bed as <strong>OCCUPIED</strong> and bind the tenant to this PG branch.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <Link
              href="/dashboard/allocations"
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
                  <span>Allocating Bed...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Confirm Allocation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
