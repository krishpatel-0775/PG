"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Wrench,
  ArrowLeft,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Droplets,
  Sparkles,
  Wifi,
  HelpCircle,
  Calendar,
  Building2,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
} from "lucide-react";

export default function TenantComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activeTab, setActiveTab] = useState("ALL");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    category: "ELECTRICAL",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/complaints/my");
      setComplaints(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load your complaints.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.title.trim() || !formData.description.trim()) {
      setErrorMessage("Please fill in both title and description.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/complaints", {
        category: formData.category,
        title: formData.title.trim(),
        description: formData.description.trim(),
      });

      setSuccessMessage("Maintenance ticket raised successfully!");
      setFormData({
        category: "ELECTRICAL",
        title: "",
        description: "",
      });
      setShowForm(false);
      await fetchMyComplaints();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit complaint.";
      setErrorMessage(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "ELECTRICAL":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "PLUMBING":
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case "CLEANING":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case "INTERNET":
        return <Wifi className="w-4 h-4 text-purple-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> Open
          </span>
        );
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "ALL") return true;
    return c.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
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
              <span className="text-slate-200">Complaints & Requests</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Wrench className="w-8 h-8 text-indigo-400" />
              Maintenance & Support Tickets
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Submit maintenance requests or report facility issues for quick resolution
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99]"
          >
            {showForm ? (
              <>
                <ChevronUp className="w-4 h-4" /> Close Form
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Raise New Issue
              </>
            )}
          </button>
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

        {/* Raise Issue Collapsible Card */}
        {showForm && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              File a Maintenance Ticket
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Dropdown */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Issue Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs cursor-pointer"
                  >
                    <option value="ELECTRICAL">⚡ Electrical (Fan, Light, Switch, AC)</option>
                    <option value="PLUMBING">🚰 Plumbing (Tap, Geyser, Drain, Flush)</option>
                    <option value="CLEANING">🧹 Cleaning & Housekeeping</option>
                    <option value="INTERNET">📶 Wi-Fi / Internet Connectivity</option>
                    <option value="OTHER">🛠️ Other Maintenance Issue</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Issue Title / Summary *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Geyser not heating water in bathroom"
                    className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail (e.g. Water is lukewarm since yesterday, tripping MCB when switched on)..."
                  className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs overflow-x-auto">
          {[
            { id: "ALL", label: "All Tickets", count: complaints.length },
            {
              id: "OPEN",
              label: "Open",
              count: complaints.filter((c) => c.status === "OPEN").length,
            },
            {
              id: "IN_PROGRESS",
              label: "In Progress",
              count: complaints.filter((c) => c.status === "IN_PROGRESS").length,
            },
            {
              id: "RESOLVED",
              label: "Resolved",
              count: complaints.filter((c) => c.status === "RESOLVED").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 text-slate-300">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading your tickets...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Tickets Found</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              {activeTab === "ALL"
                ? "You haven't filed any maintenance requests yet. Use 'Raise New Issue' to report a problem."
                : `No complaints currently marked as ${activeTab.replace("_", " ")}.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-all shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300">
                        {getCategoryIcon(c.category)}
                        <span>{c.category}</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Ticket #{c.id}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {c.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {getStatusBadge(c.status)}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                  {c.description}
                </p>

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Created: {new Date(c.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </div>

                  {c.propertyAddress && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{c.propertyName}</span>
                    </div>
                  )}

                  {c.resolvedAt && (
                    <div className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved on {new Date(c.resolvedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                    </div>
                  )}
                </div>

                {/* Staff Remarks if available */}
                {c.remarks && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200">Staff Note: </span>
                      <span>{c.remarks}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
