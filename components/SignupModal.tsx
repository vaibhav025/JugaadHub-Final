"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

export default function SignupModal() {

  const { setUser, showToast, setShowLoginModal } = useApp();

  const [email, setEmail] = useState("");     // ✅ ADD THIS
  const [password, setPassword] = useState(""); // ✅ ADD THIS
  const [loading, setLoading] = useState(false);

  const close = () => setShowLoginModal(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast({ message: "Please enter your email", type: "error" });
      return;
    }

    if (!email.toLowerCase().endsWith("@std.ggsipu.ac.in")) {
      showToast({
        message: "Only @std.ggsipu.ac.in emails allowed",
        type: "error",
      });
      return;
    }

    if (password.length < 6) {
      showToast({
        message: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        showToast({ message: error.message, type: "error" });
        return;
      }

      if (!data.session) {
        showToast({
          message: "Signup successful! Please verify your email.",
          type: "success",
        });
        return;
      }
      if (!data?.user) {
        showToast({ message: "User not found after signup", type: "error" });
        return;
      };
      
      const userEmail = data.user.email!;

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
        message: `Account created! Welcome ${name} 🎉`,
        type: "success",
      });

      close();
    } catch (err) {
      console.error(err);
      showToast({
        message: "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 👉 basic inputs (add UI later) */}
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}