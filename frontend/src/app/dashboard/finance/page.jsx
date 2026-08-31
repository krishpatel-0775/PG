"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  IndianRupee,
  Receipt,
  ArrowLeft,
  Building2,
  Bed,
  Calendar,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  CreditCard,
  User,
  Phone,
  RefreshCw,
} from "lucide-react";
import RecordPaymentModal from "@/components/RecordPaymentModal";

export default function OwnerFinancePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPendingDues();
  }, []);

  const fetchPendingDues = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/finance/invoices/dues");
      setInvoices(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load pending dues.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoicesManual = async () => {
    setGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await api.post("/finance/invoices/generate-manual");
      const count = response.data?.length || 0;
      setSuccessMessage(
        count > 0
          ? `Successfully generated ${count} monthly invoices for active tenants!`
          : "All active tenants already have invoices generated for this month."
      );
      await fetchPendingDues();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to generate monthly invoices.";
      setErrorMessage(backendMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.tenantName?.toLowerCase().includes(q) ||
      inv.tenantPhone?.toLowerCase().includes(q) ||
      inv.propertyName?.toLowerCase().includes(q) ||
      inv.roomNumber?.toLowerCase().includes(q) ||
      inv.bedNumber?.toLowerCase().includes(q) ||
      inv.invoiceMonth?.toLowerCase().includes(q)
    );
  });

  const totalOutstanding = invoices.reduce(
    (acc, inv) => acc + (Number(inv.dueAmount) || 0),
    0
  );
  const totalInvoiced = invoices.reduce(
    (acc, inv) => acc + (Number(inv.totalAmount) || 0),
    0
  );
  const totalCollected = invoices.reduce(
    (acc, inv) => acc + (Number(inv.amountPaid) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Actions */}
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
              <span className="text-slate-200">Billing & Finance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Receipt className="w-8 h-8 text-indigo-400" />
              Rent Billing & Dues
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Track outstanding tenant dues, generate monthly cycles, and record offline payments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateInvoicesManual}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Generating Cycle...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  <span>Generate Invoices Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Outstanding Dues
            </div>
            <div className="mt-2 text-3xl font-extrabold text-rose-400 flex items-center gap-1">
              <IndianRupee className="w-7 h-7 text-rose-400 flex-shrink-0" />
              {totalOutstanding.toLocaleString("en-IN")}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Across {invoices.length} pending tenant {invoices.length === 1 ? "invoice" : "invoices"}
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Invoiced (Active Cycle)
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white flex items-center gap-1">
              <IndianRupee className="w-7 h-7 text-indigo-400 flex-shrink-0" />
              {totalInvoiced.toLocaleString("en-IN")}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total base monthly rent for billed stays
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Collected Amount
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400 flex items-center gap-1">
              <IndianRupee className="w-7 h-7 text-emerald-400 flex-shrink-0" />
              {totalCollected.toLocaleString("en-IN")}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Payments recorded against active invoices
            </p>
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

        {/* Search Bar */}
        {invoices.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by tenant name, phone, room, or month..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        )}

        {/* Pending Invoices Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading pending dues...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {searchQuery ? "No matching dues found" : "All Caught Up!"}
            </h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? "No pending invoices match your search query."
                : "No outstanding rent dues found. Invoices are generated automatically on the 1st of every month."}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tenant</th>
                    <th className="px-6 py-4">Property / Room</th>
                    <th className="px-6 py-4">Billing Month</th>
                    <th className="px-6 py-4">Total Rent</th>
                    <th className="px-6 py-4">Paid So Far</th>
                    <th className="px-6 py-4">Remaining Due</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Tenant Name and Contact */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {inv.tenantName}
                        </div>
                        {inv.tenantPhone && (
                          <div className="text-xs text-indigo-400 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-indigo-400" />
                            {inv.tenantPhone}
                          </div>
                        )}
                      </td>

                      {/* Property & Room / Bed */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {inv.propertyName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Bed className="w-3 h-3 text-slate-500" />
                          Room {inv.roomNumber} &bull; Bed {inv.bedNumber}
                        </div>
                      </td>

                      {/* Billing Month */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-white border border-slate-700">
                          {inv.invoiceMonth}
                        </span>
                      </td>

                      {/* Total Rent */}
                      <td className="px-6 py-4 font-semibold text-white">
                        ₹{Number(inv.totalAmount)?.toLocaleString("en-IN")}
                      </td>

                      {/* Paid So Far */}
                      <td className="px-6 py-4 text-emerald-400 font-medium">
                        ₹{Number(inv.amountPaid)?.toLocaleString("en-IN")}
                      </td>

                      {/* Remaining Due */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-rose-400 text-base">
                          ₹{Number(inv.dueAmount)?.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {inv.dueDate}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                            inv.status === "UNPAID"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {inv.status === "UNPAID" ? "Unpaid" : "Partial"}
                        </span>
                      </td>

                      {/* Record Payment Button */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(inv)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 transition-all active:scale-[0.99]"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unified Payment Entry Modal */}
        <RecordPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          invoice={selectedInvoice}
          onSuccess={fetchPendingDues}
        />
      </div>
    </div>
  );
}
