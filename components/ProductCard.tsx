"use client";

import { Star, ShieldCheck } from "lucide-react";
import { useApp, type Item } from "@/context/AppContext";

const CATEGORY_STYLES: Record<string, string> = {
  Videography: "bg-violet-100 text-violet-700",
  "Lab Gear": "bg-emerald-100 text-emerald-700",
  Electronics: "bg-blue-100 text-blue-700",
  Books: "bg-amber-100 text-amber-700",
  Tools: "bg-orange-100 text-orange-700",
  Music: "bg-pink-100 text-pink-700",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
                ? "fill-amber-200 text-amber-400"
                : "fill-gray-100 text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function ProductCard({ item }: { item: Item }) {
  const { user, setShowLoginModal, setCheckoutItem } = useApp();

  const handleRent = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setCheckoutItem(item);
    }
  };

  const ownerAlias = item.owner.split("@")[0].split(".").slice(-1)[0] || item.owner.split("@")[0];

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col w-64 shrink-0 hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative w-full h-40 overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Category badge */}
        <span
          className={`absolute top-2 left-2 text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_STYLES[item.category] ?? "bg-gray-100 text-gray-700"}`}
        >
          {item.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
          {item.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={item.rating} />
          <span className="text-xs text-gray-500 font-medium">
            {item.rating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">({item.reviews})</span>
        </div>

        {/* Owner */}
        <p className="text-xs text-gray-400 truncate">
          by{" "}
          <span className="font-medium text-gray-500">{ownerAlias}</span>
        </p>

        {/* Pricing */}
        <div className="mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xl font-black text-violet-600">
              ₹{item.dailyRent.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 font-medium">/day</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            <span>
              Security Deposit:{" "}
              <span className="font-semibold text-gray-600">
                ₹{item.deposit.toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleRent}
          className="mt-2 w-full py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm shadow-violet-100"
        >
          Rent Now
        </button>
      </div>
    </div>
  );
}
