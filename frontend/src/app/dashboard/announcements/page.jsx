"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Megaphone,
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  X,
  Sparkles,
} from "lucide-react";

export default function OwnerAnnouncementsPage() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchNotices(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
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
      setErrorMessage("Failed to load properties.");
      setLoading(false);
    }
  };

  const fetchNotices = async (propertyId) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/notices/property/${propertyId}`);
      setNotices(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load notices.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      setErrorMessage("Please select a property first.");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMessage("Title and content are required.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.post(`/notices/property/${selectedPropertyId}`, {
        title: formData.title.trim(),
        content: formData.content.trim(),
      });

      setSuccessMessage("Notice broadcasted successfully!");
      setFormData({ title: "", content: "" });
      setShowForm(false);
      await fetchNotices(selectedPropertyId);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to publish notice.";
      setErrorMessage(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this announcement?");
    if (!confirmDelete) return;

    setDeletingId(noticeId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.delete(`/notices/${noticeId}`);
      setSuccessMessage("Notice deleted successfully.");
      await fetchNotices(selectedPropertyId);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to delete notice.";
      setErrorMessage(backendMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const selectedPropertyName =
    properties.find((p) => p.id.toString() === selectedPropertyId)?.name || "Property";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
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
              <span className="text-slate-200">Announcements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-indigo-400" />
              Notice Board & Broadcasts
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Publish announcements, policy updates, and event alerts to your PG residents
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {properties.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-md"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99]"
            >
              {showForm ? (
                <>
                  <X className="w-4 h-4" /> Close Form
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Post New Notice
                </>
              )}
            </button>
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

        {/* Add New Notice Form Card */}
        {showForm && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-400" />
              Broadcast Notice for {selectedPropertyName}
            </h2>

            <form onSubmit={handleCreateNotice} className="space-y-4" suppressHydrationWarning>
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Notice Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Scheduled Water Tank Cleaning this Sunday"
                  className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Notice Content & Details *
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide complete details, timings, or instructions for the residents..."
                  className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                />
              </div>

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
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notices Cards List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading notice board...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Notices Published</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              No active announcements found for {selectedPropertyName}. Click &apos;Post New Notice&apos; to broadcast a message.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                        <Megaphone className="w-3.5 h-3.5" /> Announcement
                      </span>
                      <span className="text-xs text-slate-500">
                        Notice #{notice.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {notice.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    disabled={deletingId === notice.id}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors focus:outline-none"
                    title="Delete Notice"
                  >
                    {deletingId === notice.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  {notice.content}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Posted: {new Date(notice.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>By: <span className="text-slate-200 font-medium">{notice.createdBy}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
