"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, RefreshCcw, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useApp } from "@/context/AppContext";

interface Props {
  rental: any; 
  onClose: () => void;
  onSuccess: () => void;
}

export default function OwnerOfferModal({ rental, onClose, onSuccess }: Props) {
  const { user, sendMessage, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [isCountering, setIsCountering] = useState(false);
  const [counterPrice, setCounterPrice] = useState(rental.offered_price);

  const isOwner = user?.id === rental.owner_id;
  const oppositeUserId = isOwner ? rental.renter_id : rental.owner_id;
  const itemData = rental.items || { title: "Gear", image: "" };

  // --- 1. ACCEPT LOGIC ---
  const handleAccept = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("rentals").update({
        offer_status: "accepted",
        status: "pending_payment" 
      }).eq("id", rental.id);
      
      if (error) throw error; 

      // 🔥 URL GENERATION FIX
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const payLink = `${baseUrl}/chat?pay=${rental.id}`;

      const msg = isOwner 
        ? `🎉 OFFER ACCEPTED!\n\nI have accepted your offer of ₹${rental.offered_price}/day. Click the link below to complete your payment:\n\n🔗 ${payLink}`
        : `🎉 COUNTER ACCEPTED!\n\nI agree to your counter offer of ₹${rental.offered_price}/day. Here is the link to complete my payment:\n\n🔗 ${payLink}`;
      
      await sendMessage(msg, oppositeUserId);
      showToast({ message: "Offer Accepted!", type: "success" });
      onSuccess();
    } catch (err: any) {
      console.error("Accept Error:", err);
      showToast({ message: err.message || "Failed to update database.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. COUNTER LOGIC ---
  const handleCounter = async () => {
    setLoading(true);
    try {
      const nextStatus = isOwner ? "countered" : "pending";

      // 🔥 FIX: Added strict error checking here
      const { error } = await supabase.from("rentals").update({
        offer_status: nextStatus,
        offered_price: counterPrice
      }).eq("id", rental.id);

      if (error) throw error;

      const msg = `🔄 COUNTER OFFER!\n\nHow about ₹${counterPrice}/day for ${itemData.title}? Does this work for you?`;
      await sendMessage(msg, oppositeUserId);

      showToast({ message: "Counter offer sent!", type: "success" });
      onSuccess();
    } catch (err: any) {
      console.error("Counter Error:", err);
      showToast({ message: err.message || "Failed to update database.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- 3. REJECT LOGIC ---
  const handleReject = async () => {
    setLoading(true);
    try {
      // 🔥 FIX: Added strict error checking here
      const { error } = await supabase.from("rentals").update({
        offer_status: "rejected",
        status: "cancelled"
      }).eq("id", rental.id);

      if (error) throw error;

      await sendMessage(`❌ OFFER REJECTED\n\nSorry, we couldn't agree on a price for ${itemData.title}.`, oppositeUserId);
      showToast({ message: "Offer Rejected.", type: "error" });
      onSuccess();
    } catch (err: any) {
      console.error("Reject Error:", err);
      showToast({ message: err.message || "Failed to update database.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#004643]/10 bg-white/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className="text-lg font-black text-[#004643]">
              {isOwner ? "New Offer Received!" : "Counter Offer Received!"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/40"><X className="w-5 h-5"/></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex gap-4 p-4 bg-[#004643]/5 rounded-2xl">
            {itemData.image && <img src={itemData.image} className="w-16 h-16 object-cover rounded-xl shadow-sm" alt="gear" />}
            <div className="flex flex-col justify-center">
              <span className="text-xs font-bold text-[#004643]/50 uppercase">
                {isOwner ? `Requested by ${rental.renter_name}` : `Owner's Price`}
              </span>
              <span className="font-bold text-[#004643] leading-snug line-clamp-2">{itemData.title}</span>
              <span className="text-xs font-semibold text-[#004643]/70 mt-1">Duration: {rental.rental_days} Days</span>
            </div>
          </div>

          <div className="text-center bg-white border border-[#004643]/10 py-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-[#004643]/50 uppercase tracking-widest mb-1">
              {isOwner ? "Renter's Proposed Rent" : "Owner's Counter Rent"}
            </p>
            <div className="text-4xl font-black text-[#004643]">
              ₹{rental.offered_price} <span className="text-lg font-bold text-[#004643]/40">/ day</span>
            </div>
          </div>

          {!isCountering ? (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={handleAccept} disabled={loading} className="col-span-2 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Accept & Finalize
              </button>
              <button onClick={() => setIsCountering(true)} disabled={loading} className="flex items-center justify-center gap-2 py-3 bg-[#004643] text-white rounded-xl font-bold hover:bg-[#004643]/90 active:scale-95 transition-all">
                <RefreshCcw className="w-4 h-4" /> Counter
              </button>
              <button onClick={handleReject} disabled={loading} className="flex items-center justify-center gap-2 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 active:scale-95 transition-all">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 space-y-4 bg-white p-4 rounded-2xl border border-[#004643]/10">
              <label className="block text-sm font-bold text-[#004643]">Your Counter Price (₹/day)</label>
              <input 
                type="number" 
                value={counterPrice} 
                onChange={(e) => setCounterPrice(Number(e.target.value))} 
                className="w-full px-4 py-3 rounded-xl border border-[#004643]/20 focus:ring-2 focus:ring-[#004643]/40 outline-none font-bold text-xl text-center text-[#004643]"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsCountering(false)} className="flex-1 py-3 bg-gray-100 text-[#004643]/60 rounded-xl font-bold hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={handleCounter} disabled={loading} className="flex-1 py-3 bg-[#004643] text-white rounded-xl font-bold shadow-lg hover:bg-[#004643]/90 transition-all">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send Counter"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}