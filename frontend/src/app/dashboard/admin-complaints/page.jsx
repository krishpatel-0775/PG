"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Wrench,
  ArrowLeft,
  Building2,
  User,
  Phone,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
  Zap,
  Droplets,
  Sparkles,
  Wifi,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  X,
  Check,
} from "lucide-react";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Resolve Remarks Modal State
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolveRemarks, setResolveRemarks] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [selectedPropertyId]);

  const fetchInitialData = async () => {
    try {
      const propRes = await api.get("/properties");
      setProperties(propRes.data || []);
    } catch (err) {
      console.error("Failed to load properties list", err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      let response;
      if (selectedPropertyId === "ALL") {
        response = await api.get("/complaints/owner");
      } else {
        response = await api.get(`/complaints/property/${selectedPropertyId}`);
      }
      setComplaints(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load maintenance tickets.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus, remarks = null) => {
    setUpdatingId(ticketId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.put(`/complaints/${ticketId}/status`, {
        status: newStatus,
        remarks: remarks || null,
      });

      setSuccessMessage(`Ticket #${ticketId} status updated to ${newStatus.replace("_", " ")}.`);
      if (resolvingTicket) {
        setResolvingTicket(null);
        setResolveRemarks("");
      }
      await fetchComplaints();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to update ticket status.";
      setErrorMessage(backendMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "ELECTRICAL":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "PLUMBING":
        return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
      case "CLEANING":
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case "INTERNET":
        return <Wifi className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.tenantName?.toLowerCase().includes(q) ||
      c.tenantPhone?.toLowerCase().includes(q) ||
      c.propertyName?.toLowerCase().includes(q)
    );
  });

  const openTickets = filteredComplaints.filter((c) => c.status === "OPEN");
  const inProgressTickets = filteredComplaints.filter((c) => c.status === "IN_PROGRESS");
  const resolvedTickets = filteredComplaints.filter((c) => c.status === "RESOLVED");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
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
            <span className="text-slate-900 font-semibold">Maintenance Management</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Maintenance Kanban Board
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Track, triage, and resolve tenant service requests across your properties
              </p>
            </div>
          </div>
        </div>

        {/* Property Selector Filter */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs transition-all"
          >
            <option value="ALL">All Properties ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tickets by tenant, issue, or property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm shadow-xs transition-all"
        />
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading maintenance board...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* COLUMN 1: OPEN */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h2 className="font-bold text-slate-900 text-sm">Open Issues</h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {openTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {openTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white/60">
                  No new open issues
                </div>
              ) : (
                openTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    updatingId={updatingId}
                    getCategoryIcon={getCategoryIcon}
                    actions={
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "IN_PROGRESS")}
                          disabled={updatingId === ticket.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-xs transition-all disabled:opacity-50"
                        >
                          <ArrowRight className="w-3.5 h-3.5" /> Start Work
                        </button>
                        <button
                          onClick={() => {
                            setResolvingTicket(ticket);
                            setResolveRemarks("");
                          }}
                          disabled={updatingId === ticket.id}
                          className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="font-bold text-slate-900 text-sm">In Progress</h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {inProgressTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white/60">
                  No tasks currently in progress
                </div>
              ) : (
                inProgressTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    updatingId={updatingId}
                    getCategoryIcon={getCategoryIcon}
                    actions={
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "OPEN")}
                          disabled={updatingId === ticket.id}
                          className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 shadow-xs transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" /> Reopen
                        </button>
                        <button
                          onClick={() => {
                            setResolvingTicket(ticket);
                            setResolveRemarks("");
                          }}
                          disabled={updatingId === ticket.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: RESOLVED */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="font-bold text-slate-900 text-sm">Resolved</h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {resolvedTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {resolvedTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white/60">
                  No resolved tickets yet
                </div>
              ) : (
                resolvedTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    updatingId={updatingId}
                    getCategoryIcon={getCategoryIcon}
                    actions={
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "OPEN")}
                          disabled={updatingId === ticket.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Reopen
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolution Remarks Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resolve Ticket #{resolvingTicket.id}
              </h3>
              <button
                onClick={() => setResolvingTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-slate-500 font-medium">Issue: </span>
              <span className="font-bold text-slate-900">{resolvingTicket.title}</span>
            </div>

            <div>
              <label
                htmlFor="resolveRemarks"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Resolution Note / Action Taken (Optional)
              </label>
              <textarea
                id="resolveRemarks"
                rows={3}
                value={resolveRemarks}
                onChange={(e) => setResolveRemarks(e.target.value)}
                placeholder="e.g. Electrician replaced the heating coil in geyser..."
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 shadow-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(resolvingTicket.id, "RESOLVED", resolveRemarks)}
                disabled={updatingId === resolvingTicket.id}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {updatingId === resolvingTicket.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket, updatingId, getCategoryIcon, actions }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group">
      {/* Category & Date */}
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
          {getCategoryIcon(ticket.category)}
          <span>{ticket.category}</span>
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          {new Date(ticket.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {ticket.title}
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
          {ticket.description}
        </p>
      </div>

      {/* Tenant Context */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-indigo-600" />
          <span className="font-semibold text-slate-800">{ticket.tenantName}</span>
        </div>
        {ticket.tenantPhone && (
          <a
            href={`tel:${ticket.tenantPhone}`}
            className="text-indigo-600 hover:text-indigo-700 font-mono font-medium flex items-center gap-1 transition-colors"
          >
            <Phone className="w-2.5 h-2.5" /> {ticket.tenantPhone}
          </a>
        )}
      </div>

      {ticket.propertyName && (
        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
          <Building2 className="w-3 h-3 text-slate-400" />
          <span>{ticket.propertyName}</span>
        </div>
      )}

      {/* Action Buttons */}
      {actions}
    </div>
  );
}
