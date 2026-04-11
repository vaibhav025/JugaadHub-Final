"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, Copy, Wallet, AlertCircle, QrCode, Loader2, MessageSquareText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type FlowState = "confirm" | "qr" | "processing" | "success" | "otp";

const PLATFORM_FEE = 9; 

export default function CheckoutModal() {
  const { user, checkoutItem, setCheckoutItem, showToast, sendMessage } = useApp();
  const item = checkoutItem;
  const router = useRouter(); 

  const [flow, setFlow] = useState<FlowState>("confirm");
  const [method, setMethod] = useState<"wallet" | "upi">("wallet");
  const [days, setDays] = useState(1);
  const [otp, setOtp] = useState("");
  const [renterBalance, setRenterBalance] = useState<number>(0);

  // 🔥 NEGOTIATION STATES
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [offeredRent, setOfferedRent] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setFlow("confirm");
      setMethod("wallet");
      setDays(1);
      setOtp("");
      setIsNegotiating(false);
      setOfferedRent(item.dailyRent);
    }
  }, [item]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        const { data } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single();
        if (data) setRenterBalance(data.wallet_balance || 0);
      }
    };
    fetchBalance();
  }, [user]);

  if (!item) return null;

  // Dynamic calculations based on Negotiation vs Direct Buy
  const activeRent = isNegotiating ? offeredRent : item.dailyRent;
  const totalRent = activeRent * days;
  const totalBlocked = totalRent + item.deposit + PLATFORM_FEE;
  const hasInsufficientBalance = renterBalance < totalBlocked;

  const handleProceed = async () => {
    if (!user || !item.owner_id) {
      showToast({ message: "User info missing. Please log in again.", type: "error" });
      return;
    }

    // 🔥 IF NEGOTIATING -> SEND OFFER TO OWNER
    if (isNegotiating) {
      setFlow("processing");
      try {
        const { error: offerError } = await supabase.from("rentals").insert([{
          product_id: item.id,
          renter_id: user.id,
          renter_name: user.name || user.email?.split('@')[0] || "User",
          owner_id: item.owner_id,    
          rental_days: days,
          total_rent: totalRent,
          deposit: item.deposit,
          total_amount: totalBlocked,
          platform_fee: PLATFORM_FEE, 
          payment_method: method, 
          status: 'pending', // 🔥 FIX: Kept as pending so DB doesn't reject it
          offered_price: offeredRent,
          offer_status: 'pending' // 🔥 Actual negotiation status
        }]);
        
        if (offerError) throw offerError;

        // Send Chat Message
        const offerMsg = `🤝 NEW OFFER: ${item.title}\nDays: ${days}\n\nMy Offer: ₹${offeredRent}/day (Original: ₹${item.dailyRent})\nTotal: ₹${totalBlocked}\n\nCan we finalize this? Please review my offer!`;
        await sendMessage(offerMsg, item.owner_id); 
        
        showToast({ message: "Offer Sent Successfully!", type: "success" });
        setCheckoutItem(null);
        router.push(`/chat?newUserId=${item.owner_id}&newUserName=Owner`);
      } catch (err: any) {
        console.error("Negotiation Error:", err);
        showToast({ message: err.message || "Failed to send offer. Check Database columns.", type: "error" });
        setFlow("confirm");
      }
      return;
    }

    // NORMAL DIRECT PAYMENT FLOW
    if (method === "wallet") {
      if (hasInsufficientBalance) return;
      processPayment();
    } else {
      setFlow("qr"); 
    }
  };

  const processPayment = async () => {
    // 🔥 FIX: Add this safety check. Now TS knows 'user' is definitely not null below this line.
    if (!user) return; 

    setFlow("processing");
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); 
      const newOtp = String(Math.floor(1000 + Math.random() * 9000));

      if (method === "wallet") {
        const { error: deductError } = await supabase.from("profiles").update({ wallet_balance: renterBalance - totalBlocked }).eq("id", user.id);
        if (deductError) throw deductError;
      }
      const { error: walletError } = await supabase.rpc('add_to_wallet', { target_user_id: item.owner_id!, amount: totalRent });
      if (walletError) console.error("Owner Wallet Update Failed:", walletError);

      const { error: rentalError } = await supabase.from("rentals").insert([{
        product_id: item.id, 
        renter_id: user.id, 
        renter_name: user.name || user.email?.split('@')[0] || "User",
        owner_id: item.owner_id, 
        rental_days: days, 
        total_rent: totalRent, 
        deposit: item.deposit,
        total_amount: totalBlocked, 
        platform_fee: PLATFORM_FEE, 
        otp: newOtp, 
        payment_method: method, 
        status: 'pending' 
      }]);
      if (rentalError) throw rentalError;

      const automatedMessage = `🚀 RENTAL REQUEST: ${item.title}\nDays: ${days} day(s)\nPaid via: ${method.toUpperCase()}\nTotal Paid by Renter: ₹${totalBlocked}\n\n💰 MONEY CREDITED: ₹${totalRent} has been successfully added to your JugaadHub Wallet!\n\n🔑 HANDOVER OTP: ${newOtp}`;
      await sendMessage(automatedMessage, item.owner_id!); 

      await supabase.from("items").update({ rentals_count: ((item as any).rentals_count || 0) + 1, is_available: false, last_rental_days: days }).eq("id", item.id);

      setOtp(newOtp);
      setFlow("success");
      setTimeout(() => setFlow("otp"), 1500); 
    } catch (error: any) {
      showToast({ message: "Payment failed: " + error.message, type: "error" });
      setFlow("confirm");
    }
  };

  const close = () => {
    setCheckoutItem(null);
    if (flow === "otp" || flow === "success") window.location.reload(); 
  };

  const maxAllowedDays = (item as any).max_days || 10;
  const minOfferLimit = Math.max(10, Math.floor(item.dailyRent * 0.6)); // 40% Max discount allowed

  const handleGoToMessages = () => {
    setCheckoutItem(null);
    const ownerName = item.owner_name || item.owner.split("@")[0];
    router.push(`/chat?newUserId=${item.owner_id}&newUserName=${encodeURIComponent(ownerName)}`);
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(otp).then(() => showToast({ message: "OTP copied to clipboard!", type: "success" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && flow !== "processing" && close()}>
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative" style={{ animation: "slideUp 0.25s ease-out" }}>
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#004643]/10 bg-white/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#004643]" />
            <h2 className="text-lg font-black text-[#004643]">{flow === "confirm" ? "Confirm Rental" : "Escrow"}</h2>
          </div>
          {flow !== "processing" && (
            <button onClick={close} className="p-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/40 transition"><X className="w-5 h-5" /></button>
          )}
        </div>

        {flow === "confirm" && (
          <div className="px-6 py-5 space-y-5">
            <div className="flex gap-4 p-4 bg-[#004643]/5 rounded-2xl">
              <img src={item.image} alt={item.title} className="w-20 h-16 object-cover rounded-xl" />
              <div>
                <p className="font-bold text-[#004643] text-sm">{item.title}</p>
                <p className={`font-black mt-1 ${isNegotiating ? 'text-[#004643]/40 line-through' : 'text-[#004643]'}`}>₹{item.dailyRent}/day</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#F0EDE5] border border-[#004643]/15 rounded-xl">
              <button onClick={() => setDays((prev) => Math.max(1, prev - 1))} disabled={days <= 1} className="w-10 h-10 bg-white rounded-lg font-bold text-[#004643] shadow-sm">-</button>
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-[#004643]">{days}</span>
                <span className="text-[10px] font-bold text-[#004643]/40 uppercase tracking-widest">Days</span>
              </div>
              <button onClick={() => setDays((prev) => Math.min(maxAllowedDays, prev + 1))} disabled={days >= maxAllowedDays} className="w-10 h-10 bg-[#004643] text-[#F0EDE5] rounded-lg font-bold shadow-sm">+</button>
            </div>

            {/* 🔥 NEGOTIATION SLIDER */}
            <div className="border border-[#004643]/10 rounded-2xl overflow-hidden bg-white">
              <button onClick={() => { setIsNegotiating(!isNegotiating); setOfferedRent(item.dailyRent); }} className={`w-full px-4 py-3 flex items-center justify-between text-sm font-bold transition-colors ${isNegotiating ? "bg-[#004643]/10 text-[#004643]" : "text-[#004643]/70 hover:bg-[#004643]/5"}`}>
                <span className="flex items-center gap-2"><MessageSquareText className="w-4 h-4" /> Negotiate Price</span>
                <span className="text-xs">{isNegotiating ? "Cancel" : "Offer your price"}</span>
              </button>

              {isNegotiating && (
                <div className="p-4 bg-[#004643]/5 border-t border-[#004643]/10">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-[#004643]/60 uppercase">Your Offer</span>
                    <span className="text-2xl font-black text-[#004643]">₹{offeredRent}<span className="text-sm">/day</span></span>
                  </div>
                  <input type="range" min={minOfferLimit} max={item.dailyRent} step="5" value={offeredRent} onChange={(e) => setOfferedRent(Number(e.target.value))} className="w-full accent-[#004643] h-2 bg-[#004643]/20 rounded-lg appearance-none cursor-pointer" />
                </div>
              )}
            </div>

            <div className="bg-[#004643]/5 rounded-2xl p-4 space-y-2 text-sm">
              <div className="border-t border-[#004643]/10 pt-2 flex justify-between">
                <span className="font-bold text-[#004643]">{isNegotiating ? "Total Proposed (inc. Deposit)" : "Total Payable"}</span>
                <span className="font-black text-[#004643] text-base">₹{totalBlocked.toLocaleString()}</span>
              </div>
            </div>

            {!isNegotiating && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button onClick={() => setMethod("wallet")} className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 ${method === 'wallet' ? 'border-[#004643] bg-[#004643]/5' : 'border-[#004643]/10 bg-white'}`}>
                  <Wallet className={`w-5 h-5 ${method === 'wallet' ? 'text-[#004643]' : 'text-[#004643]/50'}`} />
                  <span className="text-[10px] font-black text-[#004643]">WALLET</span>
                </button>
                <button onClick={() => setMethod("upi")} className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 ${method === 'upi' ? 'border-[#004643] bg-[#004643]/5' : 'border-[#004643]/10 bg-white'}`}>
                  <QrCode className={`w-5 h-5 ${method === 'upi' ? 'text-[#004643]' : 'text-[#004643]/50'}`} />
                  <span className="text-[10px] font-black text-[#004643]">DIRECT UPI</span>
                </button>
              </div>
            )}

            <button onClick={handleProceed} disabled={!isNegotiating && method === "wallet" && hasInsufficientBalance} className={`w-full py-3.5 font-bold text-base rounded-2xl active:scale-95 transition-all shadow-lg ${isNegotiating ? "bg-indigo-600 text-white shadow-indigo-500/20" : (method === "wallet" && hasInsufficientBalance) ? "bg-red-500 text-white shadow-red-500/20" : "bg-[#004643] text-[#F0EDE5] shadow-[#004643]/20"}`}>
              {isNegotiating ? "Send Offer to Owner" : (method === "wallet" && hasInsufficientBalance) ? "Low Wallet Balance" : method === "wallet" ? `Pay ₹${totalBlocked.toLocaleString()} via Wallet` : "Generate UPI QR Code"}
            </button>
          </div>
        )}

        {/* QR Code Mock Screen */}
        {flow === "qr" && (
          <div className="px-6 py-10 flex flex-col items-center text-center animate-in slide-in-from-right-4">
            <h3 className="text-xl font-black text-[#004643] mb-2">Scan & Pay ₹{totalBlocked.toLocaleString()}</h3>
            <p className="text-sm text-[#004643]/60 mb-6">Use GPay, PhonePe, or Paytm</p>
            
            <div className="p-3 bg-white border-4 border-[#004643] rounded-2xl shadow-xl mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=jugaadhub@ybl&pn=JugaadHub&am=${totalBlocked}`} alt="UPI QR" className="w-40 h-40" />
            </div>
            
            <button onClick={processPayment} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20">
              Mock: Simulate Payment Success
            </button>
            <button onClick={() => setFlow("confirm")} className="w-full text-[#004643]/60 text-sm font-bold mt-4 hover:text-[#004643]">
              Go Back
            </button>
          </div>
        )}

        {flow === "processing" && (
          <div className="px-6 py-16 flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-[#004643] animate-spin mb-4" />
            <h3 className="text-xl font-black text-[#004643] mb-2">Processing...</h3>
            <p className="text-[#004643]/60 text-sm font-medium">Securing via Escrow.</p>
          </div>
        )}

        {flow === "success" && (
          <div className="px-6 py-16 flex flex-col items-center text-center" style={{ animation: "scaleIn 0.4s ease-out" }}>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-[#004643]">Success!</h3>
            <p className="text-sm text-[#004643]/60 mt-2 font-medium">Payment secured & locked in Escrow.</p>
          </div>
        )}

        {flow === "otp" && (
          <div className="px-6 py-8 flex flex-col items-center text-center" style={{ animation: "slideUp 0.3s ease-out" }}>
            <h3 className="text-xl font-black text-[#004643] mb-1">Rental Confirmed! 🎉</h3>
            <p className="text-[#004643]/60 text-sm mb-6">Share the OTP below with the owner when you meet to collect your gear.</p>
            <div className="bg-[#004643] rounded-3xl px-8 py-6 mb-6 w-full relative shadow-xl shadow-[#004643]/20">
              <p className="text-xs text-[#F0EDE5]/60 mb-3 uppercase tracking-widest font-bold">Handover OTP</p>
              <div className="flex items-center justify-center gap-3">
                {otp.split("").map((digit, i) => (
                  <div key={i} className="w-14 h-16 bg-white/10 rounded-xl flex items-center justify-center text-4xl font-black text-[#F0EDE5] border border-white/20 shadow-inner">
                    {digit}
                  </div>
                ))}
              </div>
              <button onClick={copyOtp} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-[#F0EDE5]/60 hover:text-[#F0EDE5] hover:bg-white/20 transition">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button onClick={handleGoToMessages} className="w-full py-3.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-base rounded-2xl hover:bg-emerald-200 transition">
              Go to Messages
            </button>
          </div>
        )}

      </div>
    </div>
  );
}