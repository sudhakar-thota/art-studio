"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Order, WallBooking, PotteryRequest } from "@/lib/types";
import { formatPrice, getDaysDifferenceFromToday, canCancelWallBooking } from "@/lib/utils";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { AlertBanner, AlertType } from "./AlertBanner";
import {
  ShoppingBag,
  Brush,
  Coffee,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  User,
} from "lucide-react";

export function DashboardSection({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<"orders" | "wall" | "pottery">("orders");

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallBookings, setWallBookings] = useState<WallBooking[]>([]);
  const [potteryRequests, setPotteryRequests] = useState<PotteryRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: AlertType; message: string; details?: string } | null>(null);

  const fetchAllData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [resOrders, resWall, resPottery] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/wall-bookings"),
        fetch("/api/pottery"),
      ]);

      if (!resOrders.ok || !resWall.ok || !resPottery.ok) {
        throw new Error("Failed to load dashboard records from the server.");
      }

      const [dataOrders, dataWall, dataPottery] = await Promise.all([
        resOrders.json(),
        resWall.json(),
        resPottery.json(),
      ]);

      setOrders(dataOrders.orders || []);
      setWallBookings(dataWall.bookings || []);
      setPotteryRequests(dataPottery.requests || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // Customer Cancels Painting Order (reverts painting to AVAILABLE)
  const handleCancelOrder = async (order: Order) => {
    if (!confirm(`Cancel order for '${order.painting?.title}'? The painting will be restored to the gallery as available.`)) {
      return;
    }

    setActionLoadingId(order.id);
    setAlert(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: "Cancellation Refused",
          details: data.error || "Failed to cancel order.",
        });
        return;
      }

      setAlert({
        type: "success",
        message: "Order cancelled successfully.",
        details: `'${order.painting?.title}' has been restored to the gallery as AVAILABLE.`,
      });

      fetchAllData();
    } catch (err: any) {
      setAlert({
        type: "error",
        message: "Error",
        details: err.message || "Could not reach server.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <EmptyState
          title="Sign in to view your records"
          description="Use the interactive role switcher at the top to sign in as Alice, Bob, or Studio Admin."
        />
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            {isAdmin ? "Studio Master Control" : "Collector Dashboard"}
          </span>
          <span className="text-xs text-stone-400">
            {isAdmin ? "Audit all client commissions & orders" : `Viewing records owned by ${user.name}`}
          </span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
          {isAdmin ? "Studio Activity & Order Archive" : "My Orders & Commissions"}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {isAdmin
            ? "Full cross-studio visibility over all painting acquisitions, wall mural schedules, and ceramic requests."
            : "Review and manage your original painting purchases, wall murals, and custom pottery requests."}
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div
            onClick={() => setSubTab("orders")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              subTab === "orders" ? "bg-amber-50/60 border-amber-300 shadow-sm" : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Paintings</span>
              <ShoppingBag className="w-4 h-4 text-terracotta" />
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">
              {orders.length}
            </div>
            <span className="text-[11px] text-stone-400">
              {orders.filter((o) => o.status === "PLACED").length} active · {orders.filter((o) => o.status === "CANCELLED").length} cancelled
            </span>
          </div>

          <div
            onClick={() => setSubTab("wall")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              subTab === "wall" ? "bg-amber-50/60 border-amber-300 shadow-sm" : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Wall Murals</span>
              <Brush className="w-4 h-4 text-terracotta" />
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">
              {wallBookings.length}
            </div>
            <span className="text-[11px] text-stone-400">
              {wallBookings.filter((w) => w.status === "CONFIRMED").length} confirmed · {wallBookings.filter((w) => w.status === "REQUESTED").length} pending
            </span>
          </div>

          <div
            onClick={() => setSubTab("pottery")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              subTab === "pottery" ? "bg-amber-50/60 border-amber-300 shadow-sm" : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Ceramics</span>
              <Coffee className="w-4 h-4 text-terracotta" />
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">
              {potteryRequests.length}
            </div>
            <span className="text-[11px] text-stone-400">
              {potteryRequests.filter((p) => p.status === "ACCEPTED").length} accepted · {potteryRequests.filter((p) => p.status === "REQUESTED").length} pending
            </span>
          </div>
        </div>
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

      {/* Subtab Selector */}
      <div className="flex border-b border-stone-200 mt-8 mb-6">
        <button
          onClick={() => setSubTab("orders")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            subTab === "orders"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Painting Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setSubTab("wall")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            subTab === "wall"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <Brush className="w-4 h-4" />
          <span>Wall Murals ({wallBookings.length})</span>
        </button>

        <button
          onClick={() => setSubTab("pottery")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            subTab === "pottery"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Custom Pottery ({potteryRequests.length})</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && <LoadingState message="Fetching activity records..." />}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Could not load records"
          message={error}
          onRetry={fetchAllData}
        />
      )}

      {/* SUBTAB 1: Painting Orders */}
      {!loading && !error && subTab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <EmptyState
              title={isAdmin ? "No painting orders on record" : "You haven't bought any paintings yet"}
              description={
                isAdmin
                  ? "When customers purchase paintings, orders will appear here."
                  : "Browse our studio originals collection to acquire your first one-of-a-kind piece."
              }
              actionText={!isAdmin && onNavigate ? "Browse Paintings" : undefined}
              onAction={() => onNavigate?.("paintings")}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPlaced = order.status === "PLACED";
                return (
                  <div
                    key={order.id}
                    className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {order.painting?.imageUrl && (
                        <img
                          src={order.painting.imageUrl}
                          alt={order.painting.title}
                          className="w-16 h-16 rounded-lg object-cover border border-stone-200 flex-shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-stone-900">
                            {order.painting?.title || "Untitled Painting"}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isPlaced
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-stone-100 text-stone-600 border-stone-300"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Acquired on {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                          {order.painting?.medium}
                        </p>
                        {isAdmin && (
                          <p className="text-xs text-stone-600 mt-1 font-medium">
                            Buyer: {order.user?.name} ({order.user?.email})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-stone-400 block">Amount</span>
                        <span className="text-base font-bold text-stone-900">
                          {formatPrice(order.amount)}
                        </span>
                      </div>

                      {/* Customer Cancel Button */}
                      {!isAdmin && isPlaced && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={actionLoadingId === order.id}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors shadow-sm"
                        >
                          {actionLoadingId === order.id ? "Cancelling..." : "Cancel Order"}
                        </button>
                      )}

                      {!isAdmin && !isPlaced && (
                        <span className="text-xs text-stone-400 italic">
                          Order cancelled (painting returned to gallery)
                        </span>
                      )}

                      {isAdmin && (
                        <span className="text-xs text-stone-400">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Wall Murals */}
      {!loading && !error && subTab === "wall" && (
        <div>
          {wallBookings.length === 0 ? (
            <EmptyState
              title={isAdmin ? "No wall bookings on record" : "No wall mural bookings found"}
              description={
                isAdmin
                  ? "Incoming customer bookings will be logged here."
                  : "Book an exclusive date to commission an architectural wall painting."
              }
              actionText={!isAdmin && onNavigate ? "Book a Wall Date" : undefined}
              onAction={() => onNavigate?.("wall-painting")}
            />
          ) : (
            <div className="space-y-4">
              {wallBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-terracotta" />
                      <span className="font-serif font-bold text-stone-900 text-base">
                        {b.bookingDate}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {b.wallSizeSqFt} sq ft · {b.address}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-stone-600 mt-0.5">
                        Client: {b.user?.name} ({b.user?.email})
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-400 block">Total</span>
                    <span className="text-base font-bold text-terracotta">
                      {formatPrice(b.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Custom Pottery */}
      {!loading && !error && subTab === "pottery" && (
        <div>
          {potteryRequests.length === 0 ? (
            <EmptyState
              title={isAdmin ? "No custom pottery requests" : "No custom pottery commissions yet"}
              description={
                isAdmin
                  ? "Custom pottery requests from collectors will show here."
                  : "Submit a request to commission custom ceramics."
              }
              actionText={!isAdmin && onNavigate ? "Request Custom Pottery" : undefined}
              onAction={() => onNavigate?.("pottery")}
            />
          ) : (
            <div className="space-y-4">
              {potteryRequests.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-terracotta" />
                      <span className="font-serif font-bold text-stone-900 text-base">
                        {p.quantity}x {p.item} ({p.glaze})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Needed by: {p.neededByDate}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-stone-600 mt-0.5">
                        Client: {p.user?.name} ({p.user?.email})
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-400 block">Status</span>
                    <span className="text-sm font-semibold text-stone-700 capitalize">
                      {p.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
