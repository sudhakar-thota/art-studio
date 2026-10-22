"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "./AuthModal";
import { Palette, Brush, Coffee, LayoutDashboard, UserCheck, LogIn, LogOut, Shield } from "lucide-react";

interface NavbarProps {
  activeTab: "paintings" | "wall-painting" | "pottery" | "dashboard";
  setActiveTab: (tab: "paintings" | "wall-painting" | "pottery" | "dashboard") => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { user, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("paintings")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-900 via-stone-800 to-terracotta flex items-center justify-center text-white shadow-md">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-stone-900 block leading-tight">
                  Atelier Solstice
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-widest font-sans font-medium">
                  Art Studio &amp; Ceramics
                </span>
              </div>
            </div>

            {/* Main Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <button
                onClick={() => setActiveTab("paintings")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === "paintings"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Original Paintings</span>
              </button>

              <button
                onClick={() => setActiveTab("wall-painting")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === "wall-painting"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Brush className="w-4 h-4" />
                <span>Wall Murals</span>
              </button>

              <button
                onClick={() => setActiveTab("pottery")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === "pottery"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>Custom Pottery</span>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === "dashboard"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{user?.role === "ADMIN" ? "Studio Vault & Orders" : "My Orders & Bookings"}</span>
              </button>
            </nav>

            {/* User Account / Role Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs font-semibold text-stone-900">{user.name}</span>
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Shield className="w-2.5 h-2.5" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <UserCheck className="w-2.5 h-2.5" />
                          CUSTOMER
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-500 block leading-tight">{user.email}</span>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile navigation tab strip */}
          <div className="flex md:hidden overflow-x-auto py-2 border-t border-stone-100 gap-1 scrollbar-none">
            <button
              onClick={() => setActiveTab("paintings")}
              className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-medium ${
                activeTab === "paintings" ? "bg-stone-900 text-white" : "text-stone-600 bg-stone-100"
              }`}
            >
              Paintings
            </button>
            <button
              onClick={() => setActiveTab("wall-painting")}
              className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-medium ${
                activeTab === "wall-painting" ? "bg-stone-900 text-white" : "text-stone-600 bg-stone-100"
              }`}
            >
              Wall Murals
            </button>
            <button
              onClick={() => setActiveTab("pottery")}
              className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-medium ${
                activeTab === "pottery" ? "bg-stone-900 text-white" : "text-stone-600 bg-stone-100"
              }`}
            >
              Pottery
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-medium ${
                activeTab === "dashboard" ? "bg-stone-900 text-white" : "text-stone-600 bg-stone-100"
              }`}
            >
              {user?.role === "ADMIN" ? "Studio Vault" : "My Orders"}
            </button>
          </div>
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
