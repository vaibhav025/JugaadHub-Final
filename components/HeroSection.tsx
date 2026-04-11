"use client";

import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { useApp, type Item } from "@/context/AppContext";

// Visual styles for the 3 floating cards (Colors, rotations, and z-indexes)
const CARD_VISUALS = [
  { rotate: "-rotate-6", z: "z-10", color: "from-[#004643]/10 to-[#004643]/20" },
  { rotate: "rotate-2", z: "z-20", color: "from-blue-100 to-cyan-100" },
  { rotate: "rotate-6", z: "z-10", color: "from-emerald-100 to-teal-100" },
];

// Fallback emojis just in case an image is missing
const CATEGORY_EMOJIS: Record<string, string> = {
  "Videography": "📷",
  "Lab Gear": "🧪",
  "Electronics": "💻",
  "Books": "📚",
  "Tools": "🔧",
  "Music": "🎸",
};

// Fallback data with actual high-quality placeholder images
const FALLBACK_ITEMS = [
  { 
    id: "mock-1", 
    title: "Sony A7III", 
    dailyRent: 800, 
    category: "Videography", 
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=500&auto=format&fit=crop",
    isMock: true 
  },
  { 
    id: "mock-2", 
    title: "MacBook Pro M1", 
    dailyRent: 500, 
    category: "Electronics", 
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=500&auto=format&fit=crop",
    isMock: true 
  },
  { 
    id: "mock-3", 
    title: "DJI Ronin Gimbal", 
    dailyRent: 400, 
    category: "Videography", 
    image: "https://images.unsplash.com/photo-1620882613528-7667ffeb8a92?q=80&w=500&auto=format&fit=crop",
    isMock: true 
  },
];

// Speed Optimization Function (Same as ProductCard for fast loading)
const getOptimizedUrl = (url: string) => {
  if (!url || !url.includes("cloudinary")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_500/");
};

export default function HeroSection() {
  const { user, items, setShowLoginModal, setShowAddItemModal, setCheckoutItem } = useApp();

  // Real data array banaya (Top 3 items) + Fill gaps with fallbacks
  const displayItems = items.length >= 3 
    ? items.slice(0, 3) 
    : [...items, ...FALLBACK_ITEMS.slice(items.length, 3)];

  const handleStartRenting = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      const el = document.getElementById("marketplace");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleListGear = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setShowAddItemModal(true);
    }
  };

  const handleCardClick = (item: any) => {
    if (item.isMock) {
      handleStartRenting();
      return;
    }
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (user.id === item.owner_id) {
      handleStartRenting();
      return;
    }
    setCheckoutItem(item as Item);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F0EDE5] via-[#F0EDE5] to-[#004643]/10 pt-14 pb-20">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#004643]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#004643]/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        {/* Left: Text */}
        <div className="flex-1 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#004643]/10 text-[#004643] rounded-full text-xs font-semibold mb-6 border border-[#004643]/20">
            <span className="w-1.5 h-1.5 bg-[#004643] rounded-full animate-pulse" />
            Campus P2P Rental Marketplace · USICT
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#004643] leading-[1.08] tracking-tight mb-5">
            Own the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004643] to-[#004643]/60">
              Experience.
            </span>
            <br />
            Rent the Gear.
          </h1>

          <p className="text-[#004643]/60 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
            Borrow cameras, lab equipment, textbooks and tech from verified
            USICT students — secured by escrow, zero middlemen.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-10">
            <button
              onClick={handleStartRenting}
              className="flex items-center gap-2 px-7 py-3.5 bg-[#004643] text-[#F0EDE5] font-bold text-base rounded-2xl hover:bg-[#004643]/80 active:scale-95 transition-all shadow-lg shadow-[#004643]/20 w-full sm:w-auto justify-center"
            >
              Start Renting
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleListGear}
              className="flex items-center gap-2 px-7 py-3.5 bg-[#F0EDE5] text-[#004643] font-bold text-base rounded-2xl hover:bg-[#004643]/5 active:scale-95 transition-all border border-[#004643]/20 shadow-sm w-full sm:w-auto justify-center"
            >
              List Your Gear →
            </button>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-[#004643]/60">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#004643]" />
              <span>
                <strong className="text-[#004643]">500+</strong> Students
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#004643]" />
              <span>
                <strong className="text-[#004643]">{items.length > 0 ? items.length : "400+"}</strong> Items Listed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#004643]" />
              <span>
                <strong className="text-[#004643]">Escrow</strong> Protected
              </span>
            </div>
          </div>
        </div>

        {/* Right: Floating dynamic cards */}
        <div className="flex-1 flex items-center justify-center relative min-h-[320px] w-full max-w-[420px]">
          <div className="relative w-72 h-72">
            {displayItems.map((item, i) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                // 🔥 YAHAN MAGIC HAI: Added hover:z-50, hover:rotate-0, hover:scale-110, aur smooth transitions
                className={`absolute ${CARD_VISUALS[i].z} hover:z-50 ${CARD_VISUALS[i].rotate} hover:rotate-0 bg-[#F0EDE5] rounded-2xl shadow-xl border border-[#004643]/10 p-4 w-52 cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,70,67,0.3)]`}
                style={{
                  top: `${i * 30}%`,
                  left: `${i * 10}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                {/* 📸 IMAGE RENDERING AREA */}
                <div className="w-full h-28 rounded-xl overflow-hidden mb-3 bg-[#004643]/5 relative shadow-inner">
                  {item.image ? (
                    <img
                      src={getOptimizedUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${CARD_VISUALS[i].color} flex items-center justify-center`}>
                      <span className="text-3xl">{CATEGORY_EMOJIS[item.category] || "📦"}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs font-semibold text-[#004643]/40 mb-0.5 uppercase tracking-wider">
                  {item.category}
                </div>
                <div className="text-sm font-bold text-[#004643] line-clamp-1">
                  {item.title}
                </div>
                <div className="text-base font-black text-[#004643] mt-1">
                  ₹{item.dailyRent}<span className="text-xs font-medium text-[#004643]/50">/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}