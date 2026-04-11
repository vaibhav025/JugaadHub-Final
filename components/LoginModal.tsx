"use client";

import { useState } from "react";
import { X, GraduationCap, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

export default function LoginModal() {
  const { setShowLoginModal, setUser, showToast } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Email+Pass, Step 2: OTP
  const [loading, setLoading] = useState(false);

  const close = () => setShowLoginModal(false);

  // Helper function to set user context and close
  const handleLoginSuccess = async (user: any, generatedName: string) => {
    // Notify API
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
    } catch (notifyError) {
      console.log("Notify API failed", notifyError);
    }

    setUser({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || generatedName,
    });

    showToast({
      message: `Welcome to JugaadHub, ${user.user_metadata?.name || generatedName}! 🎉`,
      type: "success",
    });

    close();
  };

  // 🔥 GOOGLE LOGIN LOGIC ADDED HERE
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Login hone ke baad user ko wapas home page par bhej dega
          redirectTo: `${window.location.origin}/`, 
        },
      });

      if (error) throw error;
      // Note: We don't close modal here manually because OAuth redirects the whole page.
      
    } catch (err: any) {
      console.error("Google Auth Error:", err.message);
      showToast({ message: "Google Login Failed!", type: "error" });
      setLoading(false);
    }
  };

  // 1️⃣ STEP 1: Handle Email & Password Submit
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail.toLowerCase().endsWith("@std.ggsipu.ac.in")) {
      showToast({ message: "Only @std.ggsipu.ac.in emails allowed.", type: "error" });
      return;
    }

    if (password.length < 6) {
      showToast({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    try {
      setLoading(true);

      const generatedName = trimmedEmail
        .split("@")[0]
        .split(".")
        .slice(0, 2)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ") || "Student";

      // Case A: Try to Login normally (For existing users)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        // Case B: Agar Email verify nahi hui hai pichli baar
        if (signInError.message.includes("Email not confirmed")) {
          await supabase.auth.resend({ type: 'signup', email: trimmedEmail });
          showToast({ message: "Account not verified. New OTP sent!", type: "info" });
          setStep(2);
          return;
        }

        // Case C: Naya user hai ya galat password hai
        if (signInError.message.includes("Invalid login credentials")) {
          // Hum try karte hain naya account banane ka
          const { error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: { data: { name: generatedName } },
          });

          if (signUpError) {
            // Agar account pehle se hai, matlab user ne sach mein galat password daala hai
            if (signUpError.message.includes("already registered")) {
              showToast({ message: "Incorrect password. Please try again.", type: "error" });
            } else {
              showToast({ message: signUpError.message, type: "error" });
            }
            return;
          }

          // Naya account successfully ban gaya aur OTP chala gaya!
          showToast({ message: "8-digit OTP sent to your email!", type: "success" });
          setStep(2);
          return;
        }

        throw signInError;
      }

      // Success! Existing user logged in with password.
      if (signInData.user) {
        await handleLoginSuccess(signInData.user, generatedName);
      }

    } catch (err: any) {
      console.error(err);
      showToast({ message: "Something went wrong. Try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ STEP 2: Verify OTP (For New Users)
  const [otp, setOtp] = useState("");
  const verifyFinalOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (otp.length !== 8) {
      showToast({ message: "Please enter a valid 8-digit OTP.", type: "error" });
      return;
    }

    try {
      setLoading(true);

      // VERY IMPORTANT: type is "signup" because we are confirming a password signup
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: otp,
        type: "signup", 
      });

      if (error) throw error;

      if (data.user) {
        const generatedName = trimmedEmail.split("@")[0].split(".")[0];
        await handleLoginSuccess(data.user, generatedName);
      }

    } catch (err: any) {
      console.error(err);
      showToast({ message: "Invalid or expired OTP.", type: "error" });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: "slideUp 0.3s ease-out" }}>
        {/* Header */}
        <div className="bg-gradient-to-br from-[#004643] to-[#004643]/80 px-6 pt-8 pb-10 relative">
          <button onClick={close} className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 text-[#F0EDE5] hover:bg-white/30 transition">
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-[#F0EDE5]" />
          </div>

          <h2 className="text-2xl font-black text-[#F0EDE5] mb-1">
            {step === 1 ? "Welcome to JugaadHub" : "Verify your Email"}
          </h2>
          <p className="text-[#F0EDE5]/70 text-sm">
            {step === 1 
              ? "Sign in or create an account with your USICT ID" 
              : `We've sent an 8-digit code to ${email}`}
          </p>
        </div>

        {/* Badge */}
        {step === 1 && (
          <div className="flex items-center justify-center -mt-4 z-10 relative">
            <div className="flex items-center gap-2 bg-[#F0EDE5] border border-[#004643]/20 text-[#004643] text-xs font-bold px-4 py-2 rounded-full shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              Only @std.ggsipu.ac.in emails allowed
            </div>
          </div>
        )}

        {/* Dynamic Form */}
        <div className={`px-6 pb-8 space-y-4 ${step === 1 ? "pt-5" : "pt-8"}`}>
          
          {step === 1 ? (
            <>
              <form onSubmit={handleInitialSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#004643] mb-1.5">Student Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name.enroll@std.ggsipu.ac.in"
                    className="w-full px-4 py-3 rounded-xl border border-[#004643]/20 bg-[#004643]/5 text-[#004643] placeholder:text-[#004643]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#004643]/40 focus:border-[#004643]/40"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#004643] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create or enter password"
                      className="w-full px-4 py-3 rounded-xl border border-[#004643]/20 bg-[#004643]/5 text-[#004643] placeholder:text-[#004643]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#004643]/40 focus:border-[#004643]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#004643]/40 hover:text-[#004643] transition"
                    >
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 bg-[#004643] text-[#F0EDE5] font-bold rounded-2xl hover:bg-[#004643]/80 transition shadow-lg shadow-[#004643]/20 disabled:opacity-60"
                >
                  {loading ? "Processing..." : "Continue"}
                </button>
              </form>

              {/* 🔥 OR Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-[#004643]/10"></div>
                <span className="px-3 text-[10px] font-bold text-[#004643]/40 uppercase tracking-widest">OR</span>
                <div className="flex-1 border-t border-[#004643]/10"></div>
              </div>

              {/* 🔥 Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-[#004643] border-2 border-[#004643]/10 py-3.5 px-6 rounded-2xl font-black shadow-sm hover:bg-[#004643]/5 hover:border-[#004643]/20 transition-all active:scale-95 disabled:opacity-60"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>
            </>
          ) : (
            <form onSubmit={verifyFinalOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#004643] mb-1.5">8-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={8}
                  placeholder="• • • • • • • •"
                  className="w-full px-4 py-3 rounded-xl border border-[#004643]/20 bg-[#004643]/5 text-[#004643] placeholder:text-[#004643]/30 text-center text-xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-[#004643]/40 focus:border-[#004643]/40"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 8}
                className="w-full py-3.5 mt-2 bg-[#004643] text-[#F0EDE5] font-bold rounded-2xl hover:bg-[#004643]/80 transition shadow-lg shadow-[#004643]/20 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); }}
                className="w-full py-2 text-sm font-semibold text-[#004643]/60 hover:text-[#004643] transition"
              >
                Change Email
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}