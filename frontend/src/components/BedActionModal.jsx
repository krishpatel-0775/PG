"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  X,
  Bed as BedIcon,
  User,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  LogOut,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserPlus,
  Info,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function BedActionModal({ isOpen, onClose, bed, room, onSuccess }) {
  // Common states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Occupied bed state
  const [allocation, setAllocation] = useState(null);

  // Vacant bed form state (Phone is primary key)
  const [formData, setFormData] = useState({
    tenantPhone: "",
    tenantName: "",
    tenantEmail: "",
    checkInDate: new Date().toISOString().split("T")[0],
    monthlyRent: "",
    depositAmount: "",
  });

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(null); // 'FOUND', 'NOT_FOUND', null

  // Reset or fetch allocation details when modal opens
  useEffect(() => {
    if (!isOpen || !bed) {
      setAllocation(null);
      setErrorMessage("");
      setSuccessMessage("");
      setLookupStatus(null);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (bed.status === "OCCUPIED") {
      fetchOccupiedAllocation(bed.id);
    } else if (bed.status === "VACANT") {
      // Pre-fill default monthly rent from room base rent if available
      setFormData({
        tenantPhone: "",
        tenantName: "",
        tenantEmail: "",
        checkInDate: new Date().toISOString().split("T")[0],
        monthlyRent: room?.baseRent || "",
        depositAmount: room?.baseRent ? room.baseRent : "",
      });
      setLookupStatus(null);
    }
  }, [isOpen, bed, room]);

  const fetchOccupiedAllocation = async (bedId) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/allocations/bed/${bedId}`);
      setAllocation(response.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load tenant allocation details.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Lookup existing user by Mobile Phone number onBlur
  const handlePhoneBlur = async () => {
    const phone = formData.tenantPhone.trim();
    // Validate minimal length for mobile numbers (e.g. 10 digits)
    if (!phone || phone.length < 10) {
      setLookupStatus(null);
      return;
    }

    setLookupLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/users/lookup?phone=${encodeURIComponent(phone)}`);
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          tenantName: response.data.name || prev.tenantName,
          tenantEmail:
            response.data.email && !response.data.email.includes("@temp.")
              ? response.data.email
              : prev.tenantEmail,
        }));
        setLookupStatus("FOUND");
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setLookupStatus("NOT_FOUND");
      } else {
        setLookupStatus(null);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "tenantPhone") {
      setLookupStatus(null);
    }
    if (errorMessage) setErrorMessage("");
  };

  // Handle Bed Allocation Form Submission
  const handleAssignTenant = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setActionLoading(true);

    try {
      await api.post("/allocations", {
        tenantPhone: formData.tenantPhone.trim(),
        tenantName: formData.tenantName.trim(),
        tenantEmail: formData.tenantEmail?.trim() || null,
        bedId: bed.id,
        checkInDate: formData.checkInDate,
        depositAmount: Number(formData.depositAmount),
        monthlyRent: Number(formData.monthlyRent),
      });

      setSuccessMessage("Bed allocated successfully!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to assign tenant to bed.";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Checkout of Occupied Bed
  const handleCheckout = async () => {
    if (!allocation?.id) return;
    const confirmCheckout = window.confirm(
      `Are you sure you want to check out ${allocation.tenantName || "this tenant"}? The bed will revert to VACANT.`
    );
    if (!confirmCheckout) return;

    setActionLoading(true);
    setErrorMessage("");
    try {
      await api.post(`/allocations/${allocation.id}/checkout`);
      setSuccessMessage("Tenant checked out successfully.");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to process tenant checkout.";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !bed) return null;

  const isOccupied = bed.status === "OCCUPIED";
  const isVacant = bed.status === "VACANT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isOccupied
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
              }`}
            >
              <BedIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Bed {bed.bedNumber}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isOccupied
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : isVacant
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {bed.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Room {room?.roomNumber} &bull; Floor {room?.floor}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2.5 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start gap-2.5 text-xs animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* OCCUPIED VIEW */}
          {isOccupied && (
            <>
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-400">Loading tenant details...</p>
                </div>
              ) : allocation ? (
                <div className="space-y-4">
                  {/* Tenant Profile Box */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
                        {allocation.tenantName ? allocation.tenantName[0].toUpperCase() : "T"}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">
                          {allocation.tenantName}
                        </div>
                        {allocation.tenantPhone && (
                          <div className="text-xs text-emerald-400 flex items-center gap-1 font-mono font-medium mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {allocation.tenantPhone}
                          </div>
                        )}
                      </div>
                    </div>

                    {allocation.tenantEmail && !allocation.tenantEmail.includes("@temp.") && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{allocation.tenantEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial & Lease Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Monthly Rent</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        ₹{Number(allocation.monthlyRent)?.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Security Deposit</div>
                      <div className="text-base font-bold text-purple-400 mt-0.5">
                        ₹{Number(allocation.depositAmount)?.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Check-In Date:</span>
                    </div>
                    <span className="font-semibold text-white">
                      {allocation.checkInDate}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Checkout Tenant</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active allocation found for this bed.
                </div>
              )}
            </>
          )}

          {/* VACANT BED ASSIGNMENT FORM (PHONE-FIRST LOGIC) */}
          {isVacant && (
            <form onSubmit={handleAssignTenant} className="space-y-4" suppressHydrationWarning>
              {/* Tenant Mobile Phone Number (Primary Key) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="tenantPhone"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Tenant Mobile Number *
                  </label>
                  {lookupLoading && (
                    <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking phone...
                    </span>
                  )}
                  {lookupStatus === "FOUND" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Existing Tenant Found
                    </span>
                  )}
                  {lookupStatus === "NOT_FOUND" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      <Sparkles className="w-3 h-3" /> New Tenant Account
                    </span>
                  )}
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="tenantPhone"
                    name="tenantPhone"
                    type="tel"
                    required
                    value={formData.tenantPhone}
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    placeholder="e.g. 9876543210"
                    className="block w-full pl-9 pr-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Tab or click outside to auto-fill existing tenant details
                </p>
              </div>

              {/* Full Name & Optional Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="tenantName"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Full Name *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="tenantName"
                      name="tenantName"
                      type="text"
                      required
                      value={formData.tenantName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="block w-full pl-9 pr-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="tenantEmail"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Email Address (Optional)
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="tenantEmail"
                      name="tenantEmail"
                      type="email"
                      value={formData.tenantEmail}
                      onChange={handleChange}
                      placeholder="tenant@example.com"
                      className="block w-full pl-9 pr-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Check-In Date */}
              <div>
                <label
                  htmlFor="checkInDate"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Check-In Date *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    id="checkInDate"
                    name="checkInDate"
                    type="date"
                    required
                    value={formData.checkInDate}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
                  />
                </div>
              </div>

              {/* Rent and Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="monthlyRent"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Monthly Rent (₹) *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      ₹
                    </div>
                    <input
                      id="monthlyRent"
                      name="monthlyRent"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.monthlyRent}
                      onChange={handleChange}
                      placeholder="e.g. 8000"
                      className="block w-full pl-8 pr-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="depositAmount"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Security Deposit (₹) *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      ₹
                    </div>
                    <input
                      id="depositAmount"
                      name="depositAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.depositAmount}
                      onChange={handleChange}
                      placeholder="e.g. 10000"
                      className="block w-full pl-8 pr-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Shadow user notice */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>
                  If this tenant is not yet registered, a shadow profile linked to this mobile number will be created. When they sign up using this phone number, their account will sync automatically.
                </span>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99]"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Allocating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Bed</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* MAINTENANCE BED VIEW */}
          {!isOccupied && !isVacant && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <BedIcon className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                Bed Under Maintenance
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                This bed is currently marked for maintenance and cannot be allocated.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
