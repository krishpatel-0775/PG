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
  Clock,
  LogOut,
  X,
  Info,
} from "lucide-react";

export default function MyRoomPage() {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasNoAllocation, setHasNoAllocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Move-Out Notice Flow State
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [plannedCheckoutDate, setPlannedCheckoutDate] = useState("");
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeError, setNoticeError] = useState("");
  const [noticeSuccess, setNoticeSuccess] = useState("");

  useEffect(() => {
    fetchMyRoom();
  }, []);

  const getMinNoticeDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDaysRemaining = (targetDateStr) => {
    if (!targetDateStr) return null;
    // Append T00:00:00 to parse in local timezone rather than UTC
    const target = new Date(`${targetDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleServeNotice = async () => {
    if (!plannedCheckoutDate) {
      setNoticeError("Please select your planned move-out date.");
      return;
    }
    const minDate = getMinNoticeDate();
    if (plannedCheckoutDate < minDate) {
      setNoticeError(`Move-out date must be at least 30 days from today (on or after ${minDate}).`);
      return;
    }

    setNoticeLoading(true);
    setNoticeError("");
    try {
      const res = await api.post(`/allocations/${allocation.id}/notice`, {
        plannedCheckoutDate: plannedCheckoutDate,
      });
      setAllocation(res.data);
      setIsNoticeModalOpen(false);
      setNoticeSuccess("Your move-out request has been submitted and is awaiting approval from your property owner.");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit move-out notice.";
      setNoticeError(msg);
    } finally {
      setNoticeLoading(false);
    }
  };

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
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {allocation.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => {
                  setPlannedCheckoutDate(getMinNoticeDate());
                  setNoticeError("");
                  setIsNoticeModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-xs transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Request Move-Out</span>
              </button>
            )}

            {allocation.status === "NOTICE_REQUESTED" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>Notice Awaiting Approval</span>
              </div>
            )}

            {allocation.status === "NOTICE_SERVED" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Notice Approved</span>
              </div>
            )}

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

      {/* Success Notification Alert */}
      {noticeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{noticeSuccess}</span>
          </div>
          <button
            onClick={() => setNoticeSuccess("")}
            className="text-emerald-700 hover:opacity-80 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Notice Rejection Alert if present */}
      {allocation?.noticeRejectionReason && allocation?.status === "ACTIVE" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">Previous Move-Out Request Declined</div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Reason: {allocation.noticeRejectionReason}
            </p>
          </div>
        </div>
      )}

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

              {allocation.status === "NOTICE_REQUESTED" ? (
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                    Move-out requested for {allocation.plannedCheckoutDate}
                  </span>
                  <span className="text-[11px] font-semibold text-purple-700">
                    Awaiting Owner Review
                  </span>
                </div>
              ) : allocation.status === "NOTICE_SERVED" ? (
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Move-out planned for {allocation.plannedCheckoutDate}
                  </span>
                  {getDaysRemaining(allocation.plannedCheckoutDate) !== null && (
                    <span className="text-[11px] font-semibold text-amber-700">
                      {getDaysRemaining(allocation.plannedCheckoutDate)} days remaining
                    </span>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Active Residency
                </span>
              )}
            </div>

            {/* Banner for NOTICE_REQUESTED */}
            {allocation.status === "NOTICE_REQUESTED" && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-900 flex items-center gap-2">
                      <span>Move-Out Notice Pending Owner Approval</span>
                    </div>
                    <p className="text-xs text-purple-800/90 mt-1 leading-relaxed">
                      Your move-out request for <strong>{allocation.plannedCheckoutDate}</strong> is under review. Your PG owner will approve the notice and confirm how your deposit will be handled (rent offset or checkout refund).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Banner for NOTICE_SERVED */}
            {allocation.status === "NOTICE_SERVED" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <span>Move-Out Notice Approved</span>
                      {getDaysRemaining(allocation.plannedCheckoutDate) !== null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono font-bold">
                          {getDaysRemaining(allocation.plannedCheckoutDate)} days left
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                      {allocation.depositHandlingPolicy === "OFFSET_RENT" ? (
                        <>
                          <strong>Deposit Policy: Rent Offset.</strong> Your security deposit of <strong>₹{Number(allocation.depositAmount).toLocaleString("en-IN")}</strong> will automatically offset upcoming rent invoice(s). Any remaining balance will be settled on checkout day.
                        </>
                      ) : (
                        <>
                          <strong>Deposit Policy: Refund at Checkout.</strong> Please continue paying monthly rent invoices normally. Your full security deposit (₹{Number(allocation.depositAmount).toLocaleString("en-IN")}) will be settled and refunded on checkout day after inspection.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

      {/* Move-Out Request Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Serve Move-Out Notice</h3>
                  <p className="text-xs text-slate-400">Lease termination & deposit offset</p>
                </div>
              </div>
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                disabled={noticeLoading}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              {/* Notice Policy Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-800">
                  <Info className="w-4 h-4 text-amber-600" />
                  Standard Notice Policy
                </div>
                <p className="text-xs leading-relaxed text-amber-800/90">
                  Standard notice period is <strong>30 days</strong>. If you serve 30-day notice, your security deposit will automatically offset your final month&apos;s rent invoice.
                </p>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Proposed Move-Out Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={getMinNoticeDate()}
                  value={plannedCheckoutDate}
                  onChange={(e) => {
                    setPlannedCheckoutDate(e.target.value);
                    setNoticeError("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Earliest permissible move-out date: <strong>{getMinNoticeDate()}</strong> (30 days from today)
                </p>
              </div>

              {/* Notice Error */}
              {noticeError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{noticeError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsNoticeModalOpen(false)}
                disabled={noticeLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleServeNotice}
                disabled={noticeLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 transition-all shadow-xs shadow-rose-200 cursor-pointer"
              >
                {noticeLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Notice...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Confirm & Submit Notice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
