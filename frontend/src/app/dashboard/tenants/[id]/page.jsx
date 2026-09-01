"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building2,
  Bed,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Shield,
  CreditCard,
} from "lucide-react";

export default function TenantProfilePage({ params }) {
  // Unwrap params using React.use() for Next.js App Router compatibility
  const resolvedParams = use(params);
  const tenantId = resolvedParams.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (tenantId) {
      fetchTenantProfile();
    }
  }, [tenantId]);

  const fetchTenantProfile = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/directory/tenants/${tenantId}`);
      setProfile(response.data);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load tenant profile.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const financialSummary = useMemo(() => {
    if (!profile || !profile.financialHistory) {
      return { totalBilled: 0, totalPaid: 0, totalDue: 0 };
    }

    const totalBilled = profile.financialHistory.reduce(
      (acc, inv) => acc + (Number(inv.totalAmount) || 0),
      0
    );
    const totalPaid = profile.financialHistory.reduce(
      (acc, inv) => acc + (Number(inv.amountPaid) || 0),
      0
    );
    const totalDue = Math.max(0, totalBilled - totalPaid);

    return { totalBilled, totalPaid, totalDue };
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-9 h-9 animate-spin text-indigo-400" />
        <p className="text-sm font-medium text-slate-400">Loading 360° Tenant Profile...</p>
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Link
            href="/dashboard/tenants"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tenants Directory
          </Link>

          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 space-y-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base">Unable to Load Tenant Profile</h3>
            </div>
            <p className="text-sm text-rose-300/90">{errorMessage || "Tenant details not found."}</p>
            <div>
              <button
                type="button"
                onClick={fetchTenantProfile}
                className="px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActiveStay = profile.allocationStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation / Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            href="/dashboard/tenants"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Tenants Directory
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              CRM-UID #{profile.tenantId}
            </span>
          </div>
        </div>

        {/* Top Profile Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-xl shadow-indigo-600/30 flex-shrink-0">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "T"}
              </div>

              {/* Personal Details */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {profile.name || "Unknown Tenant"}
                  </h1>

                  {/* Registered vs Shadow User Badge */}
                  {profile.isShadowUser ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield className="w-3.5 h-3.5" />
                      Shadow Profile (Offline)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Registered App User
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-400 flex-wrap pt-1">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{profile.phone}</span>
                    </a>
                  )}

                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{profile.email}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stay Status Overview Tag */}
            <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Stay Status
              </span>
              <div className="mt-1">
                {isActiveStay ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-950/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Currently Active Stay
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Checked Out / Past
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Invoiced Amount
            </span>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              ₹{formatCurrency(financialSummary.totalBilled)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Across all billing cycles</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Amount Paid
            </span>
            <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">
              ₹{formatCurrency(financialSummary.totalPaid)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Settled receipts</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Current Outstanding Balance
            </span>
            <div
              className={`mt-2 text-2xl font-bold tracking-tight ${
                financialSummary.totalDue > 0 ? "text-rose-400" : "text-white"
              }`}
            >
              ₹{formatCurrency(financialSummary.totalDue)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {financialSummary.totalDue > 0 ? "Pending dues collection" : "All cleared 🎉"}
            </p>
          </div>
        </div>

        {/* Two Columns: Stay Details (Left) and Payment History (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Stay Details Card */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Stay & Lease Details</h3>
                <p className="text-xs text-slate-400">Current / latest bed lease agreement</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {/* Property */}
              <div>
                <span className="text-xs text-slate-400 block font-medium">PG Property</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {profile.propertyName || "Not Allocated"}
                </span>
              </div>

              {/* Room & Bed */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Room Number</span>
                  <span className="font-semibold text-indigo-300 mt-0.5 block">
                    {profile.roomNumber ? `Room ${profile.roomNumber}` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Bed Assigned</span>
                  <span className="font-semibold text-indigo-300 mt-0.5 block">
                    {profile.bedNumber ? `Bed ${profile.bedNumber}` : "-"}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Check-in Date</span>
                  <span className="text-slate-200 mt-0.5 block text-xs font-semibold">
                    {formatDate(profile.checkInDate)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Check-out Date</span>
                  <span className="text-slate-200 mt-0.5 block text-xs font-semibold">
                    {profile.checkOutDate ? formatDate(profile.checkOutDate) : "Present"}
                  </span>
                </div>
              </div>

              {/* Financial Terms */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Monthly Rent</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    ₹{formatCurrency(profile.monthlyRent)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Deposit Amount</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    ₹{formatCurrency(profile.depositAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Invoices & Payment History */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Billing & Invoice History</h3>
                  <p className="text-xs text-slate-400">All invoices generated for this tenant</p>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {profile.financialHistory?.length || 0} Invoices
              </span>
            </div>

            {/* Invoices List / Table */}
            {!profile.financialHistory || profile.financialHistory.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No Invoices Found</p>
                <p className="text-xs text-slate-500 mt-1">
                  No rent billing cycles have been generated for this tenant yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-4 py-3">Invoice #</th>
                      <th scope="col" className="px-4 py-3">Invoice Date</th>
                      <th scope="col" className="px-4 py-3">Due Date</th>
                      <th scope="col" className="px-4 py-3">Total Amount</th>
                      <th scope="col" className="px-4 py-3">Amount Paid</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {profile.financialHistory.map((invoice) => {
                      const isPaid = invoice.status === "PAID";
                      const isPartial = invoice.status === "PARTIALLY_PAID";
                      const isUnpaid = invoice.status === "UNPAID";

                      return (
                        <tr
                          key={invoice.invoiceId}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-slate-400">
                            INV-{String(invoice.invoiceId).padStart(6, "0")}
                          </td>
                          <td className="px-4 py-3 text-slate-200">
                            {formatDate(invoice.invoiceDate)}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            ₹{formatCurrency(invoice.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-emerald-400 font-semibold">
                            ₹{formatCurrency(invoice.amountPaid)}
                          </td>
                          <td className="px-4 py-3">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                PAID
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                PARTIAL
                              </span>
                            )}
                            {isUnpaid && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertCircle className="w-3 h-3" />
                                UNPAID
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
