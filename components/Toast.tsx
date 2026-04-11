"use client";

import { XCircle, CheckCircle2, Info, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

const STYLES = {
  error: {
    wrapper: "bg-red-600 text-white border-red-700",
    icon: <XCircle className="w-5 h-5 text-white shrink-0" />,
  },
  success: {
    wrapper: "bg-emerald-600 text-white border-emerald-700",
    icon: <CheckCircle2 className="w-5 h-5 text-white shrink-0" />,
  },
  info: {
    wrapper: "bg-violet-600 text-white border-violet-700",
    icon: <Info className="w-5 h-5 text-white shrink-0" />,
  },
};

export default function Toast() {
  const { toast, showToast } = useApp();

  if (!toast) return null;

  const style = STYLES[toast.type];

  return (
    <div
      className="fixed top-4 right-4 z-[60] max-w-sm w-full"
      style={{ animation: "slideInRight 0.3s ease-out" }}
    >
      <div
        className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg ${style.wrapper}`}
      >
        {style.icon}
        <p className="text-sm font-semibold leading-snug flex-1">
          {toast.message}
        </p>
        <button
          onClick={() => showToast({ message: "", type: "info" })}
          className="opacity-70 hover:opacity-100 transition mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
