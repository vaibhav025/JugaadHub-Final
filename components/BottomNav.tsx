"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, LayoutDashboard } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/?search=1", label: "Search", icon: Search },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
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
                  ? "text-violet-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-violet-100" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
