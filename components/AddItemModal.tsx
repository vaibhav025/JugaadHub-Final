"use client";

import { useState } from "react";
import { X, PackagePlus, Info } from "lucide-react";
import { useApp, type Category } from "@/context/AppContext";

const CATEGORIES: Category[] = [
  "Videography",
  "Lab Gear",
  "Electronics",
  "Books",
  "Tools",
  "Music",
];

export default function AddItemModal() {
  const { setShowAddItemModal, addItem, showToast, user } = useApp();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Electronics");
  const [description, setDescription] = useState("");
  const [dailyRent, setDailyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [loading, setLoading] = useState(false);

  const close = () => setShowAddItemModal(false);

  const parsedRent = parseFloat(dailyRent) || 0;
  const maxDeposit = parsedRent * 20;

  const handleRentChange = (v: string) => {
    setDailyRent(v);
    const rent = parseFloat(v) || 0;
    const max = rent * 20;
    if (parseFloat(deposit) > max) {
      setDeposit(String(max));
    }
  };

  const handleDepositChange = (v: string) => {
    const parsed = parseFloat(v) || 0;
    if (parsedRent > 0 && parsed > maxDeposit) {
      setDeposit(String(maxDeposit));
    } else {
      setDeposit(v);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast({ message: "Item title is required.", type: "error" });
      return;
    }
    if (parsedRent <= 0) {
      showToast({ message: "Please enter a valid daily rent.", type: "error" });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      addItem({
        title: title.trim(),
        category,
        description: description.trim(),
        dailyRent: parsedRent,
        deposit: parseFloat(deposit) || 0,
        owner: user?.email ?? "anon@std.ggsipu.ac.in",
      });
      showToast({
        message: `"${title.trim()}" listed successfully! 🎉`,
        type: "success",
      });
      setLoading(false);
      close();
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ animation: "slideUp 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <PackagePlus className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">List an Item</h2>
              <p className="text-xs text-gray-400">
                Start earning from your gear today
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Item Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sony A7III with 50mm Lens"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition, accessories included, pickup instructions..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition resize-none"
            />
          </div>

          {/* Pricing row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Daily Rent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Daily Rent (₹) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  value={dailyRent}
                  onChange={(e) => handleRentChange(e.target.value)}
                  placeholder="200"
                  className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Security Deposit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Security Deposit (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  max={maxDeposit > 0 ? maxDeposit : undefined}
                  value={deposit}
                  onChange={(e) => handleDepositChange(e.target.value)}
                  placeholder="4000"
                  disabled={parsedRent <= 0}
                  className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Deposit helper */}
          {parsedRent > 0 && (
            <div className="flex items-start gap-2 p-3 bg-violet-50 border border-violet-100 rounded-xl">
              <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700 leading-relaxed">
                <strong>Deposit cap:</strong> Max deposit is{" "}
                <strong>₹{maxDeposit.toLocaleString()}</strong> — that&apos;s{" "}
                <strong>20×</strong> your daily rent of ₹{parsedRent}. This
                protects renters from unreasonable holds.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-violet-600 text-white font-bold text-base rounded-2xl hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-violet-200 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Listing...
              </span>
            ) : (
              "List Item on JugaadHub"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
