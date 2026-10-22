"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Painting } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { AlertBanner, AlertType } from "./AlertBanner";
import { Plus, Edit2, ShoppingBag, CheckCircle, Tag, Sparkles, X } from "lucide-react";

export function PaintingsSection({ onNavigateToDashboard }: { onNavigateToDashboard?: () => void }) {
  const { user } = useAuth();
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Alert message state (for successes and refusals)
  const [alert, setAlert] = useState<{ type: AlertType; message: string; details?: string } | null>(null);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPainting, setEditingPainting] = useState<Painting | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDimensions, setFormDimensions] = useState("");
  const [formMedium, setFormMedium] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPaintings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paintings");
      if (!res.ok) {
        throw new Error("Failed to load paintings from studio vault");
      }
      const data = await res.json();
      setPaintings(data.paintings || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching paintings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaintings();
  }, []);

  // Customer Buys a Painting
  const handleBuyPainting = async (painting: Painting) => {
    if (!user) {
      setAlert({
        type: "warning",
        message: "Authentication required",
        details: "Please sign in or select a customer role in the top bar to buy this painting.",
      });
      return;
    }

    if (user.role === "ADMIN") {
      setAlert({
        type: "error",
        message: "Action Refused (403 Forbidden)",
        details: "Studio admins cannot purchase paintings. Switch to a customer account (Alice or Bob) to buy.",
      });
      return;
    }

    setActionLoadingId(painting.id);
    setAlert(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paintingId: painting.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        // App refusal state (e.g. 409 Conflict if already sold)
        setAlert({
          type: "error",
          message: res.status === 409 ? "Painting Refusal: Already Sold" : "Purchase Failed",
          details: data.error || "Unable to complete purchase at this time.",
        });
        // Refresh gallery to sync latest availability status
        fetchPaintings();
        return;
      }

      setAlert({
        type: "success",
        message: `Congratulations! '${painting.title}' has been acquired.`,
        details: "Your order is placed. You can view or cancel your order in 'My Orders'.",
      });

      // Update local state to reflect sold status immediately
      setPaintings((prev) =>
        prev.map((p) => (p.id === painting.id ? { ...p, status: "SOLD" } : p))
      );
    } catch (err: any) {
      setAlert({
        type: "error",
        message: "Network Error",
        details: err.message || "Could not reach the studio server.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open modal for Adding
  const openAddModal = () => {
    setEditingPainting(null);
    setFormTitle("");
    setFormDescription("");
    setFormPrice("");
    setFormDimensions("24 x 36 inches");
    setFormMedium("Oil and pigment on canvas");
    setFormImageUrl("https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80");
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal for Editing (Admin only, only while AVAILABLE)
  const openEditModal = (painting: Painting) => {
    if (painting.status !== "AVAILABLE") {
      setAlert({
        type: "error",
        message: "Edit Refused",
        details: "Only currently available paintings can be edited. Sold paintings are sealed in the archive.",
      });
      return;
    }
    setEditingPainting(painting);
    setFormTitle(painting.title);
    setFormDescription(painting.description);
    setFormPrice(painting.price.toString());
    setFormDimensions(painting.dimensions);
    setFormMedium(painting.medium);
    setFormImageUrl(painting.imageUrl);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSavePainting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        price: parseFloat(formPrice),
        dimensions: formDimensions,
        medium: formMedium,
        imageUrl: formImageUrl,
      };

      const url = editingPainting ? `/api/paintings/${editingPainting.id}` : "/api/paintings";
      const method = editingPainting ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save painting.");
        return;
      }

      setAlert({
        type: "success",
        message: editingPainting ? "Painting updated successfully." : "New painting added to studio collection.",
      });

      setModalOpen(false);
      fetchPaintings();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit request.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
              Feature 1 · Sells paintings
            </span>
            <span className="text-xs text-stone-400">One-of-a-kind originals</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
            Studio Originals Gallery
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-2xl">
            Each piece is an original artwork created in our studio. Paintings can be bought only once;
            upon purchase, it is marked as sold unless the customer cancels their order.
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Painting</span>
          </button>
        )}
      </div>

      {/* Alert Banner for Feedback & Concurrency Refusal Messages */}
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          details={alert.details}
          onDismiss={() => setAlert(null)}
        />
      )}

      {/* Loading State */}
      {loading && <LoadingState message="Curating original paintings collection..." />}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Could not load paintings"
          message={error}
          onRetry={fetchPaintings}
        />
      )}

      {/* Empty State */}
      {!loading && !error && paintings.length === 0 && (
        <EmptyState
          title="No paintings currently listed"
          description="The studio archive is currently preparing new collections. Check back soon or add one as admin."
          actionText={user?.role === "ADMIN" ? "Add Painting" : undefined}
          onAction={openAddModal}
        />
      )}

      {/* Paintings Grid */}
      {!loading && !error && paintings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {paintings.map((painting) => {
            const isSold = painting.status === "SOLD";
            return (
              <div
                key={painting.id}
                className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col ${
                  isSold
                    ? "border-stone-200 opacity-80"
                    : "border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300"
                }`}
              >
                {/* Artwork Image Container */}
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src={painting.imageUrl}
                    alt={painting.title}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isSold ? "grayscale-[30%]" : "hover:scale-105"
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80";
                    }}
                  />

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {isSold ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-stone-900/90 text-white backdrop-blur shadow-sm">
                        ● SOLD
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/90 text-white backdrop-blur shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        AVAILABLE
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        {painting.title}
                      </h3>
                      <span className="text-lg font-bold text-terracotta">
                        {formatPrice(painting.price)}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 font-medium mb-3">
                      {painting.medium} · {painting.dimensions}
                    </p>

                    <p className="text-sm text-stone-600 line-clamp-3 mb-6">
                      {painting.description}
                    </p>
                  </div>

                  {/* Action Controls */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                    {user?.role === "ADMIN" ? (
                      // Admin Controls
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-stone-400">
                          {isSold ? "Archived (Sold)" : "Ready for collection"}
                        </span>
                        <button
                          onClick={() => openEditModal(painting)}
                          disabled={isSold}
                          title={isSold ? "Cannot edit sold paintings" : "Edit painting details"}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isSold
                              ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                              : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{isSold ? "Locked (Sold)" : "Edit Details"}</span>
                        </button>
                      </div>
                    ) : (
                      // Customer Controls
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-stone-500">
                          {isSold ? "One-of-a-kind · Claimed" : "Original 1 of 1"}
                        </span>

                        <button
                          onClick={() => handleBuyPainting(painting)}
                          disabled={isSold || actionLoadingId === painting.id}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            isSold
                              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                              : "bg-terracotta hover:bg-clay text-white shadow-sm hover:shadow"
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            {actionLoadingId === painting.id
                              ? "Securing..."
                              : isSold
                              ? "Already Sold"
                              : "Buy Painting"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal (Admin Only) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {editingPainting ? "Edit Painting Details" : "Add New Painting to Vault"}
                </h3>
                <p className="text-xs text-stone-500">
                  {editingPainting
                    ? "Modify artwork metadata (only allowed while available)"
                    : "Add an original work for collectors to acquire"}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePainting} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Whispers of Sienna"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="450"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    required
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                    placeholder="24 x 36 inches"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Medium
                </label>
                <input
                  type="text"
                  required
                  value={formMedium}
                  onChange={(e) => setFormMedium(e.target.value)}
                  placeholder="Oil and wax on linen"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed commentary on palette, textures, and artistic inspiration..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : editingPainting ? "Save Changes" : "Publish Painting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
