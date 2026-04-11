"use client";

import { useState } from "react";
import { X, ShieldCheck, CheckCircle2, Fingerprint, FileText, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

const VALID_OTP = "123456";
const MOCK_USER_DETAILS = {
  gender: "Male",
  address: "USICT, GGSIPU Campus, Dwarka, New Delhi",
  document: "Aadhaar Card",
};

export default function DigilockerModal({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) {
  const { user } = useApp(); 
  
  const [step, setStep] = useState<"aadhaar" | "otp" | "success">("aadhaar");
  const [aadhaarNum, setAadhaarNum] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 🔥 Naya state random DOB store karne ke liye
  const [dob, setDob] = useState("");

  // 🔥 Naya function jo 1 Jan 2007 se 15 Mar 2008 ke beech random date nikalega
  const generateRandomDOB = () => {
    // JS dates: Year, Month (0-indexed: 0=Jan, 2=Mar), Day
    const start = new Date(2007, 0, 1).getTime(); // 1st Jan 2007
    const end = new Date(2008, 2, 15).getTime();  // 15th March 2008
    
    const randomTime = start + Math.random() * (end - start);
    const date = new Date(randomTime);
    
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-11
    const yyyy = date.getFullYear();
    
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarNum.length !== 12) return setError("Please enter a valid 12-digit Aadhaar number");
    setError("");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setStep("otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== VALID_OTP) return setError(`Invalid OTP. Please enter ${VALID_OTP} for demo.`);
    setError("");
    setLoading(true);
    
    // API Delay simulate kar rahe hain
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // 🔥 Success hone par random DOB generate karke state mein set kar do
    setDob(generateRandomDOB());
    
    setLoading(false);
    setStep("success");
  };

  const handleCompleteSetup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);
        
      if (error) throw error;
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Verification Update Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative scrollbar-hide" style={{ animation: "slideUp 0.3s ease-out" }}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#004643]/10 bg-[#F0EDE5]/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-black text-[#004643]">KYC Verification</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "aadhaar" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#004643]/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Fingerprint className="w-8 h-8 text-[#004643]" />
                </div>
                <h3 className="text-xl font-bold text-[#004643]">Link DigiLocker</h3>
                <p className="text-sm text-[#004643]/60 mt-1">Verify your identity to start renting safely on JugaadHub.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#004643] mb-2">Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhaar"
                  value={aadhaarNum}
                  onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3.5 rounded-xl border border-[#004643]/20 bg-white text-[#004643] font-bold tracking-widest text-center focus:ring-2 focus:ring-[#004643]/40 outline-none transition"
                />
                {error && <p className="text-xs text-red-500 font-medium mt-2 text-center">{error}</p>}
              </div>

              <button disabled={loading || aadhaarNum.length !== 12} type="submit" className="w-full py-3.5 bg-[#004643] text-[#F0EDE5] font-bold rounded-2xl hover:bg-[#004643]/90 disabled:opacity-50 flex justify-center items-center transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[#004643]">Enter OTP</h3>
                <p className="text-sm text-[#004643]/60 mt-1">Sent to mobile linked with Aadhaar ending in <span className="font-bold">XXXX</span></p>
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  Demo OTP: {VALID_OTP}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-4 rounded-xl border border-[#004643]/20 bg-white text-[#004643] font-black text-2xl tracking-[0.5em] text-center focus:ring-2 focus:ring-[#004643]/40 outline-none transition"
                />
                {error && <p className="text-xs text-red-500 font-medium mt-2 text-center">{error}</p>}
              </div>

              <button disabled={loading || otp.length !== 6} type="submit" className="w-full py-3.5 bg-[#004643] text-[#F0EDE5] font-bold rounded-2xl hover:bg-[#004643]/90 disabled:opacity-50 flex justify-center items-center transition-all">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Fetching...</> : "Verify & Fetch"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#004643]">KYC Verified!</h3>
                <p className="text-sm text-[#004643]/60 mt-1">Your identity has been securely fetched.</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#004643]/10 text-left space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0"></div>
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2 relative z-10">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">DigiLocker Record</span>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 relative z-10">
                  <div>
                    <p className="text-[10px] text-[#004643]/50 font-bold uppercase">Full Name</p>
                    <p className="text-sm font-bold text-[#004643]">{user?.name || "Student"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#004643]/50 font-bold uppercase">DOB</p>
                    {/* 🔥 Yahan humara random generate kiya hua DOB render ho raha hai */}
                    <p className="text-sm font-bold text-[#004643]">{dob}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#004643]/50 font-bold uppercase">Address</p>
                    <p className="text-xs font-semibold text-[#004643]/80 leading-snug">{MOCK_USER_DETAILS.address}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCompleteSetup} 
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg shadow-emerald-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}