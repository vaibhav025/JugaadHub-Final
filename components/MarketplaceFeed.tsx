"use client";

import { useState } from "react";
import { Flame, Zap, Sparkles, SearchX } from "lucide-react";
import { useApp, type Item, type Category } from "@/context/AppContext";
import ProductCard from "./ProductCard";

function FeedRow({
  title,
  icon,
  items,
  accentColor,
  onDeleteSuccess,
}: {
  title: string;
  icon: React.ReactNode;
  items: Item[];
  accentColor: string;
  onDeleteSuccess: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4 px-4">
        <span className={`p-1.5 rounded-lg ${accentColor}`}>{icon}</span>
        <h2 className="text-lg font-black text-[#004643]">{title}</h2>
        <span className="text-sm text-[#004643]/40 font-medium ml-1">
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
          <ProductCard 
            key={item.id} 
            item={item} 
            onDeleteSuccess={onDeleteSuccess}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  activeCategory: Category | null;
}

export default function MarketplaceFeed({ activeCategory }: Props) {
  const { items, searchQuery } = useApp();
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  const handleItemDeleted = (id: string) => {
    setDeletedItemIds((prev) => [...prev, id]);
  };

  // 🔥 FILTER LOGIC: Rented items ko hide nahi karna, ProductCard khud unhe "Rented" dikhayega
  const filtered = items.filter((i) => {
    if (deletedItemIds.includes(i.id)) return false;

    const matchesCategory = activeCategory ? i.category === activeCategory : true;
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const trending = [...filtered].sort((a, b) => b.reviews - a.reviews);
  const quickPickups = filtered.filter((i) => i.dailyRent < 100);
  const newListings = [...filtered].reverse();

  return (
    <section id="marketplace" className="max-w-7xl mx-auto py-8">
      {filtered.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#004643]/5 rounded-full mb-4">
            <SearchX className="w-8 h-8 text-[#004643]/20" />
          </div>
          <h2 className="text-xl font-black text-[#004643]">Bhai, kuch nahi mila!</h2>
          <p className="text-[#004643]/40 text-sm mt-1 max-w-xs mx-auto">
            Aapki search query ke hisaab se koi gear available nahi hai.
          </p>
        </div>
      ) : (
        <>
          <FeedRow
            title="Trending at USICT"
            icon={<Flame className="w-4 h-4 text-orange-500" />}
            items={trending}
            accentColor="bg-orange-100"
            onDeleteSuccess={handleItemDeleted}
          />

          {quickPickups.length > 0 && (
            <FeedRow
              title="Quick Pickups · Under ₹100/day"
              icon={<Zap className="w-4 h-4 text-amber-500" />}
              items={quickPickups}
              accentColor="bg-amber-100"
              onDeleteSuccess={handleItemDeleted}
            />
          )}

          <FeedRow
            title="New Listings"
            icon={<Sparkles className="w-4 h-4 text-[#004643]" />}
            items={newListings}
            accentColor="bg-[#004643]/10"
            onDeleteSuccess={handleItemDeleted}
          />
        </>
      )}
    </section>
  );
}