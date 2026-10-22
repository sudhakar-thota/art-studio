"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Shield, User, LogOut } from "lucide-react";

export function DemoSwitcher() {
  const { user, switchUser, logout } = useAuth();

  return (
    <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 border-b border-stone-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-stone-200">Interactive Role Switcher:</span>
          <span className="text-stone-400 hidden sm:inline">
            Test RBAC, permissions &amp; record walkthrough seamlessly:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => switchUser("ADMIN")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              user?.role === "ADMIN"
                ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                : "bg-stone-800 hover:bg-stone-700 text-stone-300"
            }`}
          >
            <Shield className="w-3 h-3" />
            Studio Admin
          </button>

          <button
            onClick={() => switchUser("CUSTOMER", "alice@example.com")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              user?.email === "alice@example.com"
                ? "bg-terracotta text-white font-semibold shadow-sm"
                : "bg-stone-800 hover:bg-stone-700 text-stone-300"
            }`}
          >
            <User className="w-3 h-3" />
            Alice (Customer)
          </button>

          <button
            onClick={() => switchUser("CUSTOMER", "bob@example.com")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              user?.email === "bob@example.com"
                ? "bg-terracotta text-white font-semibold shadow-sm"
                : "bg-stone-800 hover:bg-stone-700 text-stone-300"
            }`}
          >
            <User className="w-3 h-3" />
            Bob (Customer)
          </button>

          {user && (
            <button
              onClick={() => logout()}
              title="Test unauthenticated access (401)"
              className="px-2 py-1 rounded text-xs font-medium bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-200 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
