"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, Copy } from "lucide-react";
import { useApp } from "@/context/AppContext";

type FlowState = "confirm" | "processing" | "success";
const DURATIONS = [1, 2, 3, 7];

export default function CheckoutModal() {
  const { checkoutItem, setCheckoutItem, showToast } = useApp();
  const item = checkoutItem;

  const [flow, setFlow] = useState<FlowState>("confirm");
  const [days, setDays] = useState(1);
  const [otp, setOtp] = useState("");

  // Reset state when a new item opens
  useEffect(() => {
    if (item) {
      setFlow("confirm");
      setDays(1);
      setOtp("");
    }
  }, [item]);

  if (!item) return null;

  const totalRent = item.dailyRent * days;
  const totalBlocked = totalRent + item.deposit;

  const handleConfirm = () => {
    setFlow("processing");
    setTimeout(() => {
      const newOtp = String(Math.floor(1000 + Math.random() * 9000));
      setOtp(newOtp);
      setFlow("success");
    }, 1500);
  };

  const close = () => setCheckoutItem(null);

  const copyOtp = () => {
    navigator.clipboard.writeText(otp).then(() => {
      showToast({ message: "OTP copied to clipboard!", type: "success" });
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && flow !== "processing" && close()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "slideUp 0.25s ease-out" }}
      >
        {/* ── CONFIRM STATE ── */}
        {flow === "confirm" && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">
                Confirm Rental
              </h2>
              <button
                onClick={close}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Item preview */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-20 h-16 object-cover rounded-xl"
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-snug">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    by {item.owner.split("@")[0]}
                  </p>
                  <p className="text-violet-600 font-black mt-1">
                    ₹{item.dailyRent}/day
                  </p>
                </div>
              </div>

              {/* Duration picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rental Duration
                </label>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        days === d
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost summary */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Rent (₹{item.dailyRent} × {days} day{days > 1 ? "s" : ""})
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{totalRent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Security Deposit (refundable)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{item.deposit.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">
                    Total Blocked via Escrow
                  </span>
                  <span className="font-black text-violet-600 text-base">
                    ₹{totalBlocked.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Deposit is held in <strong>JugaadHub Escrow</strong> and
                  released automatically when the item is returned. You&apos;re
                  fully protected.
                </p>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-3.5 bg-violet-600 text-white font-bold text-base rounded-2xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-200"
              >
                Confirm & Secure Payment →
              </button>
            </div>
          </>
        )}

        {/* ── PROCESSING STATE ── */}
        {flow === "processing" && (
          <div className="px-6 py-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mb-6">
              <svg
                className="animate-spin w-10 h-10 text-violet-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-80"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Processing Escrow Hold...
            </h3>
            <p className="text-gray-500 text-sm mb-1">
              Securing ₹{totalBlocked.toLocaleString()} via JugaadHub Escrow
            </p>
            <p className="text-xs text-gray-400">
              This usually takes just a moment
            </p>
            <div className="flex gap-1 mt-6">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SUCCESS / OTP STATE ── */}
        {flow === "success" && (
          <div className="px-6 py-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-1">
              Rental Confirmed! 🎉
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Share the OTP below with the owner when you meet.
            </p>

            {/* OTP Display */}
            <div className="bg-gray-950 rounded-2xl px-8 py-6 mb-4 w-full relative">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
                Your Handover OTP
              </p>
              <div className="flex items-center justify-center gap-3">
                {otp.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="w-14 h-16 bg-white/10 rounded-xl flex items-center justify-center text-3xl font-black text-white border border-white/20"
                  >
                    {digit}
                  </div>
                ))}
              </div>
              <button
                onClick={copyOtp}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-6 max-w-sm">
              This OTP verifies the handover. The owner enters it on their app
              to confirm delivery. Your ₹{item.deposit.toLocaleString()} deposit
              is held safely in escrow until you return the item.
            </p>

            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-full mb-5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 text-left">
                <strong>₹{item.deposit.toLocaleString()}</strong> deposit locked
                in escrow — released automatically on safe return.
              </p>
            </div>

            <button
              onClick={close}
              className="w-full py-3 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
