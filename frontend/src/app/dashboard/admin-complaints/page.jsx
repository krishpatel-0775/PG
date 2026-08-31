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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
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
              <span className="text-slate-200">Maintenance Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Wrench className="w-8 h-8 text-indigo-400" />
              Maintenance Kanban Board
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Track, triage, and resolve tenant service requests across your properties
            </p>
          </div>

          {/* Property Selector Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-md"
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

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by tenant, issue, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Kanban Board Columns */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading maintenance board...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* COLUMN 1: OPEN */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h2 className="font-bold text-white text-sm">Open Issues</h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {openTickets.length}
                </span>
              </div>

              <div className="space-y-3">
                {openTickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
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
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, "IN_PROGRESS")}
                            disabled={updatingId === ticket.id}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-600 border border-amber-500/20 transition-all"
                          >
                            <ArrowRight className="w-3.5 h-3.5" /> Start Work
                          </button>
                          <button
                            onClick={() => {
                              setResolvingTicket(ticket);
                              setResolveRemarks("");
                            }}
                            disabled={updatingId === ticket.id}
                            className="inline-flex items-center justify-center py-1.5 px-3 rounded-lg text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 transition-all"
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
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h2 className="font-bold text-white text-sm">In Progress</h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {inProgressTickets.length}
                </span>
              </div>

              <div className="space-y-3">
                {inProgressTickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
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
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, "OPEN")}
                            disabled={updatingId === ticket.id}
                            className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" /> Reopen
                          </button>
                          <button
                            onClick={() => {
                              setResolvingTicket(ticket);
                              setResolveRemarks("");
                            }}
                            disabled={updatingId === ticket.id}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
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
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="font-bold text-white text-sm">Resolved</h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {resolvedTickets.length}
                </span>
              </div>

              <div className="space-y-3">
                {resolvedTickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
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
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, "OPEN")}
                            disabled={updatingId === ticket.id}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Resolve Ticket #{resolvingTicket.id}
                </h3>
                <button
                  onClick={() => setResolvingTicket(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-300">
                <span className="text-slate-400">Issue: </span>
                <span className="font-semibold text-white">{resolvingTicket.title}</span>
              </div>

              <div>
                <label
                  htmlFor="resolveRemarks"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Resolution Note / Action Taken (Optional)
                </label>
                <textarea
                  id="resolveRemarks"
                  rows={3}
                  value={resolveRemarks}
                  onChange={(e) => setResolveRemarks(e.target.value)}
                  placeholder="e.g. Electrician replaced the heating coil in geyser..."
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(resolvingTicket.id, "RESOLVED", resolveRemarks)}
                  disabled={updatingId === resolvingTicket.id}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
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
    </div>
  );
}

function TicketCard({ ticket, updatingId, getCategoryIcon, actions }) {
  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-4 space-y-3 shadow-md hover:border-slate-700 transition-all">
      {/* Category & Date */}
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300">
          {getCategoryIcon(ticket.category)}
          <span>{ticket.category}</span>
        </span>
        <span className="text-[11px] text-slate-500">
          {new Date(ticket.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-2">
          {ticket.title}
        </h4>
        <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
          {ticket.description}
        </p>
      </div>

      {/* Tenant Context */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-indigo-400" />
          <span className="font-semibold text-slate-200">{ticket.tenantName}</span>
        </div>
        {ticket.tenantPhone && (
          <a
            href={`tel:${ticket.tenantPhone}`}
            className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
          >
            <Phone className="w-2.5 h-2.5" /> {ticket.tenantPhone}
          </a>
        )}
      </div>

      {ticket.propertyName && (
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Building2 className="w-2.5 h-2.5" />
          <span>{ticket.propertyName}</span>
        </div>
      )}

      {/* Action Buttons */}
      {actions}
    </div>
  );
}
