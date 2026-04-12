"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, Wallet, CreditCard, Loader2, Copy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useApp } from "@/context/AppContext";

export default function FinalPaymentModal({ rental, onClose }: { rental: any, onClose: () => void }) {
  const { showToast, sendMessage, user } = useApp();
  
  const [step, setStep] = useState<"pay" | "processing" | "success" | "otp">("pay");
  const [method, setMethod] = useState<"wallet" | "razorpay">("wallet");
  const [otp, setOtp] = useState("");
  const [renterBalance, setRenterBalance] = useState<number>(0);

  const item = rental.items || rental; 
  const platformFee = rental.platform_fee || 9;
  const deposit = rental.deposit || 0;

  const exactTotalRent = rental.offered_price * rental.rental_days;
  const exactTotalPayable = exactTotalRent + platformFee + deposit;

  // STRICT BALANCE CHECK LOGIC
  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        const { data } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single();
        if (data) setRenterBalance(data.wallet_balance || 0);
      }
    };
    fetchBalance();
  }, [user]);

  const hasInsufficientBalance = renterBalance < exactTotalPayable;
  const isWalletLow = method === "wallet" && hasInsufficientBalance;

  const handleDismiss = () => {
    sessionStorage.setItem(`dismissed_pay_${rental.id}`, "true");
    onClose();
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const executeDatabasePayment = async (paymentMethodUsed: "wallet" | "razorpay") => {
    setStep("processing");
    try {
      const newOtp = String(Math.floor(1000 + Math.random() * 9000));
      const startDate = new Date();
      const expectedReturnDate = new Date();
      expectedReturnDate.setDate(startDate.getDate() + rental.rental_days); 

      if (paymentMethodUsed === "wallet") {
        const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", user?.id).single();
        const freshBalance = profile?.wallet_balance || 0;
        setRenterBalance(freshBalance);

        if (freshBalance < exactTotalPayable) {
          showToast({ message: "Insufficient Balance!", type: "error" });
          setStep("pay");
          return;
        }

        const { error: deductError } = await supabase.from("profiles").update({ wallet_balance: freshBalance - exactTotalPayable }).eq("id", user?.id);
        if (deductError) throw deductError;
      }

      // UPDATE RENTAL RECORD
      const { error } = await supabase.from("rentals").update({
        status: "active", 
        offer_status: "paid",
        total_rent: exactTotalRent,       
        total_amount: exactTotalPayable,  
        otp: newOtp,
        payment_method: paymentMethodUsed,
        started_at: startDate.toISOString(),
        expected_return_at: expectedReturnDate.toISOString()
      }).eq("id", rental.id);

      if (error) throw error;

      await supabase.rpc('add_to_wallet', { target_user_id: rental.owner_id, amount: exactTotalRent });
      await supabase.from("items").update({ is_available: false }).eq("id", rental.product_id);
      
      const title = item?.title || "Item";
      await sendMessage(`✅ OFFER PAYMENT DONE!\n\nI have paid ₹${exactTotalPayable} for ${title}. My Handover OTP is: ${newOtp}`, rental.owner_id);

      // 🔥 FAILSAFE: Explicit Toast message with OTP. 
      // Agar parent component real-time update se modal ko destroy bhi kar de, tab bhi ye OTP Toast user ko screen par zarur dikhega!
      showToast({ message: `🎉 Payment Success! Handover OTP: ${newOtp}`, type: "success" });

      setOtp(newOtp);
      setStep("success");
      setTimeout(() => { setStep("otp"); }, 1500);

    } catch (err) {
      showToast({ message: "Payment failed", type: "error" });
      setStep("pay");
    }
  };

  const handleFinalPaymentClick = async () => {
    if (isWalletLow) {
      showToast({ message: "Insufficient Wallet Balance!", type: "error" });
      return;
    }

    if (method === "wallet") {
      executeDatabasePayment("wallet");
    } else {
      // TRIGGER RAZORPAY
      setStep("processing");
      const res = await initializeRazorpay();
      if (!res) {
        showToast({ message: "Razorpay SDK failed to load.", type: "error" });
        setStep("pay");
        return;
      }

      const title = item?.title || "Item";
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: exactTotalPayable * 100, 
        currency: "INR",
        name: "JugaadHub",
        description: `Offer Payment: ${title}`,
        theme: { color: "#004643" },
        // 🔥 Arrow function taaki react state properly bound rahe
        handler: async (response: any) => {
          await executeDatabasePayment("razorpay");
        },
        prefill: {
          name: user?.name || "User",
          email: user?.email || "user@jugaadhub.com",
        },
      };

      try {
        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
        paymentObject.on('payment.failed', function () {
          showToast({ message: "Payment cancelled.", type: "error" });
          setStep("pay");
        });
      } catch (error) {
        showToast({ message: "Could not open payment gateway.", type: "error" });
        setStep("pay");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget && step === "pay") handleDismiss(); }}>
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="bg-[#004643] p-5 text-[#F0EDE5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> 
            <span className="font-bold">Final Payment</span>
          </div>
          {step !== "processing" && (
            <button onClick={handleDismiss} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === "pay" && (
            <>
              <div className="text-center mb-5">
                <p className="text-xs font-bold text-[#004643]/50 uppercase mb-1 tracking-widest">Agreed Price Total</p>
                <h2 className="text-4xl font-black text-[#004643]">₹{exactTotalPayable}</h2>
              </div>

              <div className="bg-[#004643]/5 border border-[#004643]/10 rounded-2xl p-4 space-y-2 text-sm mb-6">
                <div className="flex justify-between text-[#004643]/70 font-medium">
                  <span>Rent ({rental.rental_days} days @ ₹{rental.offered_price})</span>
                  <span className="font-bold text-[#004643]">₹{exactTotalRent}</span>
                </div>
                <div className="flex justify-between text-[#004643]/70 font-medium">
                  <span>Platform Fee</span>
                  <span className="font-bold text-[#004643]">₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-[#004643]/70 font-medium items-center">
                  <span>Security Deposit <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-md ml-1.5 uppercase">Refundable</span></span>
                  <span className="font-bold text-[#004643]">₹{deposit}</span>
                </div>
                <div className="border-t border-[#004643]/15 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-black text-[#004643] text-sm uppercase tracking-wide">Total Payable</span>
                  <span className="font-black text-[#004643] text-lg">₹{exactTotalPayable}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setMethod("wallet")} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${method==='wallet' ? 'border-[#004643] bg-[#004643]/5 shadow-sm' : 'border-[#004643]/10 bg-white hover:border-[#004643]/30'}`}>
                  <Wallet className={`w-6 h-6 ${method==='wallet' ? 'text-[#004643]' : 'text-[#004643]/40'}`} /> 
                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] font-black ${method==='wallet' ? 'text-[#004643]' : 'text-[#004643]/50'}`}>WALLET</span>
                    <span className={`text-[9px] font-bold mt-0.5 ${hasInsufficientBalance ? 'text-red-500' : 'text-[#004643]/60'}`}>
                      Bal: ₹{renterBalance.toLocaleString()}
                    </span>
                  </div>
                </button>
                <button onClick={() => setMethod("razorpay")} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${method==='razorpay' ? 'border-[#004643] bg-[#004643]/5 shadow-sm' : 'border-[#004643]/10 bg-white hover:border-[#004643]/30'}`}>
                  <CreditCard className={`w-6 h-6 ${method==='razorpay' ? 'text-[#004643]' : 'text-[#004643]/40'}`} /> 
                  <span className={`text-[10px] font-black mt-1 ${method==='razorpay' ? 'text-[#004643]' : 'text-[#004643]/50'}`}>RAZORPAY</span>
                </button>
              </div>
              
              <button 
                onClick={handleFinalPaymentClick} 
                disabled={isWalletLow}
                className={`w-full py-4 text-[#F0EDE5] rounded-2xl font-black shadow-lg transition-all active:scale-95 ${isWalletLow ? 'bg-red-500 shadow-red-500/20' : 'bg-[#004643] hover:bg-[#004643]/90 shadow-[#004643]/20'}`}
              >
                {isWalletLow ? "Low Wallet Balance" : method === "wallet" ? "Pay & Get OTP" : "Pay via Razorpay"}
              </button>
            </>
          )}

          {step === "processing" && (
            <div className="py-10 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#004643]" />
              <p className="mt-4 font-bold text-[#004643]">Securing Payment...</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-10 text-center text-emerald-600 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-16 h-16 mx-auto drop-shadow-md" />
              <h3 className="text-xl font-black mt-4">Payment Success!</h3>
            </div>
          )}

          {step === "otp" && (
            <div className="py-4 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-xl font-black text-[#004643] mb-1">Rental Confirmed! 🎉</h3>
              <p className="text-[#004643]/60 text-xs font-medium mb-6">Share this OTP with the owner when you meet to collect the gear.</p>
              
              <div className="bg-[#004643] rounded-3xl px-6 py-6 mb-6 w-full relative shadow-xl shadow-[#004643]/20">
                <p className="text-[10px] text-[#F0EDE5]/60 mb-3 uppercase tracking-widest font-bold">Handover OTP</p>
                <div className="flex items-center justify-center gap-2.5">
                  {otp.split("").map((digit, i) => (
                    <div key={i} className="w-12 h-14 bg-white/10 rounded-xl flex items-center justify-center text-3xl font-black text-[#F0EDE5] border border-white/20 shadow-inner">
                      {digit}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigator.clipboard.writeText(otp).then(() => showToast({ message: "OTP copied!", type: "success" }))} className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 text-[#F0EDE5]/60 hover:text-[#F0EDE5] hover:bg-white/20 transition">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => { handleDismiss(); window.location.reload(); }} 
                className="w-full py-3.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-sm rounded-2xl hover:bg-emerald-200 transition-all active:scale-95"
              >
                Done & Go to Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}