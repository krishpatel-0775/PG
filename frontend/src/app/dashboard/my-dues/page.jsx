"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Receipt,
  IndianRupee,
  Calendar,
  Building2,
  Bed,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Info,
  Send,
} from "lucide-react";

export default function TenantDuesPage() {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchMyDues();
  }, []);

  const fetchMyDues = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/finance/my-dues");
      setDues(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Unable to load your pending dues.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = dues.reduce(
    (acc, inv) => acc + (Number(inv.dueAmount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header & Breadcrumb */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link
              href="/dashboard"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-200">Rent & Payments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-indigo-400" />
            My Rent Invoices & Dues
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View upcoming rent cycles, pending balances, and payment guidelines
          </p>
        </div>

        {/* Feedback Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Checking your dues balance...</p>
          </div>
        ) : dues.length === 0 ? (
          /* Zero-Balance Celebratory State */
          <div className="text-center py-20 px-6 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">All Caught Up!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              You have zero pending rent dues. All your past invoices have been settled in full.
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-sm shadow-lg shadow-indigo-600/20 transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Outstanding Invoices List */
          <div className="space-y-6">
            {/* Total Balance Hero Banner */}
            <div className="bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-900/80 border border-rose-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Total Outstanding Balance
                </div>
                <div className="mt-1 text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-1">
                  <IndianRupee className="w-8 h-8 text-rose-400 flex-shrink-0" />
                  {totalOutstanding.toLocaleString("en-IN")}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Across {dues.length} pending billing {dues.length === 1 ? "cycle" : "cycles"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 max-w-sm space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                  <Info className="w-4 h-4" />
                  How to Pay
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Please pay via UPI to the PG owner and share your payment screenshot / transaction ID with your manager.
                </p>
              </div>
            </div>

            {/* Invoices Grid */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                Pending Invoices
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {dues.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-all"
                  >
                    {/* Header: Month & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">
                            Invoice for {inv.invoiceMonth}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              inv.status === "UNPAID"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {inv.status === "UNPAID" ? "Unpaid" : "Partially Paid"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>{inv.propertyName}</span>
                          <span>&bull;</span>
                          <span>Room {inv.roomNumber} ({inv.bedNumber})</span>
                        </p>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>Due Date:</span>
                        <span className="font-semibold text-white">{inv.dueDate}</span>
                      </div>
                    </div>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-3 gap-3 bg-slate-950/50 rounded-xl p-4 border border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Monthly Rent</span>
                        <span className="font-semibold text-white text-sm sm:text-base">
                          ₹{Number(inv.totalAmount)?.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Paid Amount</span>
                        <span className="font-semibold text-emerald-400 text-sm sm:text-base">
                          ₹{Number(inv.amountPaid)?.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div>
                        <span className="text-rose-400 block text-[11px] font-medium">Due Balance</span>
                        <span className="font-bold text-rose-400 text-sm sm:text-base">
                          ₹{Number(inv.dueAmount)?.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Payment Instruction Banner */}
                    <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                      <QrCode className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Direct Payment Notice: </span>
                        <span>
                          Please transfer ₹{Number(inv.dueAmount)?.toLocaleString("en-IN")} to the owner via UPI/Cash and request them to mark it as recorded.
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
