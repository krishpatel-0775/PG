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
  X,
  Filter,
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

      setSuccessMessage("Maintenance ticket submitted successfully! Our staff will attend to it shortly.");
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

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case "ELECTRICAL":
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "PLUMBING":
        return {
          icon: <Droplets className="w-3.5 h-3.5 text-blue-600" />,
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "CLEANING":
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-600" />,
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "INTERNET":
        return {
          icon: <Wifi className="w-3.5 h-3.5 text-purple-600" />,
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        };
      default:
        return {
          icon: <Wrench className="w-3.5 h-3.5 text-slate-600" />,
          badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> In Progress
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Open
          </span>
        );
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "ALL") return true;
    return c.status === activeTab;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full pb-16">
      {/* Header & Breadcrumb */}
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
            <span className="text-slate-900 font-semibold">Complaints & Requests</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Maintenance & Support Tickets
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Submit maintenance requests or report facility issues for quick resolution
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-200 transition-all cursor-pointer self-start sm:self-auto"
        >
          {showForm ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Close Form</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Raise New Issue</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-xs sm:text-sm shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-xs sm:text-sm shadow-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Raise Issue Form Card */}
      {showForm && (
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-150 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">File a Maintenance Ticket</h2>
                <p className="text-xs text-slate-500">Provide details about the issue so property staff can assist promptly</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4.5" suppressHydrationWarning>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Dropdown */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Issue Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm cursor-pointer shadow-2xs transition-all"
                >
                  <option value="ELECTRICAL">⚡ Electrical (Fan, Light, Switch, AC, Geyser)</option>
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
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                  className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm leading-relaxed shadow-2xs transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-200 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Filters */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs overflow-x-auto">
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
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs shadow-indigo-200"
                  : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? "bg-indigo-700/70 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading your tickets...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-10 sm:p-14 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Wrench className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Tickets Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {activeTab === "ALL"
                ? "You haven't filed any maintenance requests yet. Need assistance with room facilities?"
                : `No complaints currently marked as ${activeTab.replace("_", " ")}.`}
            </p>
          </div>
          {activeTab === "ALL" && !showForm && (
            <div className="pt-2">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-200 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Raise New Issue</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredComplaints.map((c) => {
            const meta = getCategoryMeta(c.category);
            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-300 hover:shadow-xs transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${meta.badgeClass}`}
                      >
                        {meta.icon}
                        <span>{c.category}</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Ticket #{c.id}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {c.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {getStatusBadge(c.status)}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                  {c.description}
                </p>

                {/* Staff Remarks if available */}
                {c.remarks && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Staff Resolution Note: </span>
                      <span className="text-slate-700">{c.remarks}</span>
                    </div>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Created: {new Date(c.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>

                  {c.propertyName && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.propertyName}</span>
                    </div>
                  )}

                  {c.resolvedAt && (
                    <div className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Resolved on {new Date(c.resolvedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
