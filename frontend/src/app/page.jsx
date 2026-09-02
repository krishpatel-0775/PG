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
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#f8f9ff]/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              PG<span className="text-indigo-600">Manager</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Resident Login
            </Link>
            <Link
              href="/partner-with-us"
              className="inline-flex items-center justify-center text-sm font-semibold text-white bg-[#281ec5] hover:bg-indigo-700 px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Partner With Us
            </Link>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-indigo-600 py-1"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-indigo-600 py-1"
            >
              Pricing
            </a>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-indigo-600 py-1"
            >
              Resident Login
            </Link>
            <div className="pt-2">
              <Link
                href="/partner-with-us"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center text-sm font-semibold text-white bg-[#281ec5] hover:bg-indigo-700 px-5 py-3 rounded-xl shadow-md shadow-indigo-600/20"
              >
                Partner With Us
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
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Modern Property Management for the Next Gen.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
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
                  className="inline-flex items-center justify-center text-sm sm:text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 px-8 py-3.5 rounded-xl shadow-sm transition-all text-center"
                >
                  Get Started as Resident
                </Link>
              </div>
            </div>

            {/* Right Column: Floating Bento Mockup Card */}
            <div className="flex-1 w-full relative z-10">
              {/* Subtle background blur aura */}
              <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-3xl -z-10 transform translate-x-6 translate-y-6" />

              <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/70 relative overflow-hidden">
                {/* Top Header Mockup */}
                <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800">Property Overview</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-100" />
                    <div className="w-5 h-5 rounded-full bg-slate-100" />
                  </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Revenue */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-slate-500">Monthly Revenue</span>
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      $124,500
                    </div>
                    <div className="mt-2.5 flex items-center">
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +14% vs last month
                      </span>
                    </div>
                  </div>

                  {/* Occupancy Rate */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-slate-500">Occupancy Rate</span>
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      94.2%
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                      <div className="bg-[#281ec5] h-full rounded-full w-[94.2%]" />
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="sm:col-span-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Recent Activity
                    </span>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/60">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Receipt className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-800">
                            Rent Paid - Room 402
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">Just now</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/60">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Wrench className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-800">
                            Maintenance Req - Plumbing
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">2h ago</span>
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
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Metric 1 */}
            <div className="flex-1 w-full flex flex-col items-center justify-center py-2 md:py-0 text-center space-y-1">
              <div className="md:hidden w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-[#281ec5] tracking-tight">
                99.8%
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                On-Time Collection
              </span>
            </div>

            {/* Metric 2 */}
            <div className="flex-1 w-full flex flex-col items-center justify-center pt-6 md:pt-0 text-center space-y-1">
              <div className="md:hidden w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-[#281ec5] tracking-tight">
                Zero
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Double-Booking
              </span>
            </div>

            {/* Metric 3 */}
            <div className="flex-1 w-full flex flex-col items-center justify-center pt-6 md:pt-0 text-center space-y-1">
              <div className="md:hidden w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-[#281ec5] tracking-tight">
                Instant
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Setup
              </span>
            </div>
          </div>
        </section>

        {/* 4. FEATURES GRID SECTION */}
        <section id="features" className="bg-[#f0f4ff]/50 border-t border-slate-200/80 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Everything you need to run your property.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
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
                    className="bg-white rounded-2xl sm:rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#281ec5] mb-6 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
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
      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight">
              PG<span className="text-indigo-600">Manager</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              About Us
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Contact
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Privacy
            </a>
          </nav>

          {/* Copyright */}
          <div className="text-xs sm:text-sm text-slate-500 text-center md:text-right">
            © 2024 PGManager. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
