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
  Bed as BedIcon,
  ArrowRight,
  Search,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  DoorOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Wind,
  RefreshCw,
} from "lucide-react";
import EditPropertyModal from "@/components/EditPropertyModal";
import EditRoomModal from "@/components/EditRoomModal";
import EditBedModal from "@/components/EditBedModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function PropertiesListPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPropertyId, setExpandedPropertyId] = useState(null);

  // Modals state
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBed, setEditingBed] = useState(null);

  // Delete modal state
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    itemDetails: "",
    endpoint: "",
    onSuccess: null,
  });

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

  const handlePropertyUpdated = (updated) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  };

  const handleRoomUpdated = (updatedRoom) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (!p.rooms) return p;
        const roomExists = p.rooms.some((r) => r.id === updatedRoom.id);
        if (!roomExists) return p;
        return {
          ...p,
          rooms: p.rooms.map((r) =>
            r.id === updatedRoom.id ? { ...r, ...updatedRoom, beds: r.beds } : r
          ),
        };
      })
    );
  };

  const handleBedUpdated = (updatedBed) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (!p.rooms) return p;
        return {
          ...p,
          rooms: p.rooms.map((r) => ({
            ...r,
            beds: r.beds ? r.beds.map((b) => (b.id === updatedBed.id ? { ...b, ...updatedBed } : b)) : [],
          })),
        };
      })
    );
  };

  // Delete Property
  const handleDeleteProperty = (property) => {
    setDeleteModalConfig({
      isOpen: true,
      title: `Delete Property: ${property.name}`,
      message: "Are you sure? This action cannot be undone.",
      itemDetails: "Note: Property deletion will be rejected if any room contains occupied or active beds.",
      endpoint: `/properties/${property.id}`,
      onSuccess: () => {
        setProperties((prev) => prev.filter((p) => p.id !== property.id));
      },
    });
  };

  // Delete Room
  const handleDeleteRoom = (room, propertyId) => {
    setDeleteModalConfig({
      isOpen: true,
      title: `Delete Room ${room.roomNumber}`,
      message: "Are you sure? This action cannot be undone.",
      itemDetails: "Note: All beds in this room must be VACANT before deleting the room.",
      endpoint: `/rooms/${room.id}`,
      onSuccess: () => {
        setProperties((prev) =>
          prev.map((p) => {
            if (p.id !== propertyId) return p;
            const updatedRooms = (p.rooms || []).filter((r) => r.id !== room.id);
            return {
              ...p,
              rooms: updatedRooms,
              totalRooms: Math.max(0, (p.totalRooms || 1) - 1),
            };
          })
        );
      },
    });
  };

  // Delete Bed
  const handleDeleteBed = (bed, room, propertyId) => {
    setDeleteModalConfig({
      isOpen: true,
      title: `Delete Bed ${bed.bedNumber}`,
      message: "Are you sure? This action cannot be undone.",
      itemDetails:
        bed.status === "OCCUPIED"
          ? "⚠️ Warning: This bed is currently OCCUPIED. The server will reject this deletion."
          : "Bed status is VACANT. It will be permanently removed.",
      endpoint: `/beds/${bed.id}`,
      onSuccess: () => {
        setProperties((prev) =>
          prev.map((p) => {
            if (p.id !== propertyId) return p;
            return {
              ...p,
              rooms: (p.rooms || []).map((r) => {
                if (r.id !== room.id) return r;
                return {
                  ...r,
                  beds: (r.beds || []).filter((b) => b.id !== bed.id),
                };
              }),
              totalBeds: Math.max(0, (p.totalBeds || 1) - 1),
              vacantBeds:
                bed.status === "VACANT"
                  ? Math.max(0, (p.vacantBeds || 1) - 1)
                  : p.vacantBeds,
              occupiedBeds:
                bed.status === "OCCUPIED"
                  ? Math.max(0, (p.occupiedBeds || 1) - 1)
                  : p.occupiedBeds,
            };
          })
        );
      },
    });
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

  const getBedStatusStyle = (status) => {
    switch (status) {
      case "VACANT":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
          label: "Vacant",
        };
      case "OCCUPIED":
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          text: "text-indigo-700",
          dot: "bg-indigo-600",
          label: "Occupied",
        };
      case "MAINTENANCE":
      default:
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          dot: "bg-amber-500",
          label: "Maint.",
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900">Properties</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            Property Portfolio &amp; Rooms
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage your PG buildings, view room capacity, configure beds, and monitor occupancy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProperties}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>

          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Top 4 KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Properties */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Properties
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {properties.length}
            </span>
            <span className="text-xs font-medium text-slate-500">active locations</span>
          </div>
        </div>

        {/* Total Rooms */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Rooms
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalRooms}
            </span>
            <span className="text-xs font-medium text-slate-500">configured</span>
          </div>
        </div>

        {/* Total Beds */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Capacity
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BedIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalBeds}
            </span>
            <span className="text-xs font-medium text-slate-500">total beds</span>
          </div>
        </div>

        {/* Available Beds */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Beds
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-emerald-600">
              {vacantBeds}
            </span>
            <span className="text-xs font-medium text-slate-500">vacant for move-in</span>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by property name, city, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredProperties.length}</span> of{" "}
          <span className="font-bold text-slate-800">{properties.length}</span> properties
        </div>
      </div>

      {/* Properties List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading properties...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-20 px-4 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Properties Found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No properties match your current search query."
              : "Get started by adding your first PG building or hostel location."}
          </p>
          {!searchQuery && (
            <div className="mt-5">
              <Link
                href="/dashboard/properties/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Property</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProperties.map((p) => {
            const isExpanded = expandedPropertyId === p.id;
            const occupancyRate =
              p.totalBeds > 0
                ? Math.round(((p.totalBeds - p.vacantBeds) / p.totalBeds) * 100)
                : 0;

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Property Main Row */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Property Details */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {p.totalFloors || 1} Floors
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {p.address}, {p.city}, {p.state}
                        </p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                      {/* Stat Badges */}
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[70px]">
                          <span className="text-xs font-bold text-slate-900 block">
                            {p.totalRooms || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Rooms
                          </span>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[70px]">
                          <span className="text-xs font-bold text-slate-900 block">
                            {p.totalBeds || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Beds
                          </span>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center min-w-[70px]">
                          <span className="text-xs font-bold text-emerald-700 block">
                            {p.vacantBeds || 0}
                          </span>
                          <span className="text-[10px] text-emerald-600 uppercase font-semibold">
                            Vacant
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                        <Link
                          href={`/dashboard/properties/${p.id}/add-room`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Room</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setEditingProperty(p)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 transition-colors"
                          title="Edit Property"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(p)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                          title="Delete Property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/dashboard/properties/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 transition-all shadow-xs"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPropertyId(isExpanded ? null : p.id)
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors"
                          title={isExpanded ? "Collapse Rooms" : "Expand Rooms"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Rooms Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-indigo-600" />
                        Configured Rooms &amp; Bed Allocations
                      </h3>
                      <Link
                        href={`/dashboard/properties/${p.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Open Floor Matrix &rarr;
                      </Link>
                    </div>

                    {!p.rooms || p.rooms.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                        No rooms created yet. Click &quot;Add Room&quot; to configure floor units and beds.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {p.rooms.map((room) => (
                          <div
                            key={room.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs hover:border-indigo-200 transition-all"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  Room {room.roomNumber}
                                </span>
                                {room.hasAc && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                                    <Wind className="w-2.5 h-2.5" /> AC
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRoom(room)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                  title="Edit Room"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoom(room, p.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Delete Room"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Floor {room.floor || 1} &bull; {room.roomType}</span>
                              <span className="font-bold text-slate-800">₹{room.baseRent}/mo</span>
                            </div>

                            {/* Beds Pills */}
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {room.beds && room.beds.length > 0 ? (
                                room.beds.map((bed) => {
                                  const style = getBedStatusStyle(bed.status);
                                  return (
                                    <div
                                      key={bed.id}
                                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium ${style.bg} ${style.border} ${style.text}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                      <span>{bed.bedNumber}</span>
                                      <span className="text-[9px] opacity-75">({style.label})</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  No beds generated
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <EditPropertyModal
          isOpen={!!editingProperty}
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSuccess={handlePropertyUpdated}
        />
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <EditRoomModal
          isOpen={!!editingRoom}
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSuccess={handleRoomUpdated}
        />
      )}

      {/* Edit Bed Modal */}
      {editingBed && (
        <EditBedModal
          isOpen={!!editingBed}
          bed={editingBed}
          onClose={() => setEditingBed(null)}
          onSuccess={handleBedUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        itemDetails={deleteModalConfig.itemDetails}
        endpoint={deleteModalConfig.endpoint}
        onClose={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={deleteModalConfig.onSuccess}
      />
    </div>
  );
}
