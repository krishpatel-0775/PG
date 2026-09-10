"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  TrendingUp,
  Receipt,
  Wrench,
  Map,
  Users,
  Timer,
  Calendar,
  Rocket,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      title: "Automated Billing",
      description:
        "Set and forget rent collection. Auto-generate invoices, send reminders, and reconcile payments seamlessly.",
      icon: Receipt,
    },
    {
      title: "Interactive Floor Plans",
      description:
        "Visual bed management. See availability at a glance and assign beds with simple drag-and-drop mechanics.",
      icon: Map,
    },
    {
      title: "Tenant CRM",
      description:
        "Centralize communication. Manage leads, resident documents, complaints, and announcements in one hub.",
      icon: Users,
    },
    {
      title: "Smart Maintenance",
      description:
        "Streamline fixes. Residents log issues via app, you track progress, assign vendors, and monitor costs.",
      icon: Wrench,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-600 selection:text-white transition-colors">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#f8f9ff]/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-600/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              PG<span className="text-indigo-600 dark:text-indigo-400">Manager</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/partner-with-us"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Partner With Us
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-sm font-semibold text-white bg-[#281ec5] hover:bg-indigo-700 px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Login
              </Link>
            </div>
          </nav>

          {/* Mobile Actions & Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Pricing
            </a>
            <Link
              href="/partner-with-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Partner With Us
            </Link>
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN CANVAS */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Column: Heading, Subtitle, CTAs */}
            <div className="flex-1 text-center lg:text-left space-y-6 z-10">
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                Modern Property Management for the Next Gen.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                <span className="hidden sm:inline">
                  Streamline operations, automate billing, and elevate the resident experience with our comprehensive, cloud-native platform built for forward-thinking property managers.
                </span>
                <span className="sm:hidden">
                  Automate billing, track vacancies, and give your tenants a seamless digital experience.
                </span>
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/partner-with-us"
                  className="inline-flex items-center justify-center text-sm sm:text-base font-semibold text-white bg-[#281ec5] hover:bg-indigo-700 px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all hover:scale-[1.01] active:scale-[0.99] text-center"
                >
                  Onboard Your PG
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-8 py-3.5 rounded-xl shadow-sm transition-all text-center"
                >
                  Get Started as Resident
                </Link>
              </div>
            </div>

            {/* Right Column: Floating Bento Mockup Card */}
            <div className="flex-1 w-full relative z-10">
              {/* Subtle background blur aura */}
              <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-3xl blur-3xl -z-10 transform translate-x-6 translate-y-6" />

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/70 dark:shadow-none relative overflow-hidden">
                {/* Top Header Mockup */}
                <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Property Overview</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Revenue */}
                  <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Revenue</span>
                      <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      $124,500
                    </div>
                    <div className="mt-2.5 flex items-center">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        +14% vs last month
                      </span>
                    </div>
                  </div>

                  {/* Occupancy Rate */}
                  <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Occupancy Rate</span>
                      <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      94.2%
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-4 overflow-hidden">
                      <div className="bg-[#281ec5] h-full rounded-full w-[94.2%]" />
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="sm:col-span-2 bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Recent Activity
                    </span>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100/60 dark:border-slate-700/40">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Receipt className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                            Rent Paid - Room 402
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Just now</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100/60 dark:border-slate-700/40">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Wrench className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                            Maintenance Req - Plumbing
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">2h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. KPI BADGES SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            {/* Metric 1 */}
            <div className="flex-1 w-full flex flex-col items-center justify-center py-2 md:py-0 text-center space-y-1">
              <div className="md:hidden w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-[#281ec5] dark:text-indigo-400 tracking-tight">
                99.8%
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                On-Time Collection
              </span>
            </div>

            {/* Metric 2 */}
            <div className="flex-1 w-full flex flex-col items-center justify-center pt-6 md:pt-0 text-center space-y-1">
              <div className="md:hidden w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-[#281ec5] dark:text-indigo-400 tracking-tight">
                Zero
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Double-Booking
              </span>
            </div>

            {/* Metric 3 */}
            <div className="flex-1 w-full flex flex-col items-center justify-center pt-6 md:pt-0 text-center space-y-1">
              <div className="md:hidden w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-[#281ec5] dark:text-indigo-400 tracking-tight">
                Instant
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Setup
              </span>
            </div>
          </div>
        </section>

        {/* 4. FEATURES GRID SECTION */}
        <section id="features" className="bg-[#f0f4ff]/50 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Everything you need to run your property.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Powerful tools designed specifically for hostels, PGs, and co-living spaces.
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-[#281ec5] dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2.5">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
              PG<span className="text-indigo-600 dark:text-indigo-400">Manager</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              About Us
            </a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Contact
            </a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Privacy
            </a>
          </nav>

          {/* Copyright */}
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 text-center md:text-right">
            © 2024 PGManager. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
