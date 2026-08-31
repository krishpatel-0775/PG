"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Home,
  Building2,
  Bed,
  Calendar,
  IndianRupee,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Phone,
  Sparkles,
  Wifi,
  Coffee,
  Shield,
  Zap,
} from "lucide-react";

export default function MyRoomPage() {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasNoAllocation, setHasNoAllocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchMyRoom();
  }, []);

  const fetchMyRoom = async () => {
    setLoading(true);
    setErrorMessage("");
    setHasNoAllocation(false);

    try {
      const response = await api.get("/allocations/my");
      setAllocation(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setHasNoAllocation(true);
      } else {
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Unable to load your room allocation.";
        setErrorMessage(backendMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header & Breadcrumb */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link
              href="/dashboard"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-200">My Room & Bed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Home className="w-8 h-8 text-indigo-400" />
            My Room & Bed Details
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View your active PG residency allocation, lease information, and amenities
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Retrieving your room details...</p>
          </div>
        ) : hasNoAllocation || !allocation ? (
          /* Empty / Unallocated State */
          <div className="text-center py-20 px-6 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-xl">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Bed className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              You have not been assigned a bed yet
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Your PG Owner or administrator has not allocated a room or bed to your account. Please contact your property manager to complete your check-in.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-sm shadow-lg shadow-indigo-600/20 transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Active Room Summary Card */
          <div className="space-y-6">
            {/* Main Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                      {allocation.propertyName}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      {allocation.propertyAddress}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Residency
                </span>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Room */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-xs font-medium text-slate-400">Room Number</div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
                    Room {allocation.roomNumber}
                  </div>
                  {allocation.floor !== undefined && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Floor {allocation.floor}
                    </div>
                  )}
                </div>

                {/* Bed */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-xs font-medium text-slate-400">Bed Assigned</div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-indigo-400 flex items-center gap-2">
                    <Bed className="w-5 h-5" />
                    {allocation.bedNumber}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    Allocated to you
                  </div>
                </div>

                {/* Monthly Rent */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-xs font-medium text-slate-400">Monthly Rent</div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-white flex items-center">
                    ₹{Number(allocation.monthlyRent)?.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">per month</div>
                </div>

                {/* Security Deposit */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-xs font-medium text-slate-400">Security Deposit</div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-purple-400 flex items-center">
                    ₹{Number(allocation.depositAmount)?.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Paid on check-in</div>
                </div>
              </div>

              {/* Lease Dates */}
              <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Check-In Date:</span>
                  <span className="font-semibold text-white">
                    {allocation.checkInDate}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Tenant: <span className="text-white font-medium">{allocation.tenantName}</span> ({allocation.tenantEmail})
                </div>
              </div>
            </div>

            {/* Resident Amenities & Services Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Included PG Amenities</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <Wifi className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">High-Speed WiFi</div>
                    <div className="text-[11px] text-slate-500">24/7 Access</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <Coffee className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Daily Meals</div>
                    <div className="text-[11px] text-slate-500">Breakfast & Dinner</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Power Backup</div>
                    <div className="text-[11px] text-slate-500">Inverter Equipped</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">CCTV & Security</div>
                    <div className="text-[11px] text-slate-500">Biometric Entry</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
