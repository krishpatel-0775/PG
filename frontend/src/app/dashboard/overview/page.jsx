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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Property Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link
                href="/dashboard"
                className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-200">Owner Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400" />
              Master Operations Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Live operational metrics, occupancy breakdown, dues, and service ticket triage
            </p>
          </div>

          {/* Property Selector Dropdown */}
          {properties.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Viewing:</span>
              <div className="relative">
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-lg pr-8"
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
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading master dashboard...</p>
          </div>
        ) : properties.length === 0 ? (
          /* Empty Properties State */
          <div className="text-center py-20 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Properties Registered</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Get started by adding your first PG property branch to track occupancy and revenues.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/properties/new"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
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
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. OCCUPANCY */}
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4 group hover:border-indigo-500/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Occupancy Rate
                      </span>
                      <div className="mt-2 text-2xl font-extrabold text-white">
                        {summary.occupiedBeds}{" "}
                        <span className="text-sm font-normal text-slate-400">
                          / {summary.totalBeds} Beds
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Progress Bar Indicator */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Occupancy</span>
                      <span className="font-bold text-indigo-400">
                        {summary.occupancyRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(summary.occupancyRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. VACANCIES */}
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4 group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Vacancies
                      </span>
                      <div className="mt-2 text-2xl font-extrabold text-emerald-400 flex items-center gap-1">
                        <span>{summary.vacantBeds}</span>
                        <span className="text-sm font-normal text-slate-400">
                          Available
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">
                    {summary.vacantBeds > 0
                      ? `${summary.vacantBeds} beds open for instant tenant allocation`
                      : "100% capacity reached. No vacant beds."}
                  </p>
                </div>

                {/* 3. PENDING REVENUE */}
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4 group hover:border-rose-500/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Pending Revenue
                      </span>
                      <div className="mt-2 text-2xl font-extrabold text-rose-400 flex items-center gap-0.5">
                        <IndianRupee className="w-5 h-5 flex-shrink-0" />
                        <span>{Number(summary.totalPendingRent)?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">
                    Outstanding rent across unpaid active invoices
                  </p>
                </div>

                {/* 4. ACTION ITEMS (OPEN COMPLAINTS) */}
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4 group hover:border-amber-500/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Action Items
                      </span>
                      <div className="mt-2 text-2xl font-extrabold text-amber-400 flex items-center gap-1">
                        <span>{summary.openComplaintsCount}</span>
                        <span className="text-sm font-normal text-slate-400">
                          Open Tickets
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
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
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Management Quick Actions</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Assign New Tenant */}
                <Link
                  href="/dashboard/allocations/new"
                  className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex items-center justify-between group hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                        Assign New Tenant
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Allocate a vacant bed with phone sync
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* 2. Collect Rent / Finance */}
                <Link
                  href="/dashboard/finance"
                  className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex items-center justify-between group hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        Collect Rent
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Record payments & view dues
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>

                {/* 3. View Complaints */}
                <Link
                  href="/dashboard/admin-complaints"
                  className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex items-center justify-between group hover:shadow-lg hover:shadow-amber-500/5 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        View Complaints
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Triage tickets on Kanban board
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
