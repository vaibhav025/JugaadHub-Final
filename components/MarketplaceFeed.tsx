"use client";

import { Flame, Zap, Sparkles } from "lucide-react";
import { useApp, type Item, type Category } from "@/context/AppContext";
import ProductCard from "./ProductCard";

function FeedRow({
  title,
  icon,
  items,
  accentColor,
}: {
  title: string;
  icon: React.ReactNode;
  items: Item[];
  accentColor: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4 px-4">
        <span className={`p-1.5 rounded-lg ${accentColor}`}>{icon}</span>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
        <span className="text-sm text-gray-400 font-medium ml-1">
          · {items.length} items
        </span>
      </div>
      <div
        className="flex gap-4 overflow-x-auto px-4 pb-3"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  activeCategory: Category | null;
}

export default function MarketplaceFeed({ activeCategory }: Props) {
  const { items } = useApp();

  const filtered = activeCategory
    ? items.filter((i) => i.category === activeCategory)
    : items;

  const trending = [...filtered].sort((a, b) => b.reviews - a.reviews);
  const quickPickups = filtered.filter((i) => i.dailyRent < 100);
  const newListings = [...filtered].reverse();

  return (
    <section id="marketplace" className="max-w-7xl mx-auto py-8">
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-base font-medium">No items in this category yet.</p>
          <p className="text-sm mt-1">Be the first to list one!</p>
        </div>
      ) : (
        <>
          <FeedRow
            title="Trending at USICT"
            icon={<Flame className="w-4 h-4 text-orange-500" />}
            items={trending}
            accentColor="bg-orange-100"
          />

          {quickPickups.length > 0 && (
            <FeedRow
              title="Quick Pickups · Under ₹100/day"
              icon={<Zap className="w-4 h-4 text-amber-500" />}
              items={quickPickups}
              accentColor="bg-amber-100"
            />
          )}

          <FeedRow
            title="New Listings"
            icon={<Sparkles className="w-4 h-4 text-violet-500" />}
            items={newListings}
            accentColor="bg-violet-100"
          />
        </>
      )}
    </section>
  );
}
