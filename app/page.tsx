"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Supabase import for fetching the item
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryNav from "@/components/CategoryNav";
import MarketplaceFeed from "@/components/MarketplaceFeed";
import type { Category } from "@/context/AppContext";

// 1. Modals Imports
import LoginModal from "@/components/LoginModal";
import CheckoutModal from "@/components/CheckoutModal";
import AddItemModal from "@/components/AddItemModal";

import { useApp } from "@/context/AppContext";

// Humne page logic ko ek alag component mein daal diya taaki Suspense use kar sakein
function HomeContent() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  
  // 2. Context se modal states fetch karo (Make sure setCheckoutItem is the correct function name!)
  const { showLoginModal, showAddItemModal, setCheckoutItem } = useApp();
  
  // URL parameters padhne ke liye
  const searchParams = useSearchParams();
  const rentItemId = searchParams.get('rent');

  useEffect(() => {
    const autoOpenCheckoutModal = async () => {
      // Agar URL mein ?rent=ID hai aur hamara modal open karne wala function available hai
      if (rentItemId && setCheckoutItem) {
        // Step 1: URL ko turant clean kar do taaki page refresh hone par dobara modal na khule
        window.history.replaceState(null, '', '/');

        // Step 2: Supabase se specific item fetch karo
        const { data: item, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', rentItemId)
          .single();

        // Step 3: Agar item mil gaya, toh usko Checkout state mein daal do (Modal automatically khul jayega)
        if (!error && item) {
          setCheckoutItem(item); 
        } else {
          console.error("Failed to auto-fetch item for checkout:", error);
        }
      }
    };

    autoOpenCheckoutModal();
  }, [rentItemId, setCheckoutItem]);

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

// Main page component jo Suspense boundary provide karta hai
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0EDE5] flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}