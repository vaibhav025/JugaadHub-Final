"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryNav from "@/components/CategoryNav";
import MarketplaceFeed from "@/components/MarketplaceFeed";
import type { Category } from "@/context/AppContext";

// 1. Modals Imports
import LoginModal from "@/components/LoginModal";
import CheckoutModal from "@/components/CheckoutModal";
import AddItemModal from "@/components/AddItemModal"; // 🔥 UNCOMMENTED: Taaki Navbar ka button kaam kare

import { useApp } from "@/context/AppContext";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  
  // 2. Context se modal states fetch karo
  const { showLoginModal, showAddItemModal } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-[#F0EDE5]">
      <Navbar />
      
      <main className="flex-1 pb-20 md:pb-0">
        <HeroSection />
        <CategoryNav onCategorySelect={setActiveCategory} />
        <MarketplaceFeed activeCategory={activeCategory} />
      </main>

      {/* ── MODALS SECTION ── */}
      
      {/* Login Modal: Sirf tab dikhega jab showLoginModal true hoga */}
      {showLoginModal && <LoginModal />}
      
      {/* Add Item Modal: Ab Navbar se 'List Item' pe click karne par ye pop-up aayega */}
      {showAddItemModal && <AddItemModal />}

      {/* Checkout Modal: Ye internal state (checkoutItem) ke basis par khud manage hota hai */}
      <CheckoutModal />
      
    </div>
  );
}