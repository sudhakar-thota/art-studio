"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PotteryRequest, PotterySeedItem, PotterySeedGlaze } from "@/lib/types";
import {
  getDateDaysFromNow,
  getTodayDateString,
  getDaysDifferenceFromToday,
  formatPrice,
} from "@/lib/utils";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { AlertBanner, AlertType } from "./AlertBanner";
import {
  Coffee,
  Calendar,
  Layers,
  Sparkles,
  Check,
  X,
  Edit3,
  Clock,
  Info,
  Shield,
  Palette,
} from "lucide-react";

export function PotterySection() {
  const { user } = useAuth();

  // Catalog items & glazes from seed data
  const [items, setItems] = useState<PotterySeedItem[]>([]);
  const [glazes, setGlazes] = useState<PotterySeedGlaze[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Requests list
  const [requests, setRequests] = useState<PotteryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const minDate = getDateDaysFromNow(14);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedGlaze, setSelectedGlaze] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(2);
  const [neededByDate, setNeededByDate] = useState<string>(getDateDaysFromNow(21));
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Alert State
  const [alert, setAlert] = useState<{ type: AlertType; message: string; details?: string } | null>(null);

  // Edit Modal State (Customer only, while still REQUESTED)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PotteryRequest | null>(null);
  const [editItem, setEditItem] = useState("");
  const [editGlaze, setEditGlaze] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNeededByDate, setEditNeededByDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch catalog
  const fetchCatalog = async () => {
    try {
      const res = await fetch("/api/pottery/catalog");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setGlazes(data.glazes || []);
        if (data.items?.length > 0) setSelectedItem(data.items[0].name);
        if (data.glazes?.length > 0) setSelectedGlaze(data.glazes[0].name);
      }
    } catch (err) {
      console.error("Could not fetch pottery catalog:", err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Fetch requests (Customer sees own, Admin sees all)
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pottery");
      if (!res.ok) {
        if (res.status === 401) {
          setRequests([]);
          setLoading(false);
          return;
        }
        throw new Error("Failed to load custom pottery requests.");
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading pottery requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchRequests();
  }, [user]);

  // Submit new request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!user) {
      setAlert({
        type: "warning",
        message: "Sign in required",
        details: "Please sign in as a customer (Alice or Bob) to submit custom pottery requests.",
      });
      return;
    }

    if (user.role === "ADMIN") {
      setAlert({
        type: "error",
        message: "Action Refused (403 Forbidden)",
        details: "Studio admins cannot submit pottery requests. Please switch to a customer account.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/pottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: selectedItem,
          glaze: selectedGlaze,
          quantity: Number(quantity),
          neededByDate,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: "Request Refusal",
          details: data.error || "The studio could not process this pottery request.",
        });
        return;
      }

      setAlert({
        type: "success",
        message: `Custom pottery request for ${quantity}x ${selectedItem} submitted!`,
        details: "Status: REQUESTED. You may edit or cancel this request while it is still pending studio review.",
      });

      setNotes("");
      fetchRequests();
    } catch (err: any) {
      setAlert({
        type: "error",
        message: "Network Error",
        details: err.message || "Could not connect to studio server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (req: PotteryRequest) => {
    if (req.status !== "REQUESTED") {
      setAlert({
        type: "error",
        message: "Edit Refused",
        details: `A pottery request can only be edited while still requested. Current status is '${req.status}'.`,
      });
      return;
    }

    setEditingRequest(req);
    setEditItem(req.item);
    setEditGlaze(req.glaze);
    setEditQuantity(req.quantity);
    setEditNeededByDate(req.neededByDate);
    setEditNotes(req.notes || "");
    setEditError(null);
    setEditModalOpen(true);
  };

  // Customer Saves Edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    setEditError(null);
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/pottery/${editingRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: editItem,
          glaze: editGlaze,
          quantity: Number(editQuantity),
          neededByDate: editNeededByDate,
          notes: editNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update pottery request.");
        return;
      }

      setAlert({
        type: "success",
        message: "Pottery request updated successfully.",
      });

      setEditModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      setEditError(err.message || "Failed to submit updates.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Customer Cancels Request (only while REQUESTED)
  const handleCancelRequest = async (req: PotteryRequest) => {
    if (req.status !== "REQUESTED") {
      setAlert({
        type: "error",
        message: "Cancellation Refused",
        details: `A request can only be cancelled while in 'REQUESTED' status. This request is '${req.status}'.`,
      });
      return;
    }

    if (!confirm(`Are you sure you want to cancel your request for ${req.quantity}x ${req.item}?`)) {
      return;
    }

    setActionLoadingId(req.id);
    setAlert(null);

    try {
      const res = await fetch(`/api/pottery/${req.id}/cancel`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: "Cancellation Refused",
          details: data.error || "Failed to cancel request.",
        });
        return;
      }

      setAlert({
        type: "success",
        message: "Pottery request cancelled.",
      });

      fetchRequests();
    } catch (err: any) {
      setAlert({
        type: "error",
        message: "Error",
        details: err.message || "Failed to cancel request.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Admin Accepts or Declines
  const handleAdminStatus = async (requestId: string, newStatus: "ACCEPTED" | "DECLINED") => {
    setActionLoadingId(requestId);
    setAlert(null);

    try {
      const res = await fetch(`/api/pottery/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: "Status Update Refused",
          details: data.error || "Failed to update status.",
        });
        return;
      }

      setAlert({
        type: "success",
        message: `Pottery request has been ${newStatus.toLowerCase()}.`,
      });

      fetchRequests();
    } catch (err: any) {
      setAlert({
        type: "error",
        message: "Error",
        details: err.message || "Failed to update status.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Find selected item & glaze details
  const currentItemObj = items.find((i) => i.name === selectedItem);
  const currentGlazeObj = glazes.find((g) => g.name === selectedGlaze);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            Feature 3 · Makes custom pottery, on request
          </span>
          <span className="text-xs text-stone-400">Handcrafted Ceramics &amp; Glazes</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
          Custom Ceramics Workshop
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Choose an item and artisanal glaze from our curated seed catalog, a quantity (1 to 12 pieces),
          and a needed-by date at least 14 days away. The studio accepts or declines each request.
          Customers can edit or cancel requests while they remain in requested status.
        </p>
      </div>

      {/* Alert Banner */}
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          details={alert.details}
          onDismiss={() => setAlert(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Request Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm sticky top-24">
            <h2 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
              Request Custom Pottery
            </h2>

            <form onSubmit={handleSubmitRequest} className="mt-5 space-y-4">
              {/* Item Selection from Seed Catalog */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  1. Ceramic Form (Seed Catalog)
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} (${item.basePrice} base)
                    </option>
                  ))}
                </select>
                {currentItemObj && (
                  <p className="text-xs text-stone-500 mt-1 italic">
                    {currentItemObj.description}
                  </p>
                )}
              </div>

              {/* Glaze Selection from Seed Catalog */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  2. Glaze &amp; Finish (Seed Catalog)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {glazes.map((glaze) => {
                    const isSelected = selectedGlaze === glaze.name;
                    return (
                      <button
                        type="button"
                        key={glaze.id}
                        onClick={() => setSelectedGlaze(glaze.name)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? "border-terracotta bg-amber-50/50 shadow-sm"
                            : "border-stone-200 hover:border-stone-300 bg-white"
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-stone-300 shadow-inner flex-shrink-0"
                          style={{ backgroundColor: glaze.hexColor }}
                        />
                        <div className="overflow-hidden">
                          <span className="block text-xs font-medium text-stone-900 truncate">
                            {glaze.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {currentGlazeObj && (
                  <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-terracotta" />
                    <span>{currentGlazeObj.finish}</span>
                  </p>
                )}
              </div>

              {/* Quantity (1 to 12) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    3. Quantity (1 to 12 pieces)
                  </label>
                  <span className="text-sm font-bold text-stone-900">{quantity} units</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full accent-terracotta"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>1 unit (Single)</span>
                  <span>6 units (Half dozen)</span>
                  <span>12 units (Full set)</span>
                </div>
              </div>

              {/* Needed-By Date (>= 14 days away) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  4. Needed-By Date (Minimum 14 Days Away)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={neededByDate}
                    onChange={(e) => setNeededByDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Lead time: {getDaysDifferenceFromToday(neededByDate)} days away (≥ 14 days for drying, bisque &amp; glaze kiln fires)
                </p>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Special Inscriptions or Dimensions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Matte exterior with gloss interior, matching handle..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || (user?.role === "ADMIN")}
                className="w-full py-2.5 px-4 bg-terracotta hover:bg-clay text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting
                  ? "Submitting to Workshop..."
                  : user?.role === "ADMIN"
                  ? "Admins Cannot Request (Customer Only)"
                  : "Submit Custom Request"}
              </button>

              <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1">
                <Info className="w-3 h-3" />
                Requests can be edited or cancelled while still in &lsquo;REQUESTED&rsquo; status.
              </p>
            </form>
          </div>
        </div>

        {/* Right Column: Requests Log */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                {user?.role === "ADMIN" ? "Studio Custom Ceramics Orders" : "My Custom Pottery Requests"}
              </h2>
              <p className="text-xs text-stone-500">
                {user?.role === "ADMIN"
                  ? "Review, accept or decline custom kiln commissions from collectors"
                  : "Track, modify or cancel your custom pottery commissions"}
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="text-xs text-stone-500 hover:text-stone-900 underline"
            >
              Refresh
            </button>
          </div>

          {/* Loading State */}
          {loading && <LoadingState message="Fetching custom pottery requests..." />}

          {/* Error State */}
          {!loading && error && (
            <ErrorState
              title="Could not load requests"
              message={error}
              onRetry={fetchRequests}
            />
          )}

          {/* Empty State */}
          {!loading && !error && requests.length === 0 && (
            <EmptyState
              title={
                !user
                  ? "Sign in to view your pottery requests"
                  : user.role === "ADMIN"
                  ? "No custom pottery requests in the queue"
                  : "You haven't requested any custom pottery yet"
              }
              description={
                !user
                  ? "Please log in using the demo switcher at the top to access your custom requests."
                  : user.role === "ADMIN"
                  ? "Incoming customer pottery requests will appear here for review."
                  : "Choose an item and glaze on the left to commission your first handcrafted ceramic piece."
              }
            />
          )}

          {/* Requests List */}
          {!loading && !error && requests.length > 0 && (
            <div className="space-y-4">
              {requests.map((req) => {
                const isRequested = req.status === "REQUESTED";
                const daysAway = getDaysDifferenceFromToday(req.neededByDate);

                const statusStyles: Record<string, string> = {
                  REQUESTED: "bg-amber-100 text-amber-900 border-amber-300",
                  ACCEPTED: "bg-emerald-100 text-emerald-900 border-emerald-300",
                  DECLINED: "bg-rose-100 text-rose-900 border-rose-300",
                  CANCELLED: "bg-stone-100 text-stone-600 border-stone-200",
                };

                return (
                  <div
                    key={req.id}
                    className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-stone-700">
                          <Coffee className="w-5 h-5 text-terracotta" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif font-bold text-base text-stone-900">
                              {req.quantity}x {req.item}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                statusStyles[req.status] || "bg-stone-100 text-stone-800"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            Glaze: <span className="font-semibold text-stone-800">{req.glaze}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-stone-400 block">Needed by</span>
                        <span className="text-sm font-semibold text-stone-800">
                          {req.neededByDate} ({daysAway}d)
                        </span>
                      </div>
                    </div>

                    <div className="py-3 text-xs text-stone-600 space-y-1">
                      <div>
                        <span className="font-semibold text-stone-700">Customer: </span>
                        {req.user?.name || "Client"} ({req.user?.email})
                      </div>
                      {req.notes && (
                        <div className="italic text-stone-500 bg-stone-50 p-2 rounded mt-1">
                          &ldquo;{req.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Action Buttons based on Role */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      {user?.role === "ADMIN" ? (
                        // Admin: Accept or Decline
                        <div className="flex items-center gap-2 w-full justify-end">
                          {isRequested ? (
                            <>
                              <button
                                onClick={() => handleAdminStatus(req.id, "DECLINED")}
                                disabled={actionLoadingId === req.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                              <button
                                onClick={() => handleAdminStatus(req.id, "ACCEPTED")}
                                disabled={actionLoadingId === req.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Request</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-stone-400">
                              Status finalized ({req.status.toLowerCase()})
                            </span>
                          )}
                        </div>
                      ) : (
                        // Customer: Edit or Cancel (only while still REQUESTED)
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-stone-400">
                            {isRequested
                              ? "Eligible to edit or cancel"
                              : `Cannot modify (currently ${req.status.toLowerCase()})`}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(req)}
                              disabled={!isRequested}
                              title={
                                !isRequested
                                  ? "Can only edit while still requested."
                                  : "Edit this request"
                              }
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                isRequested
                                  ? "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                                  : "bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed"
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleCancelRequest(req)}
                              disabled={!isRequested || actionLoadingId === req.id}
                              title={
                                !isRequested
                                  ? "Can only cancel while still requested."
                                  : "Cancel this request"
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                isRequested
                                  ? "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                                  : "bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed"
                              }`}
                            >
                              {actionLoadingId === req.id ? "Cancelling..." : "Cancel"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer Edit Modal (Only allowed while REQUESTED) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Edit Pottery Request
                </h3>
                <p className="text-xs text-stone-500">
                  Allowed only while in &lsquo;REQUESTED&rsquo; status
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Item Form
                </label>
                <select
                  value={editItem}
                  onChange={(e) => setEditItem(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.name}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Glaze Finish
                </label>
                <select
                  value={editGlaze}
                  onChange={(e) => setEditGlaze(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                >
                  {glazes.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name} ({g.finish})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Quantity (1 to 12)
                  </label>
                  <span className="text-sm font-bold text-stone-900">{editQuantity} units</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-full accent-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Needed-By Date (≥ 14 days away)
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={editNeededByDate}
                  onChange={(e) => setEditNeededByDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Special Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-terracotta hover:bg-clay text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {editSubmitting ? "Updating..." : "Save Updates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
