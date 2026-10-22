"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { WallBooking } from "@/lib/types";
import {
  formatPrice,
  getDateDaysFromNow,
  getTodayDateString,
  getDaysDifferenceFromToday,
  canCancelWallBooking,
} from "@/lib/utils";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { AlertBanner, AlertType } from "./AlertBanner";
import {
  Calendar,
  Ruler,
  MapPin,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  Ban,
} from "lucide-react";

export function WallBookingsSection() {
  const { user } = useAuth();

  // Rate & Reserved dates from seed
  const [ratePerSqFt, setRatePerSqFt] = useState<number>(18.0);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [rateLoading, setRateLoading] = useState(true);

  // Bookings list
  const [bookings, setBookings] = useState<WallBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const minDate = getDateDaysFromNow(7);
  const maxDate = getDateDaysFromNow(90);

  const [bookingDate, setBookingDate] = useState<string>(getDateDaysFromNow(14));
  const [wallSizeSqFt, setWallSizeSqFt] = useState<number>(100);
  const [address, setAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Alerts
  const [alert, setAlert] = useState<{ type: AlertType; message: string; details?: string } | null>(null);

  // Fetch Rate & Unavailable Dates
  const fetchRateInfo = async () => {
    try {
      const res = await fetch("/api/wall-bookings/rate");
      if (res.ok) {
        const data = await res.json();
        setRatePerSqFt(data.ratePerSqFt || 18.0);
        setBookedDates(data.bookedDates || []);
      }
    } catch (err) {
      console.error("Could not fetch wall rate:", err);
    } finally {
      setRateLoading(false);
    }
  };

  // Fetch Bookings (Customer sees own, Admin sees all)
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wall-bookings");
      if (!res.ok) {
        if (res.status === 401) {
          // Guest browsing
          setBookings([]);
          setLoading(false);
          return;
        }
        throw new Error("Failed to load wall bookings.");
      }
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching wall mural bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateInfo();
    fetchBookings();
  }, [user]);

  // Calculated estimated price
  const estimatedPrice = wallSizeSqFt * ratePerSqFt;
  const isDateAlreadyBooked = bookedDates.includes(bookingDate);

  // Customer Submits Booking
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!user) {
      setAlert({
        type: "warning",
        message: "Sign in required",
        details: "Please sign in as a customer (Alice or Bob) to book a wall date.",
      });
      return;
    }

    if (user.role === "ADMIN") {
      setAlert({
        type: "error",
        message: "Action Refused (403 Forbidden)",
        details: "Studio admins cannot book wall dates. Please switch to a customer account.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/wall-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate,
          wallSizeSqFt: Number(wallSizeSqFt),
          address,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // App refusal state (e.g. 409 Conflict if date taken, 400 if out of range)
        setAlert({
          type: "error",
          message: res.status === 409 ? "Booking Refusal: Date Already Taken" : "Booking Refusal",
          details: data.error || "The studio could not process this booking.",
        });
        fetchRateInfo(); // refresh booked dates
        return;
      }

      setAlert({
        type: "success",
        message: `Wall painting requested for ${bookingDate}!`,
        details: "Your booking is currently REQUESTED. The studio will review and confirm your date.",
      });

      // Reset form & reload
      setNotes("");
      fetchRateInfo();
      fetchBookings();
    } catch (err: any) {
      setAlert({
        type: "error",
        message: "Network Error",
        details: err.message || "Could not reach studio server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Confirms or Declines Booking
  const handleUpdateStatus = async (bookingId: string, newStatus: "CONFIRMED" | "DECLINED") => {
    setActionLoadingId(bookingId);
    setAlert(null);

    try {
      const res = await fetch(`/api/wall-bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: "Status Update Refusal",
          details: data.error || "Failed to update booking status.",
        });
        return;
      }

      setAlert({
        type: "success",
        message: `Booking has been ${newStatus.toLowerCase()}.`,
      });

      fetchBookings();
      fetchRateInfo();
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

  // Customer Cancels Booking (until 3 days before date)
  const handleCancelBooking = async (booking: WallBooking) => {
    const cancelCheck = canCancelWallBooking(booking.bookingDate);
    if (!cancelCheck.canCancel) {
      setAlert({
        type: "error",
        message: "Cancellation Refused",
        details: cancelCheck.error,
      });
      return;
    }

    if (!confirm(`Are you sure you want to cancel your wall painting booking for ${booking.bookingDate}?`)) {
      return;
    }

    setActionLoadingId(booking.id);
    setAlert(null);

    try {
      const res = await fetch(`/api/wall-bookings/${booking.id}/cancel`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: "Cancellation Refused",
          details: data.error || "Failed to cancel booking.",
        });
        return;
      }

      setAlert({
        type: "success",
        message: "Wall painting booking cancelled.",
        details: `The reservation on ${booking.bookingDate} has been released.`,
      });

      fetchBookings();
      fetchRateInfo();
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

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            Feature 2 · Paints walls, on booking
          </span>
          <span className="text-xs text-stone-400">Custom Murals &amp; Architectural Works</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
          Wall Mural Commissions
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Reserve an exclusive painting date between 7 and 90 days away. Each date can be booked only once.
          Price is calculated at ${ratePerSqFt}/sq ft. Customers can cancel until 3 days before the date.
        </p>
      </div>

      {/* Alert Notifications */}
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          details={alert.details}
          onDismiss={() => setAlert(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Customer Booking Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Book a Mural Date
              </h2>
              <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-medium">
                Rate: ${ratePerSqFt} / sq ft
              </span>
            </div>

            <form onSubmit={handleSubmitBooking} className="mt-5 space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Installation Date (7 to 90 days away)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    min={minDate}
                    max={maxDate}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-stone-400">
                    Lead time: {getDaysDifferenceFromToday(bookingDate)} days away
                  </span>
                  {isDateAlreadyBooked ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      Date Reserved
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Date Available
                    </span>
                  )}
                </div>
              </div>

              {/* Wall Size Slider & Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Wall Surface Area (10 to 500 sq ft)
                  </label>
                  <span className="text-sm font-bold text-stone-900">
                    {wallSizeSqFt} sq ft
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={5}
                    value={wallSizeSqFt}
                    onChange={(e) => setWallSizeSqFt(Number(e.target.value))}
                    className="flex-1 accent-terracotta"
                  />
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={wallSizeSqFt}
                    onChange={(e) => setWallSizeSqFt(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-stone-300 rounded-lg text-sm text-center font-medium"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Site Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 124 Lotus Boulevard, Apartment 3A"
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                  />
                </div>
              </div>

              {/* Concept notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Concept &amp; Theme Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dining room accent wall, organic textures, warm ochre tones..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                />
              </div>

              {/* Live Price Estimation Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                  <span>Calculation:</span>
                  <span>
                    {wallSizeSqFt} sq ft × ${ratePerSqFt}/sq ft
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
                  <span className="font-semibold text-stone-900 text-sm">
                    Total Mural Fee:
                  </span>
                  <span className="text-xl font-serif font-bold text-terracotta">
                    {formatPrice(estimatedPrice)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || (user?.role === "ADMIN")}
                className="w-full py-2.5 px-4 bg-terracotta hover:bg-clay text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting
                  ? "Verifying Date Availability..."
                  : user?.role === "ADMIN"
                  ? "Admins Cannot Book (Customer Only)"
                  : "Request Wall Booking"}
              </button>

              <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1">
                <Info className="w-3 h-3" />
                Free cancellation allowed up to 3 days before scheduled date.
              </p>
            </form>
          </div>
        </div>

        {/* Right Column: Bookings Schedule / Studio Management */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                {user?.role === "ADMIN" ? "Studio Wall Murals Master Schedule" : "My Wall Murals"}
              </h2>
              <p className="text-xs text-stone-500">
                {user?.role === "ADMIN"
                  ? "Review, confirm or decline incoming customer wall mural requests"
                  : "Track the status of your wall painting bookings"}
              </p>
            </div>
            <button
              onClick={() => {
                fetchBookings();
                fetchRateInfo();
              }}
              className="text-xs text-stone-500 hover:text-stone-900 underline"
            >
              Refresh
            </button>
          </div>

          {/* Loading State */}
          {loading && <LoadingState message="Loading wall painting schedule..." />}

          {/* Error State */}
          {!loading && error && (
            <ErrorState
              title="Schedule Unavailable"
              message={error}
              onRetry={fetchBookings}
            />
          )}

          {/* Empty State */}
          {!loading && !error && bookings.length === 0 && (
            <EmptyState
              title={
                !user
                  ? "Sign in to view your bookings"
                  : user.role === "ADMIN"
                  ? "No wall mural bookings in the studio log"
                  : "You haven't requested any wall murals yet"
              }
              description={
                !user
                  ? "Please log in using the demo switcher at the top to access your wall bookings."
                  : user.role === "ADMIN"
                  ? "When customers request a wall mural date, it will appear here for confirmation."
                  : "Pick a date on the left to request your first handcrafted wall painting."
              }
            />
          )}

          {/* Bookings List Cards */}
          {!loading && !error && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const daysUntil = getDaysDifferenceFromToday(booking.bookingDate);
                const canCancel =
                  (booking.status === "REQUESTED" || booking.status === "CONFIRMED") &&
                  daysUntil >= 3;

                const statusStyles: Record<string, string> = {
                  REQUESTED: "bg-amber-100 text-amber-900 border-amber-300",
                  CONFIRMED: "bg-emerald-100 text-emerald-900 border-emerald-300",
                  DECLINED: "bg-rose-100 text-rose-900 border-rose-300",
                  CANCELLED: "bg-stone-100 text-stone-600 border-stone-200",
                };

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 font-bold">
                          <Calendar className="w-5 h-5 text-terracotta" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-base text-stone-900">
                              {booking.bookingDate}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                statusStyles[booking.status] || "bg-stone-100 text-stone-800"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <span className="text-xs text-stone-400">
                            {daysUntil > 0 ? `${daysUntil} days away` : "Past booking"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-stone-500 block">Total Price</span>
                        <span className="text-lg font-serif font-bold text-terracotta">
                          {formatPrice(booking.totalPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                      <div>
                        <span className="font-semibold text-stone-700">Dimensions: </span>
                        {booking.wallSizeSqFt} sq ft (${booking.ratePerSqFt}/sq ft)
                      </div>
                      <div>
                        <span className="font-semibold text-stone-700">Client: </span>
                        {booking.user?.name || "Client"} ({booking.user?.email})
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-stone-700">Address: </span>
                        {booking.address}
                      </div>
                      {booking.notes && (
                        <div className="sm:col-span-2 italic text-stone-500 bg-stone-50 p-2 rounded">
                          &ldquo;{booking.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Action Buttons based on Role */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      {user?.role === "ADMIN" ? (
                        // Admin Controls: Confirm or Decline
                        <div className="flex items-center gap-2 w-full justify-end">
                          {booking.status === "REQUESTED" ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, "DECLINED")}
                                disabled={actionLoadingId === booking.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                                disabled={actionLoadingId === booking.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm Booking</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-stone-400">
                              Status finalized ({booking.status.toLowerCase()})
                            </span>
                          )}
                        </div>
                      ) : (
                        // Customer Controls: Cancel until 3 days before date
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-stone-400">
                            {booking.status === "CANCELLED"
                              ? "Cancelled by customer"
                              : daysUntil < 3
                              ? "Cancellation window closed (< 3 days)"
                              : "Eligible for free cancellation"}
                          </span>

                          {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && (
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              disabled={!canCancel || actionLoadingId === booking.id}
                              title={
                                !canCancel
                                  ? "Wall murals can only be cancelled at least 3 days before the scheduled date."
                                  : "Cancel this booking"
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                canCancel
                                  ? "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                                  : "bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed"
                              }`}
                            >
                              {actionLoadingId === booking.id ? "Cancelling..." : "Cancel Booking"}
                            </button>
                          )}
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
    </div>
  );
}
