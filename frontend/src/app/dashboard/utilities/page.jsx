"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Zap,
  Building2,
  Calendar,
  Gauge,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  History,
  Layers,
  Bed,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  IndianRupee,
  SlidersHorizontal,
} from "lucide-react";
import MeterReadingModal from "@/components/MeterReadingModal";

export default function UtilitiesManagementPage() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");

  // Active Billing Month formatted as "MMM-YYYY" (e.g. "OCT-2026")
  const [billingDate, setBillingDate] = useState(() => new Date());

  // Room readings history cache map: { [roomId]: [MeterReadingResponse] }
  const [roomHistories, setRoomHistories] = useState({});

  // Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);

  // History Drawer / Modal State
  const [historyRoom, setHistoryRoom] = useState(null);

  // Formatted billing month string: "OCT-2026"
  const billingMonthStr = useMemo(() => {
    const month = billingDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = billingDate.getFullYear();
    return `${month}-${year}`;
  }, [billingDate]);

  // Initial properties load
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch rooms whenever selectedPropertyId changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchRoomsForProperty(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.get("/properties");
      const list = res.data || [];
      setProperties(list);
      if (list.length > 0) {
        setSelectedPropertyId(String(list[0].id));
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load properties.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsForProperty = async (propertyId) => {
    setRefreshing(true);
    try {
      const res = await api.get(`/properties/${propertyId}`);
      const propData = res.data;
      const roomList = propData.rooms || [];
      setRooms(roomList);

      // Fetch latest meter readings for each room in this property
      fetchReadingsForRooms(roomList);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load rooms for the selected property.";
      setErrorMessage(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchReadingsForRooms = async (roomList) => {
    const historyMap = {};
    await Promise.allSettled(
      roomList.map(async (room) => {
        try {
          const res = await api.get(`/utilities/room/${room.id}/history`);
          historyMap[room.id] = res.data || [];
        } catch {
          historyMap[room.id] = [];
        }
      })
    );
    setRoomHistories((prev) => ({ ...prev, ...historyMap }));
  };

  const handleMonthChange = (offset) => {
    setBillingDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + offset);
      return d;
    });
  };

  const handleOpenReadingModal = (room) => {
    const history = roomHistories[room.id] || [];
    const latestReading = history.length > 0 ? history[0] : null;
    const selectedProp = properties.find((p) => String(p.id) === String(selectedPropertyId));

    setSelectedRoom({
      ...room,
      propertyName: selectedProp?.name || "PG Property",
      lastReading: latestReading,
    });
    setIsReadingModalOpen(true);
  };

  const handleReadingSuccess = () => {
    setSuccessToast(`Meter reading recorded for Room ${selectedRoom?.roomNumber}. Split invoices generated!`);
    setTimeout(() => setSuccessToast(""), 5000);
    if (selectedPropertyId) {
      fetchRoomsForProperty(selectedPropertyId);
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        searchQuery === "" ||
        String(room.roomNumber).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFloor =
        floorFilter === "ALL" || String(room.floor) === String(floorFilter);
      return matchesSearch && matchesFloor;
    });
  }, [rooms, searchQuery, floorFilter]);

  // Unique floors for filter dropdown
  const uniqueFloors = useMemo(() => {
    const set = new Set();
    rooms.forEach((r) => {
      if (r.floor !== undefined && r.floor !== null) set.add(r.floor);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  // Stats calculation
  const totalBedsInProperty = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.totalCapacity || r.capacity || (r.beds ? r.beds.length : 0)), 0);
  }, [rooms]);

  const roomsBilledThisMonth = useMemo(() => {
    let count = 0;
    rooms.forEach((r) => {
      const history = roomHistories[r.id] || [];
      const hasMonthReading = history.some((rec) => rec.billingMonth === billingMonthStr);
      if (hasMonthReading) count++;
    });
    return count;
  }, [rooms, roomHistories, billingMonthStr]);

  const currentProperty = properties.find((p) => String(p.id) === String(selectedPropertyId));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-20">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Sub-Meter Electricity</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs flex-shrink-0">
              <Zap className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Utility & Electricity Sub-Meter Billing
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Record physical room sub-meter readings and generate real-time prorated split invoices for residents
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Property Selector & Active Billing Month Picker */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Property Dropdown */}
          <div className="relative">
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Active Billing Month Selector */}
          <div className="flex items-center bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xs p-1">
            <button
              onClick={() => handleMonthChange(-1)}
              title="Previous Month"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider text-amber-400">
              <Calendar className="w-3.5 h-3.5" />
              {billingMonthStr}
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              title="Next Month"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => selectedPropertyId && fetchRoomsForProperty(selectedPropertyId)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
            title="Refresh Readings"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast("")}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Rooms */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Sub-Meters
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Gauge className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {rooms.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Rooms in {currentProperty?.name || "Property"}
          </div>
        </div>

        {/* Total Capacity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Bed Capacity
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Bed className="w-6 h-6" />
            {totalBedsInProperty} Beds
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Total resident allocation slots
          </div>
        </div>

        {/* Readings Recorded this Month */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Billed for {billingMonthStr}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            {roomsBilledThisMonth} / {rooms.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {rooms.length - roomsBilledThisMonth > 0
              ? `${rooms.length - roomsBilledThisMonth} rooms pending reading`
              : "All room readings complete! 🎉"}
          </div>
        </div>

        {/* Policy Information Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800/50 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Proration Engine
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-100 leading-relaxed">
            Per-bed capacity split with owner absorption for vacant beds and fractional stays.
          </div>
          <div className="mt-1.5 text-[10px] text-indigo-300 font-mono">
            Rate: ₹10/kWh • Exact day math
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Floor:
          </span>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Floors</option>
            {uniqueFloors.map((floor) => (
              <option key={floor} value={floor}>
                Floor {floor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Room Meter Grid / Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading sub-meter registry...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <Gauge className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery ? "No rooms match your filter" : "No rooms found for this property"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your room search query or floor filter."
              : "Add rooms to this property in the Properties & Beds section to start tracking electricity sub-meters."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Room & Floor</th>
                  <th className="px-6 py-4">Capacity & Beds</th>
                  <th className="px-6 py-4">Last Recorded Reading</th>
                  <th className="px-6 py-4">Status for {billingMonthStr}</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRooms.map((room) => {
                  const history = roomHistories[room.id] || [];
                  const lastReading = history.length > 0 ? history[0] : null;
                  const monthReading = history.find((rec) => rec.billingMonth === billingMonthStr);
                  const isBilledThisMonth = !!monthReading;
                  const capacity = room.totalCapacity || room.capacity || (room.beds ? room.beds.length : 1);
                  const occupiedBeds = room.beds ? room.beds.filter((b) => b.status === "OCCUPIED").length : 0;

                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Room & Floor */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold font-mono text-sm">
                            {room.roomNumber}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white">
                              Room {room.roomNumber}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Layers className="w-3 h-3" />
                              Floor {room.floor ?? "Ground"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Capacity & Beds */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {capacity} {capacity === 1 ? "Bed" : "Beds"}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {occupiedBeds}/{capacity} Occupied
                          </span>
                        </div>
                        {room.hasAc && (
                          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium mt-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AC Sub-Metered
                          </div>
                        )}
                      </td>

                      {/* Last Recorded Reading */}
                      <td className="px-6 py-4">
                        {lastReading ? (
                          <div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                              {Number(lastReading.currentReading).toFixed(2)}
                              <span className="text-xs font-normal text-slate-600 dark:text-slate-400">kWh</span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {lastReading.billingMonth || lastReading.readingDate} (
                              {Number(lastReading.unitsConsumed).toFixed(0)} units consumed)
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 dark:text-slate-400 italic">
                            No reading recorded yet (Base: 0 kWh)
                          </span>
                        )}
                      </td>

                      {/* Status for Current Billing Month */}
                      <td className="px-6 py-4">
                        {isBilledThisMonth ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Billed ({Number(monthReading.unitsConsumed).toFixed(0)} kWh • ₹{Number(monthReading.totalAmount).toLocaleString("en-IN")})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Pending {billingMonthStr} Reading
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReadingModal(room)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-xs shadow-indigo-500/20 transition-all cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>{isBilledThisMonth ? "Re-Record Reading" : "Record Reading"}</span>
                          </button>

                          {history.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setHistoryRoom({ ...room, history })}
                              title="View meter history"
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Meter Reading Recording Modal */}
      <MeterReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        room={selectedRoom}
        billingMonth={billingMonthStr}
        onSuccess={handleReadingSuccess}
      />

      {/* History Drawer / Modal */}
      {historyRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Meter History — Room {historyRoom.roomNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Historical meter readings and billed units</p>
              </div>
              <button
                onClick={() => setHistoryRoom(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
              {historyRoom.history?.map((rec, i) => (
                <div key={rec.id || i} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{rec.billingMonth || rec.readingDate}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                        {Number(rec.unitsConsumed).toFixed(0)} kWh
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Dial: {Number(rec.previousReading).toFixed(1)} → {Number(rec.currentReading).toFixed(1)} kWh @ ₹{Number(rec.ratePerUnit)}/unit
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-sm text-slate-900 dark:text-white">
                    ₹{Number(rec.totalAmount).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setHistoryRoom(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
