"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 shadow-lg shadow-indigo-500/10">
          <Building2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-bold mb-2">PG Management System</h1>
        <p className="text-slate-400 text-sm mb-6">
          Redirecting to authentication portal...
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
