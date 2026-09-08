"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Receipt,
  IndianRupee,
  Calendar,
  Clock,
  Building2,
  Bed,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ArrowLeft,
  Phone,
  Sparkles,
  Play,
  Filter,
} from "lucide-react";
import RecordPaymentModal from "@/components/RecordPaymentModal";

export default function RentManagementPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  const fetchPendingInvoices = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/finance/invoices/pending");
      setInvoices(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load pending rent invoices.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setSuccessMessage("Payment successfully recorded! Table updated.");
    fetchPendingInvoices();
  };

  const handleTriggerBilling = async () => {
    setTriggering(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await api.post("/finance/invoices/trigger");
      const count = response.data?.length || 0;
      setSuccessMessage(
        count > 0
          ? `Anniversary billing executed: Generated ${count} new invoice(s) for today!`
          : "Anniversary billing check completed: No new invoices due for generation today."
      );
      await fetchPendingInvoices();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to trigger anniversary billing cron job.";
      setErrorMessage(backendMessage);
    } finally {
      setTriggering(false);
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

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.tenantName?.toLowerCase().includes(q) ||
        inv.tenantPhone?.toLowerCase().includes(q) ||
        inv.tenantEmail?.toLowerCase().includes(q) ||
        inv.propertyName?.toLowerCase().includes(q) ||
        inv.roomNumber?.toLowerCase().includes(q) ||
        inv.bedNumber?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const totalOutstanding = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + (Number(inv.dueAmount || inv.totalAmount) || 0),
      0
    );
  }, [invoices]);

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
            <span className="text-slate-900 font-semibold">Rent Management</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Pending Rent Invoices
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Overview of all pending and overdue tenant rents generated via anniversary billing.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchPendingInvoices}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleTriggerBilling}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow transition-all active:scale-[0.99] disabled:opacity-60"
          >
            <Play className={`w-3.5 h-3.5 ${triggering ? "animate-spin" : ""}`} />
            {triggering ? "Running Billing Job..." : "Trigger Billing Check"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <span className="font-bold">Error:</span> {errorMessage}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
          <div className="flex-1">
            <span className="font-bold">Success:</span> {successMessage}
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Outstanding Dues
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{formatCurrency(totalOutstanding)}
            </span>
          </div>
          <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
            Pending collections across properties
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Invoices
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {invoices.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">unsettled invoices</span>
          </div>
          <p className="mt-1 text-xs text-amber-600 font-medium">
            Awaiting payment confirmation
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Billing Cycle
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Anniversary-Date
            </span>
          </div>
          <p className="mt-1 text-xs text-indigo-600 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Auto runs daily at 1:00 AM
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, phone, room, or bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">UNPAID</option>
            <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
          </select>
        </div>
      </div>

      {/* Pending Invoices Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
            <p className="text-xs font-medium">Loading pending invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Pending Rent Invoices</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "No pending invoices match your search query."
                : "All active tenants are currently settled with zero outstanding dues."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Tenant Name</th>
                  <th scope="col" className="px-6 py-4">Room / Bed</th>
                  <th scope="col" className="px-6 py-4">Property</th>
                  <th scope="col" className="px-6 py-4">Invoice Date</th>
                  <th scope="col" className="px-6 py-4">Due Date</th>
                  <th scope="col" className="px-6 py-4">Total Rent</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Tenant Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-xs">
                          {invoice.tenantName ? invoice.tenantName.charAt(0).toUpperCase() : "T"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                            {invoice.tenantName || "Unknown Tenant"}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            {invoice.tenantPhone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {invoice.tenantPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Room / Bed */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
                        <Bed className="w-3.5 h-3.5 text-indigo-600" />
                        {invoice.roomNumber ? `Room ${invoice.roomNumber}` : "Room -"}
                        {invoice.bedNumber && ` • Bed ${invoice.bedNumber}`}
                      </span>
                    </td>

                    {/* Property */}
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {invoice.propertyName || "PG Property"}
                      </div>
                    </td>

                    {/* Invoice Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(invoice.invoiceDate)}</span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{formatDate(invoice.dueDate)}</span>
                      </div>
                    </td>

                    {/* Total Rent */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          ₹{formatCurrency(invoice.totalAmount)}
                        </div>
                        {Number(invoice.amountPaid) > 0 && (
                          <div className="text-xs text-rose-600 font-semibold mt-0.5">
                            Due: ₹{formatCurrency(invoice.dueAmount)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {invoice.status === "PARTIALLY_PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Partially Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Action Button: Clear Dues */}
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(invoice)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98]"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Clear Dues
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
