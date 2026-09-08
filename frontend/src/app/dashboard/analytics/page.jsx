"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Bed,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  PieChart as PieIcon,
  Sparkles,
  UserPlus,
  Wrench,
  IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdvancedAnalyticsPage() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Fetch properties list on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoadingProperties(true);
    setErrorMessage("");
    try {
      const response = await api.get("/properties");
      const props = response.data || [];
      setProperties(props);
      if (props.length > 0) {
        setSelectedPropertyId(props[0].id.toString());
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load properties list.";
      setErrorMessage(backendMessage);
    } finally {
      setLoadingProperties(false);
    }
  };

  // 2. Fetch analytics whenever selectedPropertyId changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchAnalytics(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchAnalytics = async (propertyId) => {
    setLoadingAnalytics(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/analytics/property/${propertyId}`);
      setAnalytics(response.data);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load analytics data for the selected property.";
      setErrorMessage(backendMessage);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Calculate Occupancy Metrics
  const occupancyMetrics = useMemo(() => {
    if (!analytics || !analytics.currentOccupancy) {
      return { total: 0, occupied: 0, vacant: 0, maintenance: 0, rate: 0 };
    }
    const { occupied, vacant, maintenance } = analytics.currentOccupancy;
    const total = occupied + vacant + maintenance;
    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, vacant, maintenance, rate };
  }, [analytics]);

  // Occupancy Donut Chart Data
  const occupancyChartData = useMemo(() => {
    if (!analytics || !analytics.currentOccupancy) return [];
    return [
      { name: "Occupied", value: analytics.currentOccupancy.occupied, color: "#4f46e5" },
      { name: "Vacant", value: analytics.currentOccupancy.vacant, color: "#10b981" },
      { name: "Maintenance", value: analytics.currentOccupancy.maintenance, color: "#f59e0b" },
    ].filter((item) => item.value > 0);
  }, [analytics]);

  // Total Complaints Count
  const totalComplaintsCount = useMemo(() => {
    if (!analytics || !analytics.complaintsByCategory) return 0;
    return analytics.complaintsByCategory.reduce((acc, c) => acc + (c.count || 0), 0);
  }, [analytics]);

  // Custom Light Tooltip for Revenue Chart
  const CustomRevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900 font-mono">
                ₹{Number(entry.value).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Light Tooltip for Occupancy Donut Chart
  const CustomOccupancyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xl text-xs">
          <p className="font-semibold text-slate-800 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            {data.name}: <strong className="text-indigo-600">{data.value} Beds</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900">Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            Property Performance &amp; Analytics
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Visual revenue trends, real-time occupancy distribution, and operational complaint metrics.
          </p>
        </div>

        {/* Top Right Property Filter Dropdown & Refresh */}
        <div className="flex items-center gap-3 flex-wrap">
          {properties.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
              <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-800">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (selectedPropertyId) fetchAnalytics(selectedPropertyId);
            }}
            disabled={loadingAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${loadingAnalytics ? "animate-spin text-indigo-600" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Empty State: No Properties */}
      {!loadingProperties && properties.length === 0 && (
        <div className="py-20 px-4 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Properties Found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Please create a PG Property first to view revenue trends and occupancy analytics.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all"
            >
              Go to Properties
            </Link>
          </div>
        </div>
      )}

      {/* Content Section */}
      {properties.length > 0 && (
        <div className="space-y-8">
          {/* Top Row: 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Expected Revenue */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Monthly Expected
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loadingAnalytics ? (
                    <span className="inline-block w-24 h-8 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    `₹${formatCurrency(analytics?.currentMonthTotalExpected || 0)}`
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Target rent billing for current cycle
              </p>
            </div>

            {/* Card 2: New Check-ins */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  New Check-ins
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UserPlus className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loadingAnalytics ? (
                    <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    `${analytics?.newCheckInsThisMonth || 0} Tenants`
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-indigo-700 font-medium">
                Allocations started this calendar month
              </p>
            </div>

            {/* Card 3: Occupancy Rate */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Occupancy Rate
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Bed className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loadingAnalytics ? (
                    <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    `${occupancyMetrics.rate}%`
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500">
                  ({occupancyMetrics.occupied}/{occupancyMetrics.total} beds)
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${occupancyMetrics.rate}%` }}
                />
              </div>
            </div>

            {/* Card 4: Open Complaints */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Issues Logged
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loadingAnalytics ? (
                    <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    `${totalComplaintsCount} Tickets`
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-700 font-medium">
                Categorized operational service requests
              </p>
            </div>
          </div>

          {/* Middle Row: Revenue Trend (Left 2/3) & Occupancy Donut (Right 1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 6-Month Revenue Trend (Left 2/3) */}
            <div className="lg:col-span-2 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    6-Month Revenue Trend
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Collected vs Pending rent collections across billing cycles
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-semibold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 hidden sm:inline">
                  Past 6 Months
                </span>
              </div>

              <div className="h-[320px] w-full">
                {loadingAnalytics ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
                    <span>Loading trend chart...</span>
                  </div>
                ) : !analytics?.sixMonthRevenueTrend || analytics.sixMonthRevenueTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No historical invoice data available for this property.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.sixMonthRevenueTrend}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickFormatter={(value) => `₹${Number(value) >= 1000 ? `${value / 1000}k` : value}`}
                      />
                      <Tooltip content={<CustomRevenueTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
                      />
                      <Bar
                        dataKey="collected"
                        name="Collected"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="pending"
                        name="Pending"
                        fill="#f43f5e"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Current Occupancy Donut Chart (Right 1/3) */}
            <div className="lg:col-span-1 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-indigo-600" />
                  Bed Occupancy
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live inventory status across all rooms
                </p>
              </div>

              <div className="h-[220px] w-full relative flex items-center justify-center">
                {loadingAnalytics ? (
                  <div className="flex items-center text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
                    Loading occupancy...
                  </div>
                ) : occupancyMetrics.total === 0 ? (
                  <div className="text-slate-400 text-xs text-center">
                    No beds registered in this property.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomOccupancyTooltip />} />
                      <Pie
                        data={occupancyChartData}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {occupancyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* Centered Total Beds Count */}
                {!loadingAnalytics && occupancyMetrics.total > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {occupancyMetrics.total}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Total Beds
                    </span>
                  </div>
                )}
              </div>

              {/* Occupancy Legend Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-indigo-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    {occupancyMetrics.occupied}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Occupied</span>
                </div>

                <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {occupancyMetrics.vacant}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Vacant</span>
                </div>

                <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-amber-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {occupancyMetrics.maintenance}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Maint.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Complaints by Category */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  Complaints &amp; Maintenance by Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identify recurring maintenance and service friction points
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                {totalComplaintsCount} Total Complaints
              </span>
            </div>

            {/* Horizontal Bar Chart & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Horizontal Bar Chart (2/3 width) */}
              <div className="lg:col-span-2 h-[260px] w-full">
                {loadingAnalytics ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
                    Loading complaints breakdown...
                  </div>
                ) : !analytics?.complaintsByCategory || totalComplaintsCount === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
                    <p className="text-slate-800 font-semibold">Zero Complaints Reported</p>
                    <p>All tenant facilities and maintenance tickets are clear!</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={analytics.complaintsByCategory.filter((c) => c.count > 0)}
                      margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="category"
                        stroke="#64748b"
                        fontSize={11}
                        width={95}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} Issues`, "Count"]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#0f172a",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Right Breakdown Cards List */}
              <div className="lg:col-span-1 space-y-2.5">
                {analytics?.complaintsByCategory?.map((item) => (
                  <div
                    key={item.category}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {item.category}
                    </span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full ${
                        item.count > 0
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
