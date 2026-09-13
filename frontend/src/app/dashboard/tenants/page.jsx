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
} from "lucide-react";

export default function TenantDirectoryPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "ACTIVE" | "COMPLETED"

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

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const response = await api.get("/directory/tenants");
        if (!isMounted) return;
        setTenants(response.data || []);
      } catch (err) {
        if (!isMounted) return;
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to load tenant directory.";
        setErrorMessage(backendMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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
      const q = searchQuery.toLowerCase().trim();
      const rawId = q.replace(/[^0-9]/g, "");
      const matchesSearch =
        !q ||
        tenant.name?.toLowerCase().includes(q) ||
        tenant.phone?.toLowerCase().includes(q) ||
        tenant.email?.toLowerCase().includes(q) ||
        tenant.currentPropertyName?.toLowerCase().includes(q) ||
        tenant.currentRoomBed?.toLowerCase().includes(q) ||
        (rawId && String(tenant.tenantId) === rawId);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE"
          ? tenant.allocationStatus === "ACTIVE"
          : tenant.allocationStatus !== "ACTIVE");

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  const activeCount = useMemo(() => {
    return tenants.filter((t) => t.allocationStatus === "ACTIVE").length;
  }, [tenants]);

  const completedCount = useMemo(() => {
    return tenants.filter((t) => t.allocationStatus !== "ACTIVE").length;
  }, [tenants]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Header & Breadcrumb */}
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
            <span className="text-slate-900">Tenant Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            Tenant Directory (CRM)
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage your tenants, view 360° CRM stay profiles, and track payment histories.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTenants}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total CRM Tenants */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total CRM Tenants
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {tenants.length}
            </span>
            <span className="text-xs font-medium text-slate-500">tenant profiles</span>
          </div>
          <p className="mt-2 text-xs text-indigo-700 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Historical &amp; active records
          </p>
        </div>

        {/* Card 2: Active Residents */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Residents
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeCount}
            </span>
            <span className="text-xs font-medium text-slate-500">currently staying</span>
          </div>
          <p className="mt-2 text-xs text-emerald-700 font-medium">
            Assigned to active room &amp; beds
          </p>
        </div>

        {/* Card 3: Past Tenants */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Past Tenants
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {completedCount}
            </span>
            <span className="text-xs font-medium text-slate-500">checked-out stays</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Completed lease agreements
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, phone, email, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Stays</option>
            <option value="COMPLETED">Past / Checked Out</option>
          </select>
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-500">Loading tenant directory...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Tenants Found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "No tenants matched your search criteria."
                : "No tenant allocations have been registered yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Tenant Name</th>
                  <th scope="col" className="px-6 py-4">Contact Details</th>
                  <th scope="col" className="px-6 py-4">Property</th>
                  <th scope="col" className="px-6 py-4">Room &amp; Bed</th>
                  <th scope="col" className="px-6 py-4">Check-in Date</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((tenant) => {
                  const isActive = tenant.allocationStatus === "ACTIVE";

                  return (
                    <tr
                      key={tenant.tenantId}
                      onClick={() => router.push(`/dashboard/tenants/${tenant.tenantId}`)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {tenant.name ? tenant.name.charAt(0).toUpperCase() : "T"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {tenant.name || "Unknown"}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              ID: #{tenant.tenantId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          {tenant.phone && (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{tenant.phone}</span>
                            </div>
                          )}
                          {tenant.email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{tenant.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Property */}
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {tenant.currentPropertyName || "N/A"}
                        </div>
                      </td>

                      {/* Room & Bed */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs font-semibold text-indigo-700">
                          <Bed className="w-3.5 h-3.5 text-indigo-600" />
                          {tenant.currentRoomBed || "-"}
                        </span>
                      </td>

                      {/* Check-in Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(tenant.checkInDate)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active Stay
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Completed
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/dashboard/tenants/${tenant.tenantId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 transition-all shadow-xs"
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
  );
}
