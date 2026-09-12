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
  Clock,
} from "lucide-react";
import CheckoutClearanceModal from "@/components/CheckoutClearanceModal";

export default function AllocationsListPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Clearance Modal State
  const [selectedClearanceAlloc, setSelectedClearanceAlloc] = useState(null);
  const [isClearanceOpen, setIsClearanceOpen] = useState(false);

  const handleClearanceSuccess = (data) => {
    setSuccessMessage(`Bed ${data.bedNumber || ""} is now VACANT • Clearance & settlement finalized for ${data.tenantName || "tenant"}.`);
    fetchAllocations();
  };

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Navigation & Header */}
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
            <span className="text-slate-900">Tenant Allocations</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Tenant Allocations
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Manage active resident leases, bed assignments, and checkouts
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/allocations/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.99] self-start sm:self-auto text-sm"
        >
          <Plus className="w-4 h-4" />
          Allocate New Tenant
        </Link>
      </div>

      {/* Metrics Overview */}
      {!loading && allocations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Tenants
            </div>
            <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              {allocations.length}
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Monthly Rent Inflow
            </div>
            <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-emerald-700 flex items-center gap-1">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
              ₹{totalMonthlyRent.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Total Security Deposits
            </div>
            <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-indigo-900 flex items-center gap-1">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              ₹{totalDeposits.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Alerts */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-3 text-sm animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-xs transition-all"
          />
        </div>
      )}

      {/* Allocations Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading active allocations...</p>
        </div>
      ) : filteredAllocations.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery ? "No allocations match your search" : "No active allocations"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "Try searching for a different tenant or room number."
              : "No tenants are currently assigned to beds. Allocate a bed to a registered tenant."}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/allocations/new"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 text-sm shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              Allocate First Tenant
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
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
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Tenant Info */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.tenantName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.tenantEmail}
                      </div>
                      {item.tenantPhone && (
                        <div className="text-xs text-slate-400 font-mono">
                          {item.tenantPhone}
                        </div>
                      )}
                    </td>

                    {/* Property */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        {item.propertyName}
                      </div>
                    </td>

                    {/* Room & Bed */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-900">
                          Room {item.roomNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
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
                      <div className="font-bold text-slate-900">
                        ₹{Number(item.monthlyRent)?.toLocaleString("en-IN")} / mo
                      </div>
                      <div className="text-xs text-slate-500">
                        Deposit: ₹{Number(item.depositAmount)?.toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* Check-In Date */}
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.checkInDate}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {item.status === "NOTICE_SERVED" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Notice Served
                          </span>
                          {item.plannedCheckoutDate && (
                            <div className="text-[10px] text-amber-700 font-mono">
                              Depart: {item.plannedCheckoutDate}
                            </div>
                          )}
                        </div>
                      ) : item.status === "VACATED" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Vacated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Active Lease
                        </span>
                      )}
                    </td>

                    {/* Action: Process Checkout */}
                    <td className="px-6 py-4 text-right">
                      {item.status !== "VACATED" && item.status !== "COMPLETED" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClearanceAlloc(item);
                            setIsClearanceOpen(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            item.status === "NOTICE_SERVED"
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Process Checkout</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Move-Out Checkout Clearance & Settlement Modal */}
      <CheckoutClearanceModal
        isOpen={isClearanceOpen}
        onClose={() => setIsClearanceOpen(false)}
        allocation={selectedClearanceAlloc}
        onSuccess={handleClearanceSuccess}
      />
    </div>
  );
}
