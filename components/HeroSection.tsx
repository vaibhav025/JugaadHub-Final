"use client";

import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";

const FLOATING_CARDS = [
  {
    title: "Sony A7III",
    price: "₹800/day",
    badge: "📷 Camera",
    color: "from-violet-100 to-indigo-100",
    rotate: "-rotate-6",
    z: "z-10",
  },
  {
    title: "MacBook Pro M1",
    price: "₹500/day",
    badge: "💻 Electronics",
    color: "from-blue-100 to-cyan-100",
    rotate: "rotate-2",
    z: "z-20",
  },
  {
    title: "DJI Ronin Gimbal",
    price: "₹400/day",
    badge: "🎬 Videography",
    color: "from-emerald-100 to-teal-100",
    rotate: "rotate-6",
    z: "z-10",
  },
];

export default function HeroSection() {
  const { user, setShowLoginModal } = useApp();

  const handleCTA = () => {
    if (!user) setShowLoginModal(true);
    else {
      const el = document.getElementById("marketplace");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 pt-14 pb-20">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        {/* Left: Text */}
        <div className="flex-1 text-center lg:text-left max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold mb-6 border border-violet-200">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            Campus P2P Rental Marketplace · USICT
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-gray-900 leading-[1.08] tracking-tight mb-5">
            Own the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">
              Experience.
            </span>
            <br />
            Rent the Gear.
          </h1>

          <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
            Borrow cameras, lab equipment, textbooks and tech from verified
            USICT students — secured by escrow, zero middlemen.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-10">
            <button
              onClick={handleCTA}
              className="flex items-center gap-2 px-7 py-3.5 bg-violet-600 text-white font-bold text-base rounded-2xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-200 w-full sm:w-auto justify-center"
            >
              Start Renting
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!user) setShowLoginModal(true);
              }}
              className="flex items-center gap-2 px-7 py-3.5 bg-white text-gray-800 font-bold text-base rounded-2xl hover:bg-gray-50 active:scale-95 transition-all border border-gray-200 shadow-sm w-full sm:w-auto justify-center"
            >
              List Your Gear →
            </button>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-violet-500" />
              <span>
                <strong className="text-gray-900">500+</strong> Students
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-violet-500" />
              <span>
                <strong className="text-gray-900">400+</strong> Items Listed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-violet-500" />
              <span>
                <strong className="text-gray-900">Escrow</strong> Protected
              </span>
            </div>
          </div>
        </div>

        {/* Right: Floating cards */}
        <div className="flex-1 flex items-center justify-center relative min-h-[320px] w-full max-w-[420px]">
          <div className="relative w-72 h-72">
            {FLOATING_CARDS.map((card, i) => (
              <div
                key={card.title}
                className={`absolute ${card.z} ${card.rotate} bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52 transition-transform hover:scale-105`}
                style={{
                  top: `${i * 30}%`,
                  left: `${i * 10}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                <div
                  className={`w-full h-24 rounded-xl bg-gradient-to-br ${card.color} mb-3 flex items-center justify-center`}
                >
                  <span className="text-3xl">{card.badge.split(" ")[0]}</span>
                </div>
                <div className="text-xs font-semibold text-gray-400 mb-0.5">
                  {card.badge.split(" ").slice(1).join(" ")}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {card.title}
                </div>
                <div className="text-base font-black text-violet-600 mt-1">
                  {card.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
