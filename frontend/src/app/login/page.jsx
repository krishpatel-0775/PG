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
  ArrowRight,
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your PG Management portal
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

          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
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
                  suppressHydrationWarning
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Password
                </label>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
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
                  suppressHydrationWarning
                  className="block w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  suppressHydrationWarning
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
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
          </form>

          {/* Redirect to Register */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
              >
                Create an account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
