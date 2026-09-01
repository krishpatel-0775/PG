"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Users,
  Search,
  Building2,
  Bed,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  UserCheck,
  UserX,
  Sparkles,
  Filter,
  ExternalLink,
} from "lucide-react";

export default function TenantDirectoryPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "ACTIVE" | "COMPLETED"

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/directory/tenants");
      setTenants(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load tenant directory.";
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

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        tenant.name?.toLowerCase().includes(q) ||
        tenant.phone?.toLowerCase().includes(q) ||
        tenant.email?.toLowerCase().includes(q) ||
        tenant.currentPropertyName?.toLowerCase().includes(q) ||
        tenant.currentRoomBed?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || tenant.allocationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  const activeCount = useMemo(() => {
    return tenants.filter((t) => t.allocationStatus === "ACTIVE").length;
  }, [tenants]);

  const completedCount = useMemo(() => {
    return tenants.filter((t) => t.allocationStatus === "COMPLETED").length;
  }, [tenants]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Breadcrumb */}
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
              <span className="text-slate-200">Tenant Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-400" />
              Tenant Directory (CRM)
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your tenants, view 360° CRM stay profiles, and track payment histories.
            </p>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchTenants}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Error:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* KPI Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total CRM Tenants
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {tenants.length}
              </span>
              <span className="text-xs text-slate-400">tenant profiles</span>
            </div>
            <p className="mt-1 text-xs text-indigo-400/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Historical & active records
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Residents
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {activeCount}
              </span>
              <span className="text-xs text-slate-400">currently staying</span>
            </div>
            <p className="mt-1 text-xs text-emerald-400/80">
              Assigned to active room & beds
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Past Tenants
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {completedCount}
              </span>
              <span className="text-xs text-slate-400">checked-out stays</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Completed lease agreements
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by tenant name, phone, email, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Stays</option>
              <option value="COMPLETED">Past / Checked Out</option>
            </select>
          </div>
        </div>

        {/* Tenant Table */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Loading tenant directory...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white">No Tenants Found</h3>
              <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? "No tenants matched your search criteria."
                  : "No tenant allocations have been registered yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Tenant Name</th>
                    <th scope="col" className="px-6 py-4">Contact Details</th>
                    <th scope="col" className="px-6 py-4">Property</th>
                    <th scope="col" className="px-6 py-4">Room & Bed</th>
                    <th scope="col" className="px-6 py-4">Check-in Date</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTenants.map((tenant, idx) => {
                    const isActive = tenant.allocationStatus === "ACTIVE";

                    return (
                      <tr
                        key={`${tenant.tenantId}-${idx}`}
                        onClick={() => router.push(`/dashboard/tenants/${tenant.tenantId}`)}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      >
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold text-sm">
                              {tenant.name ? tenant.name.charAt(0).toUpperCase() : "T"}
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                {tenant.name || "Unknown"}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                ID: #{tenant.tenantId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs">
                            {tenant.phone && (
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <span>{tenant.phone}</span>
                              </div>
                            )}
                            {tenant.email && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                <span>{tenant.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Property */}
                        <td className="px-6 py-4">
                          <div className="text-slate-200 font-medium flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {tenant.currentPropertyName || "N/A"}
                          </div>
                        </td>

                        {/* Room & Bed */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200">
                            <Bed className="w-3.5 h-3.5 text-indigo-400" />
                            {tenant.currentRoomBed || "-"}
                          </span>
                        </td>

                        {/* Check-in Date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDate(tenant.checkInDate)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Active Stay
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-700/60">
                              Completed
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/dashboard/tenants/${tenant.tenantId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700/60 hover:border-indigo-500/60 transition-all group-hover:shadow-md"
                          >
                            <span>View Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
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
  );
}
