"use client";

import { Search, Plus, LogOut, User, LayoutDashboard, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const { user, setUser, setShowLoginModal, setShowAddItemModal } = useApp();

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 select-none">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200">
            <span className="text-white font-black text-sm tracking-tighter">JH</span>
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900">
            Jugaad<span className="text-violet-600">Hub</span>
          </span>
          <span className="hidden sm:block text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 ml-1">
            USICT
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search cameras, lab gear, books..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent focus:bg-white transition-all duration-150"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition text-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:block">Admin</span>
              </Link>
              <Link
                href="/chat"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden md:block">Chat</span>
              </Link>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm shadow-violet-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">List Item</span>
              </button>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-100 cursor-default">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={() => setUser(null)}
                title="Logout"
                className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm shadow-violet-200"
            >
              <User className="w-4 h-4" />
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
