"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Building2,
  Sparkles,
  ArrowRight,
  Receipt,
  Smartphone,
} from "lucide-react";

export default function SimulatedCheckoutModal({ isOpen, onClose, invoice, onSuccess }) {
  const [activeTab, setActiveTab] = useState("card"); // "card" | "upi"
  const [cardNumber, setCardNumber] = useState("4532 8901 2345 8890");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("420");
  const [cardName, setCardName] = useState("");
  const [upiId, setUpiId] = useState("tenant@okhdfcbank");

  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txnDetails, setTxnDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && invoice) {
      setActiveTab("card");
      setCardName(invoice.tenantName || "Valued Tenant");
      setLoading(false);
      setPaymentSuccess(false);
      setTxnDetails(null);
      setErrorMessage("");
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const totalPayable = Number(invoice.dueAmount || invoice.totalAmount) || 0;

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Simulate 2-second payment gateway processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Call backend online payment endpoint
      const response = await api.post(`/finance/payments/mock-online/${invoice.id}`);
      setTxnDetails(response.data);
      setPaymentSuccess(true);

      // 3. Notify parent component to refresh invoice list
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Payment authorization failed. Please try again.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Gateway Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm tracking-tight">
                  PG Gateway Secure Checkout
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> 256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Invoice #{invoice.id} &bull; {invoice.propertyName || "PG Stay"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {paymentSuccess ? (
            /* Success Screen */
            <div className="py-8 px-4 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-white tracking-tight">
                  Payment Successful!
                </h4>
                <p className="text-sm text-slate-400 mt-1">
                  Your rent invoice of ₹{totalPayable.toLocaleString("en-IN")} has been fully paid & settled.
                </p>
              </div>

              {txnDetails && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {txnDetails.referenceId || txnDetails.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Mode:</span>
                    <span className="text-emerald-400 font-semibold uppercase">
                      {txnDetails.mode || "ONLINE"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Invoice Status:</span>
                    <span className="text-emerald-400 font-semibold">PAID</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <div className="space-y-5">
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Amount Summary Header */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total Amount Due</span>
                  <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                    ₹{totalPayable.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div className="text-slate-200 font-semibold">{invoice.tenantName}</div>
                  <div>Room {invoice.roomNumber || "-"} &bull; Bed {invoice.bedNumber || "-"}</div>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("card")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "card"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card Payment
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("upi")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "upi"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  UPI & QR
                </button>
              </div>

              {/* Method 1: Credit / Debit Card Form */}
              {activeTab === "card" && (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 •••• •••• 8890"
                        className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                        VISA / MC
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authorizing with Bank Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay ₹{totalPayable.toLocaleString("en-IN")}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Method 2: UPI / QR Code Form */}
              {activeTab === "upi" && (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-24 h-24 bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-slate-900" />
                    </div>
                    <div className="text-xs text-slate-400">
                      Scan QR with <strong className="text-slate-200">GPay, PhonePe, Paytm, BHIM</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Or enter Virtual Payment Address (UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@bank"
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing UPI Request...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>Pay via UPI (₹{totalPayable.toLocaleString("en-IN")})</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
