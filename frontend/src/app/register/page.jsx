"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Building2,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "ROLE_TENANT",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
      });

      // On successful registration, redirect to login
      router.push("/login");
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Registration failed. Please verify your information and try again.";

      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create an Account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Join the PG Management platform as a tenant, owner, or staff
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-8">
          {/* Error message alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top duration-200"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Phone Number
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-5 h-5" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Role
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="h-5 h-5" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm appearance-none cursor-pointer"
                >
                  <option value="ROLE_TENANT" className="bg-slate-900 text-white">
                    Tenant (Resident)
                  </option>
                  <option value="ROLE_PG_OWNER" className="bg-slate-900 text-white">
                    PG Owner (Property Manager)
                  </option>
                  <option value="ROLE_STAFF" className="bg-slate-900 text-white">
                    Staff (Maintenance & Support)
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Redirect to Login */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
              >
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
