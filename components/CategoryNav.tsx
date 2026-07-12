"use client";

import { useState } from "react";
import { Camera, FlaskConical, Cpu, BookOpen, Wrench, Music2, Tags } from "lucide-react";
import type { Category } from "@/context/AppContext";

const CATEGORIES: { label: Category; icon: React.ReactNode; color: string }[] = [
  {
    label: "Videography",
    icon: <Camera className="w-6 h-6" strokeWidth={1.75} />,
    color: "bg-[#004643]/10 text-[#004643] border-[#004643]/20",
  },
  {
    label: "Lab Gear",
    icon: <FlaskConical className="w-6 h-6" strokeWidth={1.75} />,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    label: "Electronics",
    icon: <Cpu className="w-6 h-6" strokeWidth={1.75} />,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    label: "Books",
    icon: <BookOpen className="w-6 h-6" strokeWidth={1.75} />,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    label: "Tools",
    icon: <Wrench className="w-6 h-6" strokeWidth={1.75} />,
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    label: "Music",
    icon: <Music2 className="w-6 h-6" strokeWidth={1.75} />,
    color: "bg-pink-100 text-pink-700 border-pink-200",
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
    <section className="bg-[#F0EDE5] border-b border-[#004643]/10">
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
                ? "bg-[#004643] text-[#F0EDE5] border-[#004643] shadow-sm shadow-[#004643]/20"
                : "bg-[#F0EDE5] text-[#004643]/60 border-[#004643]/15 hover:bg-[#004643]/5"
            }`}
          >
            <Tags className="w-6 h-6" strokeWidth={1.75} />
            <span>All</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleClick(cat.label)}
              className={`shrink-0 flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                active === cat.label
                  ? `${cat.color} shadow-sm`
                  : "bg-[#F0EDE5] text-[#004643]/60 border-[#004643]/15 hover:bg-[#004643]/5"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}