"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowLeft,
  Package,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  completed: "bg-[#004643]/10 text-[#004643]/50 border-[#004643]/20",
  pending: "bg-amber-500/20 text-amber-700 border-amber-500/30",
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#004643] border border-[#004643]/50 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-[#F0EDE5]/60 text-xs mb-1">{label}</p>
        <p className="text-[#F0EDE5] font-bold text-sm">
          Revenue: ₹{payload[0]?.value?.toLocaleString()}
        </p>
        <p className="text-emerald-300 text-xs">
          Rentals: {payload[1]?.value} units
        </p>
      </div>
    );
  }
  return null;
}

export default function AdminPage() {
  const { items, user } = useApp();
  const [dbRentals, setDbRentals] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  // 1. SECURITY LOGIC: Check Role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      // Fetch user role from profiles
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data && data.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.push("/");
      }
    };

    checkAdminRole();
  }, [user, router]);

  // 2. Fetch Rentals (Only if Admin)
  useEffect(() => {
    const fetchRentals = async () => {
      if (!isAdmin) return;

      const { data, error } = await supabase
        .from("rentals")
        .select("*")
        .order('created_at', { ascending: true });
      
      if (data) setDbRentals(data);
      if (error) console.error("Error fetching rentals:", error.message);
    };
    fetchRentals();
  }, [isAdmin]);

  // Calculations
  const uniqueUsers = new Set(items.map(i => i.owner_id || i.owner)).size;
  const totalEscrowPotential = items.reduce((acc, i) => acc + (i.deposit || 0), 0);
  const platformRevenueReal = dbRentals.reduce((sum, r) => sum + (r.platform_fee || 9), 0);

  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        fullDate: d.toISOString().split('T')[0],
        revenue: 0,
        rentals: 0
      };
    });

    dbRentals.forEach(rental => {
      const rDate = new Date(rental.created_at).toISOString().split('T')[0];
      const dayMatch = last30Days.find(d => d.fullDate === rDate);
      
      if (dayMatch) {
        dayMatch.revenue += (rental.platform_fee || 9); 
        dayMatch.rentals += 1; 
      }
    });

    return last30Days;
  }, [dbRentals]);

  const DYNAMIC_METRICS = [
    { label: "Active Campus Listers", value: uniqueUsers.toString(), sub: `${items.length} items listed`, icon: Users, accent: "text-[#004643]", bg: "bg-[#004643]/10", border: "border-[#004643]/20", trend: "Real-time", trendUp: true },
    { label: "Total Escrow Potential", value: `₹${totalEscrowPotential.toLocaleString()}`, sub: "Value of all secured gear", icon: ShieldCheck, accent: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", trend: "Live", trendUp: true },
    { label: "Platform Revenue", value: `₹${platformRevenueReal.toLocaleString()}`, sub: "Total platform fees collected", icon: TrendingUp, accent: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", trend: "Verified", trendUp: true },
  ];

  // 🔒 LOADING STATE: Jab tak verify na ho
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EDE5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#004643] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isAdmin === false) return null;

  return (
    <div className="min-h-screen bg-[#F0EDE5] text-[#004643] pb-16 md:pb-0">
      <header className="border-b border-[#004643]/10 px-4 sm:px-8 py-4 bg-[#F0EDE5] sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-[#004643]/50 hover:text-[#004643] transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to App
          </Link>
          <div className="h-5 w-px bg-[#004643]/20" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#004643] rounded-lg flex items-center justify-center">
              <span className="text-[#F0EDE5] font-black text-xs">J</span>
            </div>
            <span className="font-black text-[#004643]">JugaadHub</span>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · USICT Campus
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#004643] mb-1">Platform Analytics</h1>
          <p className="text-[#004643]/50 text-sm">Real-time transaction monitoring</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {DYNAMIC_METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className={`rounded-2xl border ${m.border} ${m.bg} p-5 backdrop-blur`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${m.bg} border ${m.border}`}>
                    <Icon className={`w-5 h-5 ${m.accent}`} />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-bold ${m.trendUp ? "text-emerald-600" : "text-red-500"}`}>
                    {m.trend}
                  </span>
                </div>
                <p className="text-3xl font-black text-[#004643] mb-1">{m.value}</p>
                <p className="text-sm font-semibold text-[#004643]/70">{m.label}</p>
                <p className="text-xs text-[#004643]/40 mt-0.5">{m.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white/60 border border-[#004643]/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-black text-[#004643]">30-Day Activity Trend</h2>
              <p className="text-[#004643]/50 text-sm mt-0.5">Verified rentals from the marketplace</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#004643]/50">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#004643] rounded" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 rounded" /> Rentals</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004643" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#004643" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#004643" strokeOpacity={0.06} />
              <XAxis 
                dataKey="date" 
                stroke="#004643" 
                strokeOpacity={0.2} 
                tick={{ fill: "#004643", fontSize: 10, opacity: 0.4 }} 
                tickLine={false} 
                interval={5} 
              />
              <YAxis stroke="#004643" strokeOpacity={0.2} tick={{ fill: "#004643", fontSize: 10, opacity: 0.4 }} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#004643" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="rentals" stroke="#10B981" strokeWidth={1.5} fill="url(#rentGrad)" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/60 border border-[#004643]/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#004643]/10 bg-[#004643]/5">
            <Package className="w-5 h-5 text-[#004643]" />
            <h2 className="font-black text-[#004643]">Recently Listed Gear</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#004643]/10 bg-[#004643]/[0.02]">
                  <th className="text-left px-6 py-4 text-[#004643]/40 font-bold text-xs uppercase tracking-wider">Item Name</th>
                  <th className="text-left px-6 py-4 text-[#004643]/40 font-bold text-xs uppercase tracking-wider">Owner</th>
                  <th className="text-left px-6 py-4 text-[#004643]/40 font-bold text-xs uppercase tracking-wider">Rent / Day</th>
                  <th className="text-left px-6 py-4 text-[#004643]/40 font-bold text-xs uppercase tracking-wider">Escrow</th>
                  <th className="text-left px-6 py-4 text-[#004643]/40 font-bold text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-[#004643]/40 font-medium">No items listed yet.</td></tr>
                ) : (
                  items.slice(0, 10).map((item, i) => (
                    <tr key={item.id || i} className="border-b border-[#004643]/5 hover:bg-[#004643]/5 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#004643] text-sm line-clamp-1">{item.title}</p>
                        <p className="text-[#004643]/40 text-xs mt-0.5">{item.category}</p>
                      </td>
                      <td className="px-6 py-4 text-[#004643]/60 font-mono text-xs">{item.owner.split("@")[0]}</td>
                      <td className="px-6 py-4 font-bold text-[#004643]">₹{item.dailyRent}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">₹{item.deposit.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES.active}`}>Listed</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}