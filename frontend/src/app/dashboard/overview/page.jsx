"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Building2,
  Users,
  Bed,
  CheckCircle2,
  IndianRupee,
  AlertTriangle,
  Wrench,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  CreditCard,
  UserPlus,
  Receipt,
  Megaphone,
  TrendingUp,
} from "lucide-react";

export default function OwnerOverviewPage() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchSummary(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/properties");
      const list = response.data || [];
      setProperties(list);
      if (list.length > 0) {
        setSelectedPropertyId(list[0].id.toString());
      } else {
        setLoading(false);
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load properties list.";
      setErrorMessage(backendMessage);
      setLoading(false);
    }
  };

  const fetchSummary = async (propertyId) => {
    setSummaryLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/dashboard/summary/property/${propertyId}`);
      setSummary(response.data);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load property summary metrics.";
      setErrorMessage(backendMessage);
    } finally {
      setSummaryLoading(false);
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(
    (p) => p.id.toString() === selectedPropertyId
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      <div className="space-y-8">
        {/* Header & Property Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
              <Link
                href="/dashboard"
                className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Operations Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              Master Operations Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Live operational metrics, occupancy breakdown, dues, and service ticket triage
            </p>
          </div>

          {/* Property Selector Dropdown */}
          {properties.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Viewing:</span>
              <div className="relative">
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs pr-8"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading master dashboard...</p>
          </div>
        ) : properties.length === 0 ? (
          /* Empty Properties State */
          <div className="text-center py-20 px-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Properties Registered</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Get started by adding your first PG property branch to track occupancy and revenues.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/properties/new"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
              >
                Add New Property
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 4 SUMMARY METRIC CARDS */}
            {summaryLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. OCCUPANCY */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Occupancy Rate
                      </span>
                      <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                        {summary.occupiedBeds}{" "}
                        <span className="text-xs font-medium text-slate-500">
                          / {summary.totalBeds} Beds
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Progress Bar Indicator */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Occupancy</span>
                      <span className="font-bold text-indigo-600">
                        {summary.occupancyRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(summary.occupancyRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. VACANCIES */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Vacancies
                      </span>
                      <div className="mt-2 text-2xl font-bold text-emerald-600 tracking-tight flex items-center gap-1">
                        <span>{summary.vacantBeds}</span>
                        <span className="text-xs font-medium text-slate-500">
                          Available
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">
                    {summary.vacantBeds > 0
                      ? `${summary.vacantBeds} beds open for instant tenant allocation`
                      : "100% capacity reached. No vacant beds."}
                  </p>
                </div>

                {/* 3. PENDING REVENUE */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pending Revenue
                      </span>
                      <div className="mt-2 text-2xl font-bold text-rose-600 tracking-tight flex items-center gap-0.5">
                        <IndianRupee className="w-5 h-5 flex-shrink-0" />
                        <span>{Number(summary.totalPendingRent)?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">
                    Outstanding rent across unpaid active invoices
                  </p>
                </div>

                {/* 4. ACTION ITEMS (OPEN COMPLAINTS) */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Action Items
                      </span>
                      <div className="mt-2 text-2xl font-bold text-amber-600 tracking-tight flex items-center gap-1">
                        <span>{summary.openComplaintsCount}</span>
                        <span className="text-xs font-medium text-slate-500">
                          Open Tickets
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">
                    {summary.openComplaintsCount > 0
                      ? "Maintenance issues requiring staff attention"
                      : "Zero open tickets. Facility in order."}
                  </p>
                </div>
              </div>
            ) : null}

            {/* QUICK-ACTION NAVIGATION BUTTONS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Management Quick Actions</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Assign New Tenant */}
                <Link
                  href="/dashboard/allocations/new"
                  className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Assign New Tenant
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Allocate a vacant bed with phone sync
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* 2. Collect Rent / Finance */}
                <Link
                  href="/dashboard/finance"
                  className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Collect Rent
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Record payments & view dues
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* 3. View Complaints */}
                <Link
                  href="/dashboard/admin-complaints"
                  className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-2xl p-5 flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        View Complaints
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Triage tickets on Kanban board
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
