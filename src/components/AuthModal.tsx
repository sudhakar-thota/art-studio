"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Lock, Mail, User as UserIcon, ShieldAlert } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Login failed");
        }
      } else {
        const res = await signup(name, email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Signup failed");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "alice" | "bob") => {
    if (role === "admin") {
      setEmail("admin@artstudio.com");
      setPassword("admin123");
    } else if (role === "alice") {
      setEmail("alice@example.com");
      setPassword("customer123");
    } else {
      setEmail("bob@example.com");
      setPassword("customer123");
    }
    setMode("login");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              {mode === "login" ? "Studio Access" : "Customer Registration"}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {mode === "login"
                ? "Sign in as customer or studio administrator"
                : "Create a collector account to buy & book"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="bg-amber-50/70 border-b border-amber-100 px-6 py-3">
          <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
            Quick Fill Demo Accounts:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded font-medium hover:bg-stone-800 transition-colors"
            >
              👑 Studio Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("alice")}
              className="text-xs bg-white text-stone-700 border border-stone-300 px-2.5 py-1 rounded font-medium hover:bg-stone-50 transition-colors"
            >
              🎨 Customer (Alice)
            </button>
            <button
              type="button"
              onClick={() => fillDemo("bob")}
              className="text-xs bg-white text-stone-700 border border-stone-300 px-2.5 py-1 rounded font-medium hover:bg-stone-50 transition-colors"
            >
              🏺 Customer (Bob)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Clara Schumann"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-terracotta hover:bg-clay text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Customer Account"}
          </button>

          <div className="text-center pt-2">
            {mode === "login" ? (
              <p className="text-xs text-stone-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-terracotta font-semibold hover:underline"
                >
                  Register as Customer
                </button>
              </p>
            ) : (
              <p className="text-xs text-stone-500">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-terracotta font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
