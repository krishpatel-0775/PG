"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Building2,
  Users,
  IndianRupee,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  Building,
  Eye,
  EyeOff,
  Star,
  Check,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function PartnerWithUsPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Owner Details
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    password: "",
    // Property Details
    propertyName: "",
    address: "",
    city: "",
    state: "",
    totalFloors: 1,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalFloors" ? Number(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    // Basic client validation
    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/public/onboard-pg`, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201 || response.status === 200) {
        setSuccess(true);
        let count = 3;
        const interval = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(interval);
            router.push("/login");
          }
        }, 1000);
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please check your information and try again.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* LEFT SIDE: Brand & Value Proposition (45% on desktop) */}
      <div className="lg:w-5/12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top: Logo & Breadcrumb */}
        <div className="relative z-10 space-y-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              PG<span className="text-indigo-400">Master</span>
            </span>
          </Link>

          <div className="space-y-3 pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              PG Owner SaaS Platform
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Manage Your PG <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400">
                Like a Pro.
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Automate rent billing, streamline tenant management, and track real-time occupancy across all your properties.
            </p>
          </div>
        </div>

        {/* Middle: 3 Core Value Props */}
        <div className="relative z-10 my-10 space-y-5">
          {/* Benefit 1 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Automated Anniversary Billing</h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero manual calculations. Invoices generate on the tenant's check-in day each month with automated dues tracking.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">360° Tenant CRM & Profiles</h3>
              <p className="text-xs text-slate-400 mt-1">
                View complete tenant stay histories, contact details, payment receipts, and maintenance logs in one unified CRM view.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Visual Room & Bed Allocation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Interactive floor, room, and bed inventory. Real-time visual tracking of occupied, vacant, and maintenance beds.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Trust & Stats */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Bank-grade 256-bit encryption</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-bold text-slate-200">4.9/5</span>
            <span className="text-slate-500">by PG Owners</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Onboarding Registration Form (55% on desktop) */}
      <div className="lg:w-7/12 p-6 sm:p-10 lg:p-14 flex items-center justify-center bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              List Your PG & Create Account
            </h2>
            <p className="text-sm text-slate-400">
              Set up your PG property and owner profile in less than 2 minutes.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-3 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Your PG Has Been Registered!</h3>
                  <p className="text-xs text-emerald-300/90">
                    Your owner account and initial property are ready.
                  </p>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-300 border-t border-emerald-500/20">
                <span>Redirecting to Login portal in <strong>{countdown} seconds</strong>...</span>
                <Link
                  href="/login"
                  className="font-bold text-white underline hover:text-emerald-300 transition-colors"
                >
                  Click to Sign In Now
                </Link>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && !success && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Error:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION 1: Property Details */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Property Information</h3>
                    <p className="text-xs text-slate-400">Details about your primary PG building</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Property Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Property / PG Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="propertyName"
                      required
                      placeholder="e.g. Royal Living PG & Hostel"
                      value={formData.propertyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Street Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="e.g. 104, 5th Cross, Near Metro Station"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="e.g. Bengaluru"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      placeholder="e.g. Karnataka"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Total Floors */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Total Number of Floors <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="totalFloors"
                      min="1"
                      max="50"
                      required
                      value={formData.totalFloors}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Owner Account Details */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Owner Profile & Credentials</h3>
                    <p className="text-xs text-slate-400">Account login credentials for dashboard access</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="ownerEmail"
                      required
                      placeholder="e.g. rajesh@example.com"
                      value={formData.ownerEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Account Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        minLength={6}
                        placeholder="•••••••• (at least 6 characters)"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-4 pr-11 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 border border-indigo-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Registering your PG & Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register PG & Launch Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Footer Switcher */}
              <div className="text-center pt-2 text-xs text-slate-400">
                Already registered as a PG Owner?{" "}
                <Link
                  href="/login"
                  className="font-bold text-indigo-400 hover:text-indigo-300 underline transition-colors"
                >
                  Sign in to Dashboard
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
