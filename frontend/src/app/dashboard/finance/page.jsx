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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Header & Actions */}
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
            <span className="text-slate-900 font-semibold">Billing & Finance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Rent Billing & Dues
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Track outstanding tenant dues, generate monthly cycles, and record offline payments
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateInvoicesManual}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating Cycle...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Generate Invoices Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Outstanding Dues
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 flex items-center gap-1">
            <span className="text-rose-600 font-extrabold text-2xl sm:text-3xl">₹</span>
            {totalOutstanding.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-rose-600 font-medium">
            Across {invoices.length} pending tenant {invoices.length === 1 ? "invoice" : "invoices"}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoiced (Active Cycle)
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 flex items-center gap-1">
            <span className="text-indigo-600 font-extrabold text-2xl sm:text-3xl">₹</span>
            {totalInvoiced.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Total base monthly rent for billed stays
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Collected Amount
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600 flex items-center gap-1">
            <span className="font-extrabold text-2xl sm:text-3xl">₹</span>
            {totalCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            Payments recorded against active invoices
          </p>
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

      {/* Search Bar */}
      {invoices.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, phone, room, or month..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm shadow-xs transition-all"
          />
        </div>
      )}

      {/* Pending Invoices Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading pending dues...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 px-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? "No matching dues found" : "All Caught Up!"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No pending invoices match your search query."
              : "No outstanding rent dues found. Invoices are generated automatically on the 1st of every month."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
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
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Tenant Name and Contact */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {inv.tenantName}
                      </div>
                      {inv.tenantPhone && (
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {inv.tenantPhone}
                        </div>
                      )}
                    </td>

                    {/* Property & Room / Bed */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700 text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {inv.propertyName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Bed className="w-3 h-3 text-slate-400" />
                        Room {inv.roomNumber} &bull; Bed {inv.bedNumber}
                      </div>
                    </td>

                    {/* Billing Month */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200/80">
                        {inv.invoiceMonth}
                      </span>
                    </td>

                    {/* Total Rent */}
                    <td className="px-6 py-4 font-semibold text-slate-900 text-sm">
                      ₹{Number(inv.totalAmount)?.toLocaleString("en-IN")}
                    </td>

                    {/* Paid So Far */}
                    <td className="px-6 py-4 text-emerald-600 font-semibold text-xs">
                      ₹{Number(inv.amountPaid)?.toLocaleString("en-IN")}
                    </td>

                    {/* Remaining Due */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-rose-600 text-sm">
                        ₹{Number(inv.dueAmount)?.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {inv.dueDate}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                          inv.status === "UNPAID"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all active:scale-[0.99]"
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
  );
}
