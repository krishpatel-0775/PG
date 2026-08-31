"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Users,
  Plus,
  ArrowLeft,
  Building2,
  Bed,
  Calendar,
  IndianRupee,
  LogOut,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function AllocationsListPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/allocations");
      setAllocations(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch active allocations.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (allocationId, tenantName) => {
    const confirmed = window.confirm(
      `Are you sure you want to check out ${tenantName || "this tenant"}? This will complete their lease and free the bed.`
    );
    if (!confirmed) return;

    setProcessingId(allocationId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.post(`/allocations/${allocationId}/checkout`);
      setSuccessMessage(`Tenant ${tenantName || ""} checked out successfully.`);
      // Refresh list
      await fetchAllocations();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to process tenant checkout.";
      setErrorMessage(backendMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAllocations = allocations.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.tenantName?.toLowerCase().includes(q) ||
      item.tenantEmail?.toLowerCase().includes(q) ||
      item.propertyName?.toLowerCase().includes(q) ||
      item.roomNumber?.toLowerCase().includes(q) ||
      item.bedNumber?.toLowerCase().includes(q)
    );
  });

  const totalMonthlyRent = allocations.reduce(
    (acc, item) => acc + (Number(item.monthlyRent) || 0),
    0
  );
  const totalDeposits = allocations.reduce(
    (acc, item) => acc + (Number(item.depositAmount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
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
              <span className="text-slate-200">Tenant Allocations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-400" />
              Tenant Allocations
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage active resident leases, bed assignments, and checkouts
            </p>
          </div>

          <Link
            href="/dashboard/allocations/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99] self-start sm:self-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            Allocate New Tenant
          </Link>
        </div>

        {/* Metrics Overview */}
        {!loading && allocations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-400">Active Tenants</div>
              <div className="mt-1 text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-400" />
                {allocations.length}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-400">Monthly Rent Inflow</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400 flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                {totalMonthlyRent.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-400">Total Security Deposits</div>
              <div className="mt-1 text-2xl font-bold text-purple-400 flex items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                ₹{totalDeposits.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        )}

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

        {successMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start gap-3 text-sm animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Search Bar */}
        {allocations.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by tenant name, property, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        )}

        {/* Allocations Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading active allocations...</p>
          </div>
        ) : filteredAllocations.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {searchQuery ? "No allocations match your search" : "No active allocations"}
            </h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching for a different tenant or room number."
                : "No tenants are currently assigned to beds. Allocate a bed to a registered tenant."}
            </p>
            {!searchQuery && (
              <Link
                href="/dashboard/allocations/new"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-sm shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Allocate First Tenant
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tenant</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Room & Bed</th>
                    <th className="px-6 py-4">Monthly Rent / Deposit</th>
                    <th className="px-6 py-4">Check-In Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAllocations.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Tenant Info */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {item.tenantName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.tenantEmail}
                        </div>
                        {item.tenantPhone && (
                          <div className="text-xs text-slate-500">
                            {item.tenantPhone}
                          </div>
                        )}
                      </td>

                      {/* Property */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          {item.propertyName}
                        </div>
                      </td>

                      {/* Room & Bed */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-white">
                            Room {item.roomNumber}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                            {item.bedNumber}
                          </span>
                        </div>
                        {item.floor !== undefined && item.floor !== null && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Floor {item.floor}
                          </div>
                        )}
                      </td>

                      {/* Financials */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">
                          ₹{Number(item.monthlyRent)?.toLocaleString("en-IN")} / mo
                        </div>
                        <div className="text-xs text-slate-400">
                          Deposit: ₹{Number(item.depositAmount)?.toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* Check-In Date */}
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {item.checkInDate}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active Lease
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleCheckout(item.id, item.tenantName)}
                          disabled={processingId === item.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                        >
                          {processingId === item.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Checkout</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
