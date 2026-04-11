"use client";

import { Search, Plus, LogOut, User, LayoutDashboard, MessageCircle, ShieldCheck, Wallet, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

// 🔥 Naya Digilocker Modal Import Kiya
import DigilockerModal from "@/components/DigilockerModal"; 
// 🔥 THE GLOBAL OFFER RADAR IMPORT
import OfferListener from "@/components/OfferListener";

export default function Navbar() {
  const { user, setUser, setShowLoginModal, setShowAddItemModal, searchQuery, setSearchQuery, unreadCount, showToast, items } = useApp();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  
  // 🔥 Search Dropdown States
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (data && data.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkRole();
  }, [user]);

  // 🔥 1. Filter items based on search query (Limit to 5)
  const suggestions = items
    .filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  // 🔥 2. Click-Outside Logic for Search Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 3. Handle Click on Suggestion
  const handleSuggestionClick = (title: string) => {
    setSearchQuery(title);
    setIsFocused(false);
    document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#F0EDE5]/95 backdrop-blur-md border-b border-[#004643]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 select-none">
            <div className="w-8 h-8 bg-[#004643] rounded-lg flex items-center justify-center shadow-sm shadow-[#004643]/20">
              <span className="text-[#F0EDE5] font-black text-sm tracking-tighter">JH</span>
            </div>
            <span className="font-black text-xl tracking-tight text-[#004643]">
              Jugaad<span className="text-[#004643]/70">Hub</span>
            </span>
            <span className="hidden sm:block text-[10px] font-semibold text-[#004643] bg-[#004643]/10 border border-[#004643]/20 rounded-full px-2 py-0.5 ml-1">
              USICT
            </span>
          </Link>

          {/* --- SEARCH WITH AUTO-SUGGEST --- */}
          <div ref={wrapperRef} className="flex-1 max-w-lg mx-auto relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#004643]/50 w-4 h-4 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onFocus={() => setIsFocused(true)}
                placeholder="Search cameras, lab gear, books..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#004643]/20 bg-[#004643]/5 text-sm 
                           text-[#004643] font-medium placeholder:text-[#004643]/30 
                           focus:outline-none focus:ring-2 focus:ring-[#004643]/40 focus:bg-[#F0EDE5] 
                           transition-all duration-150"
              />
            </div>

            {/* Dropdown Menu */}
            {isFocused && searchQuery.trim() !== "" && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#F0EDE5] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,70,67,0.2)] border border-[#004643]/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.length > 0 ? (
                  <ul className="py-2">
                    {suggestions.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => handleSuggestionClick(item.title)}
                        className="px-4 py-3 hover:bg-[#004643]/10 cursor-pointer flex items-center gap-3 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden border border-[#004643]/10 shadow-sm">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-[#004643]/40" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#004643]">{item.title}</span>
                          <span className="text-[10px] text-[#004643]/60 uppercase tracking-wider font-bold">{item.category}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center flex flex-col items-center">
                    <span className="text-2xl mb-1">🤔</span>
                    <p className="text-sm text-[#004643]/60 font-medium">No gear found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                {/* CONDITIONAL ADMIN BUTTON */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#004643]/60 hover:bg-[#004643]/10 transition text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:block">Admin</span>
                  </Link>
                )}

                {/* CHAT BUTTON WITH NOTIFICATION BADGE */}
                <Link
                  href="/chat"
                  className="relative hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#004643]/60 hover:bg-[#004643]/10 transition text-sm"
                >
                  <div className="relative">
                    <MessageCircle className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-[#F0EDE5]"></span>
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block">Chat</span>
                </Link>

                {/* WALLET BUTTON */}
                <Link
                  href="/wallet"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[#004643]/60 hover:bg-[#004643]/10 transition text-sm font-semibold shrink-0"
                >
                  <Wallet className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="hidden md:block">Wallet</span>
                </Link>

                {/* KYC BUTTON */}
                <button
                  onClick={() => setShowKycModal(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 transition font-bold shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="hidden sm:block text-sm">Verify KYC</span>
                  <span className="sm:hidden text-xs">KYC</span>
                </button>
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#004643] text-[#F0EDE5] text-sm font-semibold rounded-xl hover:bg-[#004643]/80 active:scale-95 transition-all shadow-sm shadow-[#004643]/20"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:block">List Item</span>
                </button>

                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#004643]/10 cursor-default">
                  <div className="w-7 h-7 rounded-full bg-[#004643] flex items-center justify-center text-[#F0EDE5] text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-[#004643] hidden sm:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={() => setUser(null)}
                  title="Logout"
                  className="p-2 rounded-xl hover:bg-red-50 text-[#004643]/40 hover:text-red-500 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#004643] text-[#F0EDE5] text-sm font-semibold rounded-xl hover:bg-[#004643]/80 active:scale-95 transition-all shadow-sm shadow-[#004643]/20"
              >
                <User className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* KYC Modal */}
      {showKycModal && (
        <DigilockerModal 
          onClose={() => setShowKycModal(false)} 
          onSuccess={() => showToast({ message: "KYC Verified Successfully via DigiLocker!", type: "success" })} 
        />
      )}

      {/* 🔥 THE GLOBAL OFFER RADAR */}
      <OfferListener />
    </>
  );
}