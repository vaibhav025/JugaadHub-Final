"use client";

import { useState } from "react";
import { X, GraduationCap, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

export default function LoginModal() {
  const { setShowLoginModal, setUser, showToast } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const close = () => setShowLoginModal(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast({ message: "Please enter your student email.", type: "error" });
      return;
    }

    if (!email.toLowerCase().endsWith("@std.ggsipu.ac.in")) {
      showToast({
        message:
          "Access Denied: Only verified USICT student IDs are allowed.",
        type: "error",
      });
      return;
    }

    if (password.length < 6) {
      showToast({
        message: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      // Ek variable bana lete hain final user ko store karne ke liye
      let activeUser = null;

      // 1️⃣ Pehle Login try karte hain
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      activeUser = loginData?.user;

      // 2️⃣ Agar login fail hua
      if (loginError) {
        console.log("Login failed, trying auto-signup...");

        // 3️⃣ Naya account banane ki koshish karte hain
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          // 🚨 Agar signup pe "already registered" aaye = User exist karta hai, par password galat hai!
          if (
            signUpError.message.toLowerCase().includes("already registered") ||
            signUpError.message.toLowerCase().includes("already exists")
          ) {
            showToast({ message: "Incorrect password. Please try again.", type: "error" });
          } else {
            showToast({ message: signUpError.message, type: "error" });
          }
          return;
        }

        // 🟢 Naya account ban gaya
        activeUser = signUpData?.user;

        // Agar Email verification ON hai
        if (!signUpData?.session) {
          showToast({
            message: "Account created! Please verify your student email.",
            type: "success",
          });
          close();
          return;
        }
      }

      // ❌ Final safety check
      if (!activeUser || !activeUser.email) {
        showToast({ message: "Something went wrong with authentication", type: "error" });
        return;
      }

      const userEmail = activeUser.email;

      // 🔔 notify API
      await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const name =
        userEmail
          .split("@")[0]
          .split(".")
          .slice(0, 2)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ") || "Student";

      setUser({ email: userEmail, name });

      showToast({
        message: `Welcome to JugaadHub, ${name}! 🎉`,
        type: "success",
      });

      close();
    } catch (err) {
      console.error(err);
      showToast({
        message: "Something went wrong. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-6 pt-8 pb-10 relative">
          <button
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">
            Welcome back
          </h2>
          <p className="text-violet-200 text-sm">
            Sign in with your USICT student ID
          </p>
        </div>

        {/* Badge */}
        <div className="flex items-center justify-center -mt-4 z-10 relative">
          <div className="flex items-center gap-2 bg-white border border-violet-200 text-violet-700 text-xs font-bold px-4 py-2 rounded-full shadow-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            Only @std.ggsipu.ac.in emails allowed
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Student Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname.enrollno@std.ggsipu.ac.in"
              className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:text-violet-700 focus:border-violet-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:text-violet-700 focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In to JugaadHub"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            By signing in, you agree to our Terms of Use.
          </p>
        </form>
      </div>
    </div>
  );
}