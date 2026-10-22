"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { Navbar } from "@/components/Navbar";
import { PaintingsSection } from "@/components/PaintingsSection";
import { WallBookingsSection } from "@/components/WallBookingsSection";
import { PotterySection } from "@/components/PotterySection";
import { DashboardSection } from "@/components/DashboardSection";
import { Palette, Brush, Coffee, Shield, Check, Lock } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"paintings" | "wall-painting" | "pottery" | "dashboard">("paintings");

  return (
    <div className="min-h-screen flex flex-col bg-studio-50">
      {/* Top Interactive Role Switcher */}
      <DemoSwitcher />

      {/* Main Studio Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Hero Studio Banner */}
      <section className="bg-stone-900 text-stone-100 py-10 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-stone-800 text-amber-300 border border-stone-700 mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Full-Stack Art Studio System · RBAC Active</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Atelier Solstice
            </h1>
            <p className="text-stone-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Handcrafted original paintings, commissioned wall murals, and artisanal custom ceramics.
              Logged in as:{" "}
              <span className="font-semibold text-amber-400">
                {user ? `${user.name} (${user.role})` : "Guest (Not Logged In)"}
              </span>
            </p>
          </div>

          {/* Quick RBAC Capability Pill Card */}
          <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-4 text-xs text-stone-300 max-w-sm">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-2">
              Current Role Permissions ({user?.role || "GUEST"}):
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {user ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-stone-500" />
                )}
                <span>Browse paintings: Allowed</span>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === "ADMIN" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-stone-500" />
                )}
                <span>Add / Edit paintings: {user?.role === "ADMIN" ? "Allowed" : "Admin Only"}</span>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === "CUSTOMER" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-stone-500" />
                )}
                <span>Buy &amp; Book: {user?.role === "CUSTOMER" ? "Allowed" : "Customer Only"}</span>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === "ADMIN" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-stone-500" />
                )}
                <span>Confirm / Accept requests: {user?.role === "ADMIN" ? "Allowed" : "Admin Only"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "paintings" && (
          <PaintingsSection onNavigateToDashboard={() => setActiveTab("dashboard")} />
        )}
        {activeTab === "wall-painting" && <WallBookingsSection />}
        {activeTab === "pottery" && <PotterySection />}
        {activeTab === "dashboard" && (
          <DashboardSection onNavigate={(tab) => setActiveTab(tab as any)} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-800">Atelier Solstice</span>
            <span>· Full-Stack Art Studio Web Application</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Role-Based Access Control</span>
            <span>· Concurrency Locks</span>
            <span>· Seeded DB</span>
            <span>· DESIGN.md Included</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
