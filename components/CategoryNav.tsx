"use client";

import { useState } from "react";
import { Camera, FlaskConical, Cpu, BookOpen, Wrench, Music2 } from "lucide-react";
import type { Category } from "@/context/AppContext";

const CATEGORIES: { label: Category; icon: React.ReactNode; emoji: string; color: string }[] = [
  {
    label: "Videography",
    icon: <Camera className="w-6 h-6" />,
    emoji: "📷",
    color: "bg-violet-100 text-violet-600 border-violet-200",
  },
  {
    label: "Lab Gear",
    icon: <FlaskConical className="w-6 h-6" />,
    emoji: "🧪",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
  },
  {
    label: "Electronics",
    icon: <Cpu className="w-6 h-6" />,
    emoji: "💻",
    color: "bg-blue-100 text-blue-600 border-blue-200",
  },
  {
    label: "Books",
    icon: <BookOpen className="w-6 h-6" />,
    emoji: "📚",
    color: "bg-amber-100 text-amber-600 border-amber-200",
  },
  {
    label: "Tools",
    icon: <Wrench className="w-6 h-6" />,
    emoji: "🔧",
    color: "bg-orange-100 text-orange-600 border-orange-200",
  },
  {
    label: "Music",
    icon: <Music2 className="w-6 h-6" />,
    emoji: "🎸",
    color: "bg-pink-100 text-pink-600 border-pink-200",
  },
];

interface Props {
  onCategorySelect?: (cat: Category | null) => void;
}

export default function CategoryNav({ onCategorySelect }: Props) {
  const [active, setActive] = useState<Category | null>(null);

  const handleClick = (cat: Category) => {
    const next = active === cat ? null : cat;
    setActive(next);
    onCategorySelect?.(next);
  };

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {/* All tab */}
          <button
            onClick={() => {
              setActive(null);
              onCategorySelect?.(null);
            }}
            className={`shrink-0 flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
              active === null
                ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">🏷️</span>
            <span>All</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleClick(cat.label)}
              className={`shrink-0 flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                active === cat.label
                  ? `${cat.color} shadow-sm`
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
