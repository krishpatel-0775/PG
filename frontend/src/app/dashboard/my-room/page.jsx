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
  Droplets,
  User,
  Wrench,
  Receipt,
  Layers,
  Check,
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">My Room & Bed</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Room & Bed Details
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                View your active PG residency allocation, lease information, and amenities
              </p>
            </div>
          </div>
        </div>

        {allocation && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/dashboard/my-complaints"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
              <span>Report Room Issue</span>
            </Link>
            <Link
              href="/dashboard/my-dues"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-200 transition-all cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Rent & Dues</span>
            </Link>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-xs sm:text-sm shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Retrieving your room details...</p>
        </div>
      ) : hasNoAllocation || !allocation ? (
        /* Empty / Unallocated State */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-14 shadow-xs text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Bed className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              You have not been assigned a bed yet
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Your PG Owner or administrator has not allocated a room or bed to your account yet. Please contact your property manager to complete your check-in.
            </p>
          </div>

          {/* Helpful Information Box */}
          <div className="max-w-md mx-auto bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              What happens next?
            </div>
            <ul className="space-y-1.5 list-none pl-1">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>The property manager assigns your room and bed from the admin portal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Your monthly rent, amenities, and security deposit details will appear right here.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>You can pay your invoices and raise maintenance tickets directly online.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm shadow-xs shadow-indigo-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Active Room Summary Card */
        <div className="space-y-6">
          {/* Main Hero Property Banner */}
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {allocation.propertyName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {allocation.propertyAddress}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active Residency
              </span>
            </div>

            {/* Grid 4 Key Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Room Number */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 transition-all">
                <div className="text-xs font-semibold text-slate-500">Room Number</div>
                <div className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Room {allocation.roomNumber}
                </div>
                {allocation.floor !== undefined && (
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    Floor {allocation.floor}
                  </div>
                )}
              </div>

              {/* Bed Assigned */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 sm:p-5 hover:bg-indigo-50/80 transition-all">
                <div className="text-xs font-semibold text-indigo-600">Bed Assigned</div>
                <div className="mt-1 text-xl sm:text-2xl font-extrabold text-indigo-700 tracking-tight flex items-center gap-2">
                  <Bed className="w-5 h-5 text-indigo-600" />
                  {allocation.bedNumber}
                </div>
                <div className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Allocated to you
                </div>
              </div>

              {/* Monthly Rent */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 transition-all">
                <div className="text-xs font-semibold text-slate-500">Monthly Rent</div>
                <div className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
                  ₹{Number(allocation.monthlyRent)?.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">per month cycle</div>
              </div>

              {/* Security Deposit */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 transition-all">
                <div className="text-xs font-semibold text-slate-500">Security Deposit</div>
                <div className="mt-1 text-xl sm:text-2xl font-extrabold text-purple-700 tracking-tight flex items-center">
                  ₹{Number(allocation.depositAmount)?.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Paid on check-in</div>
              </div>
            </div>

            {/* Lease & Tenant Metadata Bar */}
            <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-indigo-600 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Check-In Date</span>
                  <span className="font-bold text-slate-900">
                    {allocation.checkInDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Assigned Resident</span>
                  <span className="font-semibold text-slate-900">
                    {allocation.tenantName}
                  </span>
                  <span className="text-slate-500 text-xs ml-1">
                    ({allocation.tenantEmail})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resident Amenities & Services Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Included PG Amenities & Utilities</h3>
                  <p className="text-xs text-slate-500">Complimentary services included in your residential package</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">High-Speed WiFi</div>
                  <div className="text-[11px] text-slate-500">24/7 Unlimited Access</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Daily Meals</div>
                  <div className="text-[11px] text-slate-500">Breakfast & Dinner</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Power Backup</div>
                  <div className="text-[11px] text-slate-500">Inverter & Generator</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">CCTV & Security</div>
                  <div className="text-[11px] text-slate-500">24/7 Monitored Access</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Housekeeping</div>
                  <div className="text-[11px] text-slate-500">Regular Room Cleaning</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">RO Water</div>
                  <div className="text-[11px] text-slate-500">Clean Purified Water</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
