"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Building2,
  Plus,
  MapPin,
  Layers,
  Bed,
  Home,
  ArrowRight,
  Search,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function PropertiesListPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/properties");
      setProperties(response.data || []);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load properties. Please try again.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      p.address?.toLowerCase().includes(query)
    );
  });

  const totalRooms = properties.reduce((acc, p) => acc + (p.totalRooms || 0), 0);
  const totalBeds = properties.reduce((acc, p) => acc + (p.totalBeds || 0), 0);
  const vacantBeds = properties.reduce((acc, p) => acc + (p.vacantBeds || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link
                href="/dashboard"
                className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-200">Properties</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400" />
              My Properties
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your buildings, floors, rooms, and bed allocations
            </p>
          </div>

          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99] self-start sm:self-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </Link>
        </div>

        {/* Metrics Overview */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400">Total Properties</div>
              <div className="mt-1 text-2xl font-bold text-white">{properties.length}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400">Total Rooms</div>
              <div className="mt-1 text-2xl font-bold text-indigo-400">{totalRooms}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400">Total Beds</div>
              <div className="mt-1 text-2xl font-bold text-purple-400">{totalBeds}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400">Vacant Beds</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">{vacantBeds}</div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {properties.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search properties by name, city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading your properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {searchQuery ? "No properties match your search" : "No properties found"}
            </h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching with a different property name or location keyword."
                : "You haven't added any PG properties yet. Get started by creating your first property."}
            </p>
            {!searchQuery && (
              <Link
                href="/dashboard/properties/new"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-sm shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Property
              </Link>
            )}
          </div>
        ) : (
          /* Property Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                className="group cursor-pointer bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      {property.totalFloors} {property.totalFloors === 1 ? "Floor" : "Floors"}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {property.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
                      <span>
                        {property.address}, {property.city}, {property.state}
                      </span>
                    </p>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
                    <div className="bg-slate-950/50 rounded-lg p-2">
                      <div className="text-[11px] text-slate-400">Rooms</div>
                      <div className="text-sm font-bold text-white">{property.totalRooms || 0}</div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2">
                      <div className="text-[11px] text-slate-400">Total Beds</div>
                      <div className="text-sm font-bold text-white">{property.totalBeds || 0}</div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2">
                      <div className="text-[11px] text-emerald-400 font-medium">Vacant</div>
                      <div className="text-sm font-bold text-emerald-400">{property.vacantBeds || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Footer action link */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-sm text-slate-400 group-hover:text-indigo-400">
                  <span className="text-xs font-medium">View Rooms & Beds</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
