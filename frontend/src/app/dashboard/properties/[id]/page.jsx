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
  Pencil,
  Trash2,
} from "lucide-react";
import BedActionModal from "@/components/BedActionModal";
import EditPropertyModal from "@/components/EditPropertyModal";
import EditRoomModal from "@/components/EditRoomModal";
import EditBedModal from "@/components/EditBedModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Existing Bed Action Modal (Allocation / Check-in / Checkout)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Edit Modals State
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBed, setEditingBed] = useState(null);

  // Delete Confirmation State
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    itemDetails: "",
    endpoint: "",
    onSuccess: null,
  });

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

  // ===========================================================================
  // Edit & Delete Event Handlers
  // ===========================================================================

  const handlePropertyUpdated = (updated) => {
    setProperty((prev) => ({
      ...prev,
      ...updated,
      rooms: prev?.rooms || updated.rooms || [],
    }));
  };

  const handleRoomUpdated = (updatedRoom) => {
    setProperty((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).map((r) =>
        r.id === updatedRoom.id ? { ...r, ...updatedRoom, beds: r.beds } : r
      ),
    }));
  };

  const handleBedUpdated = (updatedBed) => {
    setProperty((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).map((r) => ({
        ...r,
        beds: (r.beds || []).map((b) => (b.id === updatedBed.id ? { ...b, ...updatedBed } : b)),
      })),
    }));
  };

  const handleDeleteProperty = () => {
    setDeleteModalConfig({
      isOpen: true,
      title: `Delete Property: ${property?.name}`,
      message: "Are you sure? This action cannot be undone and permanently deletes this property.",
      itemDetails:
        "Note: Deletion will be rejected if any room has occupied or active beds.",
      endpoint: `/properties/${propertyId}`,
      onSuccess: () => {
        router.push("/dashboard/properties");
      },
    });
  };

  const handleDeleteRoom = (room) => {
    setDeleteModalConfig({
      isOpen: true,
      title: `Delete Room ${room.roomNumber}`,
      message: "Are you sure? This action cannot be undone.",
      itemDetails: "Note: All beds inside this room must be VACANT before deleting the room.",
      endpoint: `/rooms/${room.id}`,
      onSuccess: () => {
        setProperty((prev) => ({
          ...prev,
          rooms: (prev.rooms || []).filter((r) => r.id !== room.id),
          totalRooms: Math.max(0, (prev.totalRooms || 1) - 1),
        }));
      },
    });
  };

  const handleDeleteBed = (bed, room) => {
    setDeleteModalConfig({
      isOpen: true,
      title: `Delete Bed ${bed.bedNumber}`,
      message: "Are you sure? This action cannot be undone.",
      itemDetails:
        bed.status === "OCCUPIED"
          ? "⚠️ Notice: Bed is marked OCCUPIED. The server will reject deletion of occupied beds."
          : "Bed status is VACANT. It will be permanently removed.",
      endpoint: `/beds/${bed.id}`,
      onSuccess: () => {
        setProperty((prev) => ({
          ...prev,
          rooms: (prev.rooms || []).map((r) => {
            if (r.id !== room.id) return r;
            return {
              ...r,
              beds: (r.beds || []).filter((b) => b.id !== bed.id),
            };
          }),
          totalBeds: Math.max(0, (prev.totalBeds || 1) - 1),
          vacantBeds:
            bed.status === "VACANT"
              ? Math.max(0, (prev.vacantBeds || 1) - 1)
              : prev.vacantBeds,
          occupiedBeds:
            bed.status === "OCCUPIED"
              ? Math.max(0, (prev.occupiedBeds || 1) - 1)
              : prev.occupiedBeds,
        }));
      },
    });
  };

  // Helper for bed color-coding styling
  const getBedStatusStyle = (status) => {
    switch (status) {
      case "VACANT":
        return {
          bg: "bg-emerald-50/70",
          border: "border-emerald-200",
          hoverBorder: "hover:border-emerald-300",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
          label: "Vacant",
          icon: CheckCircle2,
        };
      case "OCCUPIED":
        return {
          bg: "bg-indigo-50/70",
          border: "border-indigo-200",
          hoverBorder: "hover:border-indigo-300",
          text: "text-indigo-700",
          dot: "bg-indigo-600",
          label: "Occupied",
          icon: XCircle,
        };
      case "MAINTENANCE":
      default:
        return {
          bg: "bg-amber-50/70",
          border: "border-amber-200",
          hoverBorder: "hover:border-amber-300",
          text: "text-amber-700",
          dot: "bg-amber-500",
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
        return "4-Sharing";
      case "FIVE_SHARING":
        return "5-Sharing";
      case "SIX_SHARING":
        return "6-Sharing";
      case "SEVEN_SHARING":
        return "7-Sharing";
      case "EIGHT_SHARING":
        return "8-Sharing";
      case "NINE_SHARING":
        return "9-Sharing";
      case "TEN_SHARING":
        return "10-Sharing";
      default:
        return type ? type.replace(/_/g, " ") : "Standard Room";
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
            <Link
              href="/dashboard/properties"
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Properties
            </Link>
            <span>/</span>
            <span className="text-slate-900">{property?.name || "Property Details"}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {property?.name || "Loading..."}
              </h1>
              {property && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {property.address}, {property.city}, {property.state} &bull;{" "}
                  <span className="text-slate-700 font-medium">
                    {property.totalFloors} {property.totalFloors === 1 ? "Floor" : "Floors"}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons for Property */}
        {property && (
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setEditPropertyOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              Edit Property
            </button>

            <button
              type="button"
              onClick={handleDeleteProperty}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Property
            </button>

            <Link
              href={`/dashboard/properties/${propertyId}/add-room`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.99] text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Room
            </Link>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading rooms and beds...</p>
        </div>
      ) : !property ? (
        <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-slate-500">Property not found.</p>
        </div>
      ) : (
        <>
          {/* Overview Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Rooms
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-slate-900">
                {property.totalRooms || property.rooms?.length || 0}
              </div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Beds
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-indigo-600">
                {property.totalBeds || 0}
              </div>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Vacant Beds
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-emerald-700">
                {property.vacantBeds || 0}
              </div>
            </div>
            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Occupied Beds
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-indigo-900">
                {property.occupiedBeds || 0}
              </div>
            </div>
          </div>

          {/* Filter controls & legend */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mr-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filters:
              </div>

              {/* Floor Filter */}
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
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
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              >
                <option value="ALL">All Sharing Types</option>
                <option value="SINGLE">Single (1)</option>
                <option value="DOUBLE">Double (2)</option>
                <option value="TRIPLE">Triple (3)</option>
                <option value="FOUR_SHARING">4 Sharing (4)</option>
                <option value="FIVE_SHARING">5 Sharing (5)</option>
                <option value="SIX_SHARING">6 Sharing (6)</option>
                <option value="SEVEN_SHARING">7 Sharing (7)</option>
                <option value="EIGHT_SHARING">8 Sharing (8)</option>
                <option value="NINE_SHARING">9 Sharing (9)</option>
                <option value="TEN_SHARING">10 Sharing (10)</option>
              </select>
            </div>

            {/* Status Indicator Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <span className="text-slate-600 font-medium">Vacant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-100" />
                <span className="text-slate-600 font-medium">Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" />
                <span className="text-slate-600 font-medium">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Rooms Grid */}
          {filteredRooms.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <BedIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No rooms found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                {property.rooms?.length === 0
                  ? "Start creating rooms and beds for this property."
                  : "No rooms match your active filter criteria."}
              </p>
              {property.rooms?.length === 0 && (
                <Link
                  href={`/dashboard/properties/${propertyId}/add-room`}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 text-sm shadow-xs transition-all"
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
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all"
                >
                  {/* Room Header with Edit & Delete */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                          Room {room.roomNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          Floor {room.floor}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatRoomType(room.roomType)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Room Button */}
                      <button
                        type="button"
                        title="Edit Room"
                        onClick={() => setEditingRoom(room)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Room Button */}
                      <button
                        type="button"
                        title="Delete Room"
                        onClick={() => handleDeleteRoom(room)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* AC Badge */}
                      {room.hasAc ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <Wind className="w-3 h-3" /> AC
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Non-AC
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rent details */}
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
                    <span>Base Rent:</span>
                    <span className="font-bold text-slate-900 text-sm">
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
                          <div
                            key={bed.id}
                            onClick={() => handleBedClick(bed, room)}
                            className={`text-left flex flex-col justify-between p-3 rounded-xl border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.hoverBorder} hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group/bed`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5 group-hover/bed:text-indigo-600 transition-colors">
                                <BedIcon className="w-3.5 h-3.5 text-slate-400 group-hover/bed:text-indigo-600 transition-colors" />
                                {bed.bedNumber}
                              </span>

                              {/* Bed Inline Action Buttons */}
                              <div
                                className="flex items-center gap-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  title="Edit Bed Number"
                                  onClick={() => setEditingBed(bed)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete Bed"
                                  onClick={() => handleDeleteBed(bed, room)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white/80 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <span
                                  className={`w-2 h-2 rounded-full ${statusStyle.dot} ml-1`}
                                  title={statusStyle.label}
                                />
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[11px]">
                              <span className={`font-bold ${statusStyle.text}`}>
                                {statusStyle.label}
                              </span>
                              <span className="text-[10px] text-slate-500 group-hover/bed:text-indigo-600 font-medium transition-colors">
                                {bed.status === "OCCUPIED" ? "View Tenant →" : "Assign →"}
                              </span>
                            </div>
                          </div>
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

        {/* ========================================================================= */}
        {/* Modals */}
        {/* ========================================================================= */}

        {/* Unified Bed Action Modal (Existing Tenant Allocation) */}
        <BedActionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          bed={selectedBed}
          room={selectedRoom}
          onSuccess={fetchPropertyDetails}
        />

        {/* Edit Property Modal */}
        <EditPropertyModal
          isOpen={editPropertyOpen}
          onClose={() => setEditPropertyOpen(false)}
          property={property}
          onSuccess={handlePropertyUpdated}
        />

        {/* Edit Room Modal */}
        <EditRoomModal
          isOpen={Boolean(editingRoom)}
          onClose={() => setEditingRoom(null)}
          room={editingRoom}
          maxFloors={property?.totalFloors}
          onSuccess={handleRoomUpdated}
        />

        {/* Edit Bed Modal */}
        <EditBedModal
          isOpen={Boolean(editingBed)}
          onClose={() => setEditingBed(null)}
          bed={editingBed}
          onSuccess={handleBedUpdated}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalConfig.isOpen}
          onClose={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))}
          title={deleteModalConfig.title}
          message={deleteModalConfig.message}
          itemDetails={deleteModalConfig.itemDetails}
          endpoint={deleteModalConfig.endpoint}
          onSuccess={deleteModalConfig.onSuccess}
        />
      </div>
    );
}
