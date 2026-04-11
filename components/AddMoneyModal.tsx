"use client";

import { useState } from "react";
import { X, ShieldCheck, CheckCircle2, Wallet, QrCode } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

type FlowState = "input" | "qr" | "processing" | "success";

export default function AddMoneyModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { user, showToast } = useApp();
  const [flow, setFlow] = useState<FlowState>("input");
  const [amount, setAmount] = useState<number | "">("");

  // UPI Link generation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=jugaadhub@upi&pn=JugaadHub%20Wallet&am=${amount}&cu=INR`;

  const handleProceed = () => {
    if (!amount || amount < 50) {
      showToast({ message: "Minimum amount is ₹50", type: "error" });
      return;
    }
    setFlow("qr");
  };

  const processPayment = async () => {
    if (!user) return;
    setFlow("processing");

    try {
      // 1. Simulate Bank Delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 2. Fetch current balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      const currentBalance = profile?.wallet_balance || 0;
      const newBalance = currentBalance + Number(amount);

      // 3. Update new balance in DB
      const { error } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (error) throw error;

      // 4. Show Success
      setFlow("success");
      setTimeout(() => {
        onSuccess(); // Refresh parent page
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error("Wallet Topup Error:", error);
      showToast({ message: "Failed to add funds.", type: "error" });
      setFlow("input");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && flow !== "processing" && onClose()}>
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden" style={{ animation: "slideUp 0.25s ease-out" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#004643]/10 bg-white/50">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#004643]" />
            <h2 className="text-lg font-black text-[#004643]">Top-up Wallet</h2>
          </div>
          {flow !== "processing" && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/40 transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── 1. INPUT STATE ── */}
        {flow === "input" && (
          <div className="px-6 py-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#004643] mb-2">Enter Amount to Add</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#004643]/40">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || "")}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border border-[#004643]/20 bg-white text-[#004643] font-black text-3xl focus:ring-2 focus:ring-[#004643]/40 outline-none transition"
                />
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className="py-2 rounded-xl border border-[#004643]/10 bg-white text-[#004643] font-bold text-sm hover:bg-[#004643]/5 transition"
                >
                  +₹{val}
                </button>
              ))}
            </div>

            <button
              onClick={handleProceed}
              disabled={!amount || amount < 50}
              className="w-full py-3.5 bg-[#004643] text-[#F0EDE5] font-bold rounded-2xl hover:bg-[#004643]/90 disabled:opacity-50 transition shadow-lg"
            >
              Proceed to Add
            </button>
          </div>
        )}

        {/* ── 2. QR CODE STATE ── */}
        {flow === "qr" && (
          <div className="px-6 py-8 text-center space-y-4">
            <p className="text-sm font-bold text-[#004643]/60 uppercase tracking-widest">Pay to top-up</p>
            <h1 className="text-4xl font-black text-[#004643]">₹{Number(amount).toLocaleString()}</h1>
            
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-[#004643]/10 inline-block mx-auto relative">
              <img src={qrUrl} alt="UPI QR" className="w-44 h-44 rounded-xl relative z-10" />
            </div>
            
            <p className="text-xs text-[#004643]/50 font-semibold mb-2">Scan with GPay, PhonePe, or Paytm</p>

            <button 
              onClick={processPayment}
              className="w-full mt-4 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" /> Simulate Payment (Demo)
            </button>
          </div>
        )}

        {/* ── 3. PROCESSING STATE ── */}
        {flow === "processing" && (
          <div className="px-6 py-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#004643]/5 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 border-4 border-[#004643]/10 border-t-[#004643] rounded-full animate-spin"></div>
              <Wallet className="w-8 h-8 text-[#004643] animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-[#004643] mb-2">Adding Funds...</h3>
            <p className="text-[#004643]/60 text-sm font-medium">Please wait while we secure your transaction.</p>
          </div>
        )}

        {/* ── 4. SUCCESS STATE ── */}
        {flow === "success" && (
          <div className="px-6 py-16 flex flex-col items-center text-center" style={{ animation: "scaleIn 0.4s ease-out" }}>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-[#004643]">₹{Number(amount).toLocaleString()} Added!</h3>
            <p className="text-sm text-[#004643]/60 mt-2 font-medium">Successfully credited to your wallet.</p>
          </div>
        )}
      </div>
    </div>
  );
}