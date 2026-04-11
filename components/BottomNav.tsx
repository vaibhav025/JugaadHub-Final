"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, LayoutDashboard } from "lucide-react";
import { useApp } from "@/context/AppContext";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/?search=1", label: "Search", icon: Search },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useApp(); // Context se unread count liya

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#F0EDE5]/95 backdrop-blur-md border-t border-[#004643]/10 shadow-lg">
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href.split("?")[0]);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-semibold transition-all ${
                isActive
                  ? "text-[#004643]"
                  : "text-[#004643]/30 hover:text-[#004643]/60"
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? "bg-[#004643]/10" : ""}`}>
                <Icon className="w-5 h-5" />
                
                {/* 🔴 CHAT TAB RED PING ANIMATION */}
                {tab.label === "Chat" && unreadCount > 0 && (
                  <span className="absolute 0 top-0 right-0 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#004643]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}