"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      const response = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      const { token, role, name, email } = response.data;

      if (token) {
        // Store auth tokens and user details in cookies
        Cookies.set("token", token, { expires: 7, sameSite: "lax" });
        if (role) Cookies.set("role", role, { expires: 7, sameSite: "lax" });
        if (name) Cookies.set("user_name", name, { expires: 7, sameSite: "lax" });
        if (email) Cookies.set("user_email", email, { expires: 7, sameSite: "lax" });

        router.push("/dashboard");
      } else {
        setErrorMessage("Authentication failed: No token received.");
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Invalid email or password. Please try again.";

      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white relative"
      style={{
        backgroundImage:
          "radial-gradient(at 50% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 65%), radial-gradient(at 100% 0%, rgba(147, 197, 253, 0.06) 0px, transparent 40%)",
      }}
    >
      {/* Platform brand logo and title */}
      <header className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            PG<span className="text-indigo-600">Manager</span>
          </span>
        </Link>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-7 sm:p-9 relative overflow-hidden backdrop-blur-sm">
          {/* Top Squircle Card Header */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner mb-4 transition-transform hover:scale-105 duration-200">
              <LogIn className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-sm text-center mt-1.5 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Sign in to access your PG Management portal.</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Resident
              </span>
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Card Footer Navigation */}
          <footer className="mt-7 pt-6 border-t border-slate-100 text-center space-y-3.5">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 group"
              >
                <span>Create Account</span>
                <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </p>
            <p className="text-xs text-slate-500">
              Are you a PG Owner?{" "}
              <Link
                href="/partner-with-us"
                className="font-semibold text-slate-700 hover:text-indigo-600 underline underline-offset-2 transition-colors"
              >
                List Your PG Here
              </Link>
            </p>
          </footer>
        </div>
      </main>

      {/* Legal & Meta Links */}
      <aside className="mt-8 text-center text-xs text-slate-400 max-w-md mx-auto space-y-2">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">
            Terms of Service
          </a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Help Center
          </a>
        </div>
        <p className="text-[11px] text-slate-400">
          PGManager Cloud Technologies Inc. © 2025. All rights reserved.
        </p>
      </aside>
    </div>
  );
}
