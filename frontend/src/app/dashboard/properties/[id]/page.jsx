"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Building2,
  MapPin,
  Plus,
  ArrowLeft,
  Bed as BedIcon,
  Wind,
  Layers,
  IndianRupee,
  AlertCircle,
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import BedActionModal from "@/components/BedActionModal";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleBedClick = (bed, room) => {
    setSelectedBed(bed);
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/properties/${propertyId}`);
      setProperty(response.data);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load property details.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper for bed color-coding styling
  const getBedStatusStyle = (status) => {
    switch (status) {
      case "VACANT":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          dot: "bg-emerald-400",
          label: "Vacant",
          icon: CheckCircle2,
        };
      case "OCCUPIED":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          text: "text-rose-400",
          dot: "bg-rose-400",
          label: "Occupied",
          icon: XCircle,
        };
      case "MAINTENANCE":
      default:
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
          dot: "bg-amber-400",
          label: "Maintenance",
          icon: AlertTriangle,
        };
    }
  };

  // Format Room Type to readable title
  const formatRoomType = (type) => {
    switch (type) {
      case "SINGLE":
        return "Single Occupancy";
      case "DOUBLE":
        return "2-Sharing (Double)";
      case "TRIPLE":
        return "3-Sharing (Triple)";
      case "FOUR_SHARING":
        return "4-Sharing (Quad)";
      default:
        return type || "Standard Room";
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!property?.rooms) return [];
    return property.rooms.filter((room) => {
      const matchFloor =
        floorFilter === "ALL" || room.floor.toString() === floorFilter;
      const matchType = typeFilter === "ALL" || room.roomType === typeFilter;
      return matchFloor && matchType;
    });
  }, [property, floorFilter, typeFilter]);

  // Unique floors available in property
  const availableFloors = useMemo(() => {
    if (!property?.rooms) return [];
    const floors = new Set(property.rooms.map((r) => r.floor));
    return Array.from(floors).sort((a, b) => a - b);
  }, [property]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link
                href="/dashboard/properties"
                className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Properties
              </Link>
              <span>/</span>
              <span className="text-slate-200">{property?.name || "Property Details"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400" />
              {property?.name || "Loading..."}
            </h1>

            {property && (
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {property.address}, {property.city}, {property.state} &bull;{" "}
                <span className="text-slate-300 font-medium">
                  {property.totalFloors} {property.totalFloors === 1 ? "Floor" : "Floors"}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href={`/dashboard/properties/${propertyId}/add-room`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99] text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </Link>
          </div>
        </div>

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

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading rooms and beds...</p>
          </div>
        ) : !property ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <p className="text-slate-400">Property not found.</p>
          </div>
        ) : (
          <>
            {/* Overview Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Total Rooms</div>
                <div className="mt-1 text-2xl font-bold text-white">
                  {property.totalRooms || 0}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Total Beds</div>
                <div className="mt-1 text-2xl font-bold text-purple-400">
                  {property.totalBeds || 0}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Vacant Beds
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-400">
                  {property.vacantBeds || 0}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Occupied Beds
                </div>
                <div className="mt-1 text-2xl font-bold text-rose-400">
                  {property.occupiedBeds || 0}
                </div>
              </div>
            </div>

            {/* Filter controls & legend */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
                  <Filter className="w-3.5 h-3.5" />
                  Filters:
                </div>

                {/* Floor Filter */}
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Floors</option>
                  {availableFloors.map((floor) => (
                    <option key={floor} value={floor.toString()}>
                      Floor {floor}
                    </option>
                  ))}
                </select>

                {/* Room Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Sharing Types</option>
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double (2)</option>
                  <option value="TRIPLE">Triple (3)</option>
                  <option value="FOUR_SHARING">Four Sharing (4)</option>
                </select>
              </div>

              {/* Status Indicator Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" />
                  <span className="text-slate-300">Vacant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-rose-500/20" />
                  <span className="text-slate-300">Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-500/20" />
                  <span className="text-slate-300">Maintenance</span>
                </div>
              </div>
            </div>

            {/* Rooms Grid */}
            {filteredRooms.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <BedIcon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-white">No rooms found</h3>
                <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
                  {property.rooms?.length === 0
                    ? "Start creating rooms and beds for this property."
                    : "No rooms match your active filter criteria."}
                </p>
                {property.rooms?.length === 0 && (
                  <Link
                    href={`/dashboard/properties/${propertyId}/add-room`}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-sm shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Room
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Room Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white tracking-tight">
                            Room {room.roomNumber}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            Floor {room.floor}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatRoomType(room.roomType)}
                        </div>
                      </div>

                      {/* AC Badge */}
                      {room.hasAc ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <Wind className="w-3 h-3" /> AC
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Non-AC
                        </span>
                      )}
                    </div>

                    {/* Rent details */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Base Rent:</span>
                      <span className="font-semibold text-white text-sm">
                        ₹{room.baseRent?.toLocaleString("en-IN")} / mo
                      </span>
                    </div>

                    {/* Beds Grid */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Beds ({room.beds?.length || 0})
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {room.beds?.map((bed) => {
                          const statusStyle = getBedStatusStyle(bed.status);
                          return (
                            <button
                              key={bed.id}
                              type="button"
                              onClick={() => handleBedClick(bed, room)}
                              className={`text-left flex flex-col justify-between p-2.5 rounded-xl border ${statusStyle.bg} ${statusStyle.border} hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group/bed focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white flex items-center gap-1.5 group-hover/bed:text-indigo-300 transition-colors">
                                  <BedIcon className="w-3.5 h-3.5 text-slate-400 group-hover/bed:text-indigo-400 transition-colors" />
                                  {bed.bedNumber}
                                </span>
                                <span
                                  className={`w-2 h-2 rounded-full ${statusStyle.dot}`}
                                  title={statusStyle.label}
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[11px]">
                                <span className={`font-semibold ${statusStyle.text}`}>
                                  {statusStyle.label}
                                </span>
                                <span className="text-[10px] text-slate-500 group-hover/bed:text-slate-300 transition-colors">
                                  {bed.status === "OCCUPIED" ? "View Tenant →" : "Assign →"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Unified Bed Action Modal */}
        <BedActionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          bed={selectedBed}
          room={selectedRoom}
          onSuccess={fetchPropertyDetails}
        />
      </div>
    </div>
  );
}
