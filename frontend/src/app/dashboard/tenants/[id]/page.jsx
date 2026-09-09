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
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Shield,
  CreditCard,
  ExternalLink,
  DoorClosed,
  AlertTriangle,
  FileText,
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
      <div className="p-8 min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading 360° Tenant Profile...</p>
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard/tenants"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tenants Directory
        </Link>

        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <h3 className="font-bold text-base text-rose-900">Unable to Load Tenant Profile</h3>
          </div>
          <p className="text-sm text-rose-700">{errorMessage || "Tenant details could not be found."}</p>
          <div>
            <button
              type="button"
              onClick={fetchTenantProfile}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActiveStay = profile.allocationStatus === "ACTIVE";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* BEGIN: Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/dashboard"
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href="/dashboard/tenants"
              className="hover:text-indigo-600 transition-colors"
            >
              Tenant Directory
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{profile.name || "Profile"}</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/dashboard/tenants"
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600 hover:text-indigo-600 transition shadow-xs"
              title="Back to Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Tenant 360° Profile
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-600 shadow-xs">
            CRM-UID #{profile.tenantId}
          </span>
          <Link
            href="/dashboard/finance"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Finance Hub
          </Link>
        </div>
      </div>
      {/* END: Header & Breadcrumb */}

      {/* BEGIN: Top Profile Banner Card */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Subtle Accent Background Blur */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar Pill */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-md shadow-indigo-100 flex-shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "T"}
            </div>

            {/* Personal Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {profile.name || "Unknown Tenant"}
                </h2>

                {/* Account Type Badge */}
                {profile.isShadowUser ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <Shield className="w-3.5 h-3.5" />
                    Shadow Profile (Offline)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Registered App User
                  </span>
                )}
              </div>

              {/* Contact Information Chips */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 flex-wrap">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.phone}</span>
                  </a>
                )}

                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stay Status Overview Badge */}
          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Stay Status
            </span>
            <div>
              {isActiveStay ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Currently Active Stay
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Checked Out / Past
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* END: Top Profile Banner Card */}

      {/* BEGIN: Financial KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total Invoiced */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoiced Amount
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ₹{formatCurrency(financialSummary.totalBilled)}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Across all billing cycles</p>
        </div>

        {/* Card 2: Total Amount Paid */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Amount Paid
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            ₹{formatCurrency(financialSummary.totalPaid)}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Settled receipts</p>
        </div>

        {/* Card 3: Current Outstanding Balance */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Outstanding Balance
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                financialSummary.totalDue > 0
                  ? "bg-rose-50 text-rose-600"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {financialSummary.totalDue > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold tracking-tight ${
                financialSummary.totalDue > 0 ? "text-rose-600" : "text-slate-900"
              }`}
            >
              ₹{formatCurrency(financialSummary.totalDue)}
            </div>
            {financialSummary.totalDue > 0 && (
              <Link
                href="/dashboard/finance"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition"
              >
                Collect
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {financialSummary.totalDue > 0 ? "Pending dues collection" : "All cleared 🎉"}
          </p>
        </div>
      </section>
      {/* END: Financial KPI Cards Grid */}

      {/* BEGIN: Two Column Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column (1/3): Stay & Lease Details */}
        <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Stay &amp; Lease Details</h3>
              <p className="text-xs text-slate-500">Current / latest bed lease agreement</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* PG Property */}
            <div>
              <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                PG Property
              </span>
              <span className="font-bold text-slate-900 mt-1 block text-base">
                {profile.propertyName || "Not Allocated"}
              </span>
            </div>

            {/* Room & Bed */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                  Room Number
                </span>
                <span className="inline-block font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md text-xs mt-1">
                  {profile.roomNumber ? `Room ${profile.roomNumber}` : "-"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                  Bed Assigned
                </span>
                <span className="inline-block font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md text-xs mt-1">
                  {profile.bedNumber ? `Bed ${profile.bedNumber}` : "-"}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                  Check-in Date
                </span>
                <span className="text-slate-800 mt-1 block text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(profile.checkInDate)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                  Check-out Date
                </span>
                <span className="text-slate-800 mt-1 block text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {profile.checkOutDate ? formatDate(profile.checkOutDate) : "Present"}
                </span>
              </div>
            </div>

            {/* Financial Terms */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                  Monthly Rent
                </span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                  ₹{formatCurrency(profile.monthlyRent)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
                  Deposit Amount
                </span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                  ₹{formatCurrency(profile.depositAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2/3): Billing & Invoice History */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Billing &amp; Invoice History</h3>
                <p className="text-xs text-slate-500">All invoices generated for this tenant</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
              {profile.financialHistory?.length || 0} Invoices
            </span>
          </div>

          {/* Invoices Table */}
          {!profile.financialHistory || profile.financialHistory.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No Invoices Found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No rent billing cycles or invoices have been generated for this tenant yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">Invoice #</th>
                    <th scope="col" className="px-4 py-3.5">Invoice Date</th>
                    <th scope="col" className="px-4 py-3.5">Due Date</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Total</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Paid</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {profile.financialHistory.map((invoice) => {
                    const isPaid = invoice.status === "PAID";
                    const isPartial = invoice.status === "PARTIALLY_PAID";
                    const isUnpaid = invoice.status === "UNPAID";

                    return (
                      <tr
                        key={invoice.invoiceId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-mono font-semibold text-slate-600">
                          INV-{String(invoice.invoiceId).padStart(6, "0")}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 text-right">
                          ₹{formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-emerald-600 font-semibold text-right">
                          ₹{formatCurrency(invoice.amountPaid)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              PAID
                            </span>
                          )}
                          {isPartial && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              PARTIAL
                            </span>
                          )}
                          {isUnpaid && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
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
      </section>
      {/* END: Two Column Section */}
    </div>
  );
}
