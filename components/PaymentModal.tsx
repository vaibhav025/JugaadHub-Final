"use client";

import { useState, useEffect } from "react";
import { X, QrCode, Loader2, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

export default function PaymentModal({
  item,
  totalAmount,
  days,
  onClose,
  onSuccess // Yeh function tab chalega jab payment ho jayegi aur OTP generate hoga
}: {
  item: any;
  totalAmount: number;
  days: number;
  onClose: () => void;
  onSuccess: (otp: string) => void;
}) {
  const { user } = useApp();
  const [step, setStep] = useState<"qr" | "processing" | "success" | "otp">("qr");
  const [generatedOtp, setGeneratedOtp] = useState("");

  // PITCH HACK: Yeh ek real UPI QR code link hai. 
  // Agar koi judge isko apne phone se scan karega, toh uska GPay/PhonePe khul jayega (Demo mode mein).
  const upiId = "jugaadhub@upi";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=JugaadHub%20Escrow&am=${totalAmount}&cu=INR`;

  const simulatePayment = async () => {
    setStep("processing");
    
    // Simulate network delay for realism (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setStep("success");

    // Success dikhane ke 1.5 second baad OTP generate karo aur DB mein daalo
    setTimeout(async () => {
      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
      setGeneratedOtp(otp);
      
      try {
        // 🔥 Save transaction to rentals table
        await supabase.from("rentals").insert([{
          item_id: item.id,
          renter_id: user?.id,
          renter_name: user?.name,
          owner_id: item.owner_id || item.owner, // Adjust based on your items structure
          rent_amount: item.dailyRent * days,
          deposit: item.deposit,
          days: days,
          status: "active",
          handover_otp: otp
        }]);
      } catch (err) {
        console.error("Payment sync error:", err);
      }

      setStep("otp");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden" style={{ animation: "slideUp 0.3s ease-out" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#004643]/10 bg-white/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-md font-black text-[#004643]">Secure Checkout</h2>
          </div>
          {step !== "processing" && (
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#004643]/10 text-[#004643]/50 transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* STEP 1: QR CODE */}
          {step === "qr" && (
            <div className="text-center space-y-4">
              <p className="text-sm font-bold text-[#004643]/60 uppercase tracking-widest">Amount to Pay</p>
              <h1 className="text-4xl font-black text-[#004643]">₹{totalAmount.toLocaleString()}</h1>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#004643]/10 inline-block mx-auto">
                <img src={qrUrl} alt="UPI QR" className="w-40 h-40 rounded-xl" />
              </div>
              
              <p className="text-xs text-[#004643]/50 font-semibold">Scan with any UPI App (GPay, PhonePe, Paytm)</p>

              {/* Fake Scan Button for Demo */}
              <button 
                onClick={simulatePayment}
                className="w-full mt-4 py-3.5 bg-[#004643] text-white font-bold rounded-2xl hover:bg-[#004643]/90 transition shadow-lg shadow-[#004643]/20 flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" /> Simulate Payment (Dev)
              </button>
            </div>
          )}

          {/* STEP 2: PROCESSING */}
          {step === "processing" && (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-[#004643]/10 border-t-[#004643] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#004643] animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#004643]">Processing Payment</h3>
              <p className="text-sm text-[#004643]/50 mt-2 font-medium">Please do not close this window...</p>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center" style={{ animation: "scaleIn 0.4s ease-out" }}>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-[#004643]">Payment Successful!</h3>
              <p className="text-sm text-[#004643]/60 mt-2 font-medium">Secured in JugaadHub Escrow</p>
            </div>
          )}

          {/* STEP 4: HANDOVER OTP */}
          {step === "otp" && (
            <div className="text-center space-y-5" style={{ animation: "slideUp 0.3s ease-out" }}>
              <h3 className="text-xl font-bold text-[#004643]">Your Handover OTP</h3>
              <p className="text-sm text-[#004643]/60 leading-relaxed">
                Show this code to <strong className="text-[#004643]">{item.owner?.split('@')[0] || "the owner"}</strong> to collect your gear.
              </p>
              
              <div className="bg-white border-2 border-dashed border-emerald-500 rounded-2xl p-6">
                <span className="text-4xl font-black tracking-[0.3em] text-emerald-600">{generatedOtp}</span>
              </div>

              <button 
                onClick={() => {
                  onSuccess(generatedOtp);
                  onClose();
                }}
                className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
              >
                Go to Messages
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}