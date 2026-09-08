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
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  Building,
  Eye,
  EyeOff,
  Check,
  Loader2,
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
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    // Client validation
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
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Registration failed. Please check your information and try again.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen selection:bg-indigo-500 selection:text-white antialiased">
      {/* Main Container */}
      <main className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-[1536px] mx-auto flex items-center justify-center">
        {/* 2-Column Responsive Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-start">
          {/* LEFT COLUMN: Value Proposition & Platform Brand */}
          <section className="lg:col-span-6 xl:col-span-5 bg-gradient-to-b from-indigo-50/70 via-slate-100/60 to-indigo-50/40 border border-slate-200/90 rounded-3xl p-8 sm:p-10 lg:p-12 flex flex-col justify-between shadow-sm relative overflow-hidden">
            {/* Decorative Ambient Blur Background Elements */}
            <div
              aria-hidden="true"
              className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"
            />

            <div className="relative z-10 space-y-8">
              {/* Logo & Brand Header */}
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  PG<span className="text-indigo-600">Master</span>
                </span>
              </Link>

              {/* Headline & Platform Pill Badge */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-700 border border-indigo-200/60 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  PG Owner SaaS Platform
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  Manage Your PG <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600">
                    Like a Pro.
                  </span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                  Automate rent billing, streamline tenant management, and track real-time occupancy across all your properties.
                </p>
              </div>

              {/* Feature Cards Container */}
              <div className="space-y-4 pt-2">
                {/* Feature 1: Automated Anniversary Billing */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex-shrink-0 flex items-center justify-center font-bold text-lg">
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Automated Anniversary Billing</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-normal">
                      Zero manual calculations. Invoices generate on the tenant&apos;s check-in day each month with automated dues tracking.
                    </p>
                  </div>
                </div>

                {/* Feature 2: 360° Tenant CRM & Profiles */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex-shrink-0 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">360° Tenant CRM &amp; Profiles</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-normal">
                      View complete tenant stay histories, contact details, payment receipts, and maintenance logs in one unified CRM view.
                    </p>
                  </div>
                </div>

                {/* Feature 3: Visual Room & Bed Allocation */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex-shrink-0 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Visual Room &amp; Bed Allocation</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-normal">
                      Interactive floor, room, and bed inventory. Real-time visual tracking of occupied, vacant, and maintenance beds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges Footer */}
            <div className="relative z-10 pt-8 mt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Bank-grade 256-bit encryption</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 font-semibold flex items-center gap-1">
                  ★ 4.9/5
                </span>
                <span>rated by 1,200+ PG Owners</span>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Registration Form */}
          <section className="lg:col-span-6 xl:col-span-7">
            <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 md:p-10">
              {/* Form Header */}
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  List Your PG &amp; Create Account
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Set up your PG property and owner profile in less than 2 minutes.
                </p>
              </div>

              {/* Success Banner */}
              {success && (
                <div className="mb-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Your PG Has Been Registered!</h3>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Your owner account and initial property are ready.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-emerald-200">
                    <span>
                      Redirecting to Login portal in <strong>{countdown} seconds</strong>...
                    </span>
                    <Link
                      href="/login"
                      className="font-bold text-indigo-600 underline hover:text-indigo-700 transition-colors"
                    >
                      Click to Sign In Now
                    </Link>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && !success && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Form */}
              {!success && (
                <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning>
                  {/* SECTION 1: Property Information */}
                  <fieldset className="border border-slate-200/90 bg-slate-50/40 rounded-2xl p-5 sm:p-6 transition-all">
                    <legend className="px-2">
                      <div className="inline-flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                          1
                        </span>
                        <span className="text-base font-semibold text-slate-900">
                          Property Information
                        </span>
                      </div>
                    </legend>
                    <p className="text-xs text-slate-500 mt-1 mb-5">
                      Details about your primary PG building
                    </p>

                    <div className="space-y-4">
                      {/* Property Name */}
                      <div>
                        <label
                          htmlFor="propertyName"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
                        >
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          Property / PG Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="propertyName"
                          type="text"
                          name="propertyName"
                          required
                          placeholder="e.g. Royal Living PG & Hostel"
                          value={formData.propertyName}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                        />
                      </div>

                      {/* Street Address */}
                      <div>
                        <label
                          htmlFor="address"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Street Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="address"
                          type="text"
                          name="address"
                          required
                          placeholder="e.g. 104, 5th Cross, Near Metro Station"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                        />
                      </div>

                      {/* 2-Column Grid: City & State */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="city"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                          >
                            City <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="city"
                            type="text"
                            name="city"
                            required
                            placeholder="e.g. Bengaluru"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="state"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                          >
                            State <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="state"
                            type="text"
                            name="state"
                            required
                            placeholder="e.g. Karnataka"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                          />
                        </div>
                      </div>

                      {/* Total Number of Floors */}
                      <div>
                        <label
                          htmlFor="totalFloors"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          Total Number of Floors <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="totalFloors"
                          type="number"
                          name="totalFloors"
                          min="1"
                          max="50"
                          required
                          value={formData.totalFloors}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* SECTION 2: Owner Profile & Credentials */}
                  <fieldset className="border border-slate-200/90 bg-slate-50/40 rounded-2xl p-5 sm:p-6 transition-all">
                    <legend className="px-2">
                      <div className="inline-flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                          2
                        </span>
                        <span className="text-base font-semibold text-slate-900">
                          Owner Profile &amp; Credentials
                        </span>
                      </div>
                    </legend>
                    <p className="text-xs text-slate-500 mt-1 mb-5">
                      Account login credentials for dashboard access
                    </p>

                    <div className="space-y-4">
                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="ownerName"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="ownerName"
                          type="text"
                          name="ownerName"
                          required
                          placeholder="e.g. Rajesh Kumar"
                          value={formData.ownerName}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                        />
                      </div>

                      {/* 2-Column Grid: Email & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="ownerEmail"
                            className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            Work Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="ownerEmail"
                            type="email"
                            name="ownerEmail"
                            required
                            placeholder="e.g. rajesh@example.com"
                            value={formData.ownerEmail}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="ownerPhone"
                            className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="ownerPhone"
                            type="tel"
                            name="ownerPhone"
                            required
                            placeholder="e.g. +91 9876543210"
                            value={formData.ownerPhone}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label
                          htmlFor="password"
                          className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          Account Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            minLength={6}
                            placeholder="•••••••• (at least 6 characters)"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pr-11 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all duration-200 flex items-center justify-center gap-2 group text-sm sm:text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Registering PG &amp; Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Register PG &amp; Launch Dashboard</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sign In Prompt Footer Link */}
                  <div className="text-center pt-2">
                    <p className="text-xs sm:text-sm text-slate-500">
                      Already registered as a PG Owner?{" "}
                      <Link
                        href="/login"
                        className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors ml-1"
                      >
                        Sign in to Dashboard
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
