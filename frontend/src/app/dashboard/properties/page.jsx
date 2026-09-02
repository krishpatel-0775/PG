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
  XCircle,
  AlertTriangle,
  Wind,
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

  // ===========================================================================
  // Handlers for Edit & Delete
  // ===========================================================================

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
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          dot: "bg-emerald-400",
          label: "Vacant",
        };
      case "OCCUPIED":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          text: "text-rose-400",
          dot: "bg-rose-400",
          label: "Occupied",
        };
      default:
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
          dot: "bg-amber-400",
          label: "Maintenance",
        };
    }
  };

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
              Properties & Beds
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage and configure your buildings, rooms, and bed allocations
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
            {filteredProperties.map((property) => {
              const isExpanded = expandedPropertyId === property.id;

              return (
                <div
                  key={property.id}
                  className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 shadow-sm hover:shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Title, Badge & Action Buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                        className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <Building2 className="w-6 h-6" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Edit Property Button */}
                        <button
                          type="button"
                          title="Edit Property"
                          onClick={() => setEditingProperty(property)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Delete Property Button */}
                        <button
                          type="button"
                          title="Delete Property"
                          onClick={() => handleDeleteProperty(property)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 ml-1">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          {property.totalFloors} {property.totalFloors === 1 ? "Floor" : "Floors"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h2
                        onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                        className="text-xl font-bold text-white hover:text-indigo-400 transition-colors cursor-pointer"
                      >
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
                        <div className="text-sm font-bold text-white">
                          {property.totalRooms || property.rooms?.length || 0}
                        </div>
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

                    {/* Quick Expand Rooms & Beds (Inline view) */}
                    {property.rooms && property.rooms.length > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedPropertyId(isExpanded ? null : property.id)}
                          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2 rounded-lg bg-slate-950/40 border border-slate-800/80 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <DoorOpen className="w-3.5 h-3.5 text-indigo-400" />
                            {isExpanded ? "Hide Rooms & Beds" : `Quick View Rooms (${property.rooms.length})`}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        {/* Expanded Rooms List */}
                        {isExpanded && (
                          <div className="mt-3 space-y-3 max-h-60 overflow-y-auto pr-1">
                            {property.rooms.map((room) => (
                              <div
                                key={room.id}
                                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>Room {room.roomNumber}</span>
                                    <span className="text-[10px] font-normal text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                                      Fl {room.floor}
                                    </span>
                                  </div>

                                  {/* Room Actions */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      title="Edit Room"
                                      onClick={() => setEditingRoom(room)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Delete Room"
                                      onClick={() => handleDeleteRoom(room, property.id)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Bed Pills */}
                                <div className="grid grid-cols-2 gap-1.5">
                                  {room.beds?.map((bed) => {
                                    const statusStyle = getBedStatusStyle(bed.status);
                                    return (
                                      <div
                                        key={bed.id}
                                        className={`flex items-center justify-between p-1.5 rounded-lg border ${statusStyle.bg} ${statusStyle.border}`}
                                      >
                                        <div className="flex items-center gap-1 truncate text-[11px]">
                                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                          <span className="font-semibold text-white truncate">
                                            {bed.bedNumber}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-0.5">
                                          <button
                                            type="button"
                                            title="Edit Bed"
                                            onClick={() => setEditingBed(bed)}
                                            className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80"
                                          >
                                            <Pencil className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            type="button"
                                            title="Delete Bed"
                                            onClick={() => handleDeleteBed(bed, room, property.id)}
                                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800/80"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Action Link */}
                  <div
                    onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                    className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-sm text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-medium">Manage Rooms & Beds</span>
                    <ArrowRight className="w-4 h-4 hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* Modals */}
        {/* ========================================================================= */}

        {/* Edit Property Modal */}
        <EditPropertyModal
          isOpen={Boolean(editingProperty)}
          onClose={() => setEditingProperty(null)}
          property={editingProperty}
          onSuccess={handlePropertyUpdated}
        />

        {/* Edit Room Modal */}
        <EditRoomModal
          isOpen={Boolean(editingRoom)}
          onClose={() => setEditingRoom(null)}
          room={editingRoom}
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
    </div>
  );
}
