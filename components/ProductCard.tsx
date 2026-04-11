"use client";

import Link from "next/link";
import { Star, ShieldCheck, MessageCircle, Trash2, Clock, Lock } from "lucide-react";
import { useApp, type Item } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

const CATEGORY_STYLES: Record<string, string> = {
  Videography: "bg-[#004643]/10 text-[#004643]",
  "Lab Gear": "bg-emerald-100 text-emerald-700",
  Electronics: "bg-blue-100 text-blue-700",
  Books: "bg-amber-100 text-amber-700",
  Tools: "bg-orange-100 text-orange-700",
  Music: "bg-pink-100 text-pink-700",
};

const getOptimizedUrl = (url: string) => {
  if (!url || !url.includes("cloudinary")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_500/");
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
                ? "fill-amber-200 text-amber-400"
                : "fill-[#004643]/10 text-[#004643]/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function ProductCard({ item, onDeleteSuccess }: { item: Item, onDeleteSuccess?: (id: string) => void }) {
  const { user, setShowLoginModal, setCheckoutItem, showToast } = useApp();

  const ownerAlias = item.owner_name || item.owner?.split("@")[0].split(".").slice(-1)[0] || "Owner";
  const isOwner = user?.id === item.owner_id;
  
  // 🔥 Sync check: item status directly from passed prop
  const isRented = (item as any).is_available === false;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    const confirmDelete = window.confirm("Are you sure you want to remove this listing?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", item.id);
      if (error) throw error;
      if (onDeleteSuccess) onDeleteSuccess(item.id);
      showToast({ message: "Item removed successfully!", type: "success" });
    } catch (error: any) {
      showToast({ 
        message: "Cannot delete! This item is currently rented out.", 
        type: "error" 
      });
    }
  };

  return (
    <div className={`group bg-[#F0EDE5] rounded-2xl border border-[#004643]/10 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col w-64 shrink-0 hover:-translate-y-0.5 ${isRented ? 'opacity-90' : ''}`}>
      <div className="relative w-full h-40 overflow-hidden bg-[#004643]/5">
        <img
          src={getOptimizedUrl(item.image)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {isRented && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-all">
             <div className="bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl animate-pulse">
                <Lock className="w-3 h-3" /> RENTED OUT
             </div>
          </div>
        )}

        <span className={`absolute top-2 left-2 text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_STYLES[item.category] ?? "bg-[#004643]/10 text-[#004643]"}`}>
          {item.category}
        </span>

        {isOwner && (
          <button onClick={handleDelete} className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-sm transition-all z-10 hover:scale-105">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-bold text-[#004643] text-sm leading-snug line-clamp-2">{item.title}</h3>

        <div className="flex items-center gap-1.5">
          <StarRating rating={item.rating || 5} />
          <span className="text-xs text-[#004643]/50 font-medium">{(item.rating || 5).toFixed(1)}</span>
        </div>

        <p className="text-xs text-[#004643]/40 truncate">
          by <span className="font-medium text-[#004643]/60">{ownerAlias}</span>
        </p>

        <div className="mt-auto pt-2 border-t border-[#004643]/10">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xl font-black text-[#004643]">₹{item.dailyRent.toLocaleString()}</span>
            <span className="text-xs text-[#004643]/40 font-medium">/day</span>
          </div>
        </div>

        <div className="mt-3">
          {!user ? (
            <button onClick={() => setShowLoginModal(true)} className="w-full py-2.5 bg-[#004643]/10 text-[#004643] text-sm font-bold rounded-xl hover:bg-[#004643]/20 transition-all">Login to Rent</button>
          ) : isOwner ? (
            <button disabled className="w-full py-2.5 bg-[#004643]/5 border border-[#004643]/10 text-[#004643]/30 text-sm font-bold rounded-xl cursor-not-allowed">Your Item</button>
          ) : isRented ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-amber-50 border border-amber-200 py-2 rounded-xl flex flex-col items-center justify-center opacity-80">
                <span className="text-amber-700 text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Booked For
                </span>
                <span className="text-[#004643] text-[11px] font-black leading-tight">
                   {(item as any).last_rental_days || '—'} Days
                </span>
              </div>
              <Link href={`/chat?newUserId=${item.owner_id}&newUserName=${encodeURIComponent(item.owner_name || "Owner")}`} className="flex items-center justify-center p-2.5 bg-[#004643]/10 text-[#004643] rounded-xl hover:bg-[#004643]/20 active:scale-95 transition-all">
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setCheckoutItem(item)} className="flex-1 py-2.5 bg-[#004643] text-[#F0EDE5] text-sm font-bold rounded-xl hover:bg-[#004643]/80 active:scale-95 transition-all shadow-sm shadow-[#004643]/20">Rent Now</button>
              <Link href={`/chat?newUserId=${item.owner_id}&newUserName=${encodeURIComponent(item.owner_name || "Owner")}`} className="flex items-center justify-center p-2.5 bg-[#004643]/10 text-[#004643] rounded-xl hover:bg-[#004643]/20 active:scale-95 transition-all">
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}