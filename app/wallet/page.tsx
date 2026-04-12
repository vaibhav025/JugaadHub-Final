"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, History, CheckCircle2, PlusCircle, ShieldCheck, ArrowDownToLine, X, Loader2, Building2, ArrowUpRight, Camera, ExternalLink } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import AddMoneyModal from "@/components/AddMoneyModal";
import LiveCameraProof from "@/components/LiveCameraProof"; 

export default function WalletPage() {
  const { user, showToast } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // 🔥 CAMERA MODAL STATES
  const [showCamera, setShowCamera] = useState(false);
  const [proofType, setProofType] = useState<"before" | "after">("before");
  const [selectedRentalId, setSelectedRentalId] = useState<string>("");

  const fetchData = async () => {
    if (!user) return;
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();
    if (profileData) setWalletBalance(profileData.wallet_balance || 0);

    const { data: rentalsData, error } = await supabase
      .from("rentals")
      .select(`*, items(title)`)
      .or(`owner_id.eq.${user.id},renter_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Transaction fetch error:", error.message);
    } else if (rentalsData) {
      const ownerIds = [...new Set(rentalsData.map(r => r.owner_id).filter(Boolean))];
      
      const { data: ownersData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ownerIds);

      if (profileErr) {
        console.error("Profile Fetch Error:", profileErr.message);
      }

      const ownerNamesMap: Record<string, string> = {};
      if (ownersData) {
        ownersData.forEach(owner => {
          ownerNamesMap[owner.id] = owner.name || owner.full_name || owner.username || owner.email?.split('@')[0] || "Owner";
        });
      }

      const finalTransactions = rentalsData.map(txn => ({
        ...txn,
        actual_owner_name: ownerNamesMap[txn.owner_id] || "Owner"
      }));

      setTransactions(finalTransactions);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      showToast({ message: "Please enter a valid amount", type: "error" });
      return;
    }
    if (withdrawAmount > walletBalance) {
      showToast({ message: "Insufficient wallet balance", type: "error" });
      return;
    }
    setWithdrawLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newBalance = walletBalance - Number(withdrawAmount);
      const { error } = await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("id", user?.id);
      if (error) throw error;
      setWalletBalance(newBalance);
      showToast({ message: `Successfully withdrew ₹${withdrawAmount} to your bank account!`, type: "success" });
      setShowWithdraw(false);
      setWithdrawAmount("");
    } catch (err) {
      showToast({ message: "Failed to process withdrawal.", type: "error" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-[#004643] font-bold">Please login to view wallet.</div>;

  const totalEarned = transactions.filter(e => e.owner_id === user.id && e.status === 'completed').reduce((sum, e) => sum + (Number(e.total_rent) || 0), 0);
  const pendingInEscrow = transactions.filter(e => e.renter_id === user.id && (e.status === 'active' || e.status === 'pending')).reduce((sum, e) => sum + (Number(e.deposit) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F0EDE5] pb-16">
      <header className="bg-white/60 border-b border-[#004643]/10 px-4 py-4 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/50 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-black text-[#004643]">My Wallet</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* WALLET CARD */}
        <div className="bg-[#004643] text-[#F0EDE5] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-2">
                <Wallet className="w-4 h-4" /> Main Wallet Balance
              </div>
              <h2 className="text-5xl font-black mb-1">₹{walletBalance.toLocaleString()}</h2>
              <p className="text-xs text-white/50 font-medium">Available for withdrawals or renting items</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowWithdraw(true)} className="flex flex-1 sm:flex-none items-center justify-center gap-2 py-3 px-5 bg-white/10 text-white border border-white/20 font-bold rounded-2xl hover:bg-white/20 transition-all">
                <ArrowDownToLine className="w-4 h-4" /> Withdraw
              </button>
              <button onClick={() => setShowAddMoney(true)} className="flex flex-1 sm:flex-none items-center justify-center gap-2 py-3 px-5 bg-white text-[#004643] font-black rounded-2xl hover:bg-emerald-50 transition-all shadow-lg">
                <PlusCircle className="w-4 h-4" /> Add Funds
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#004643]/10 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
              <TrendingUp className="w-4 h-4" /> Lifetime Earnings
            </div>
            <h2 className="text-3xl font-black text-[#004643]">₹{totalEarned.toLocaleString()}</h2>
            <p className="text-xs text-[#004643]/40 font-medium">Earned from completed rentals</p>
          </div>
          <div className="bg-amber-50 border border-amber-200/50 rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10" />
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-2 relative z-10">
              <ShieldCheck className="w-4 h-4" /> Locked in Escrow
            </div>
            <h2 className="text-3xl font-black text-amber-700 relative z-10">₹{pendingInEscrow.toLocaleString()}</h2>
            <p className="text-xs text-amber-700/60 font-medium relative z-10">Security deposits for active rentals</p>
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1 mt-8">
            <History className="w-5 h-5 text-[#004643]" />
            <h3 className="text-lg font-bold text-[#004643]">Transaction History</h3>
          </div>

          <div className="bg-white rounded-2xl border border-[#004643]/10 overflow-hidden shadow-sm">
            {loading ? (
              <p className="p-8 text-center text-[#004643]/50 font-medium">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="p-8 text-center text-[#004643]/50 font-medium">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-[#004643]/5">
                {transactions.map((txn, idx) => {
                  const isOwner = txn.owner_id === user.id;
                  
                  // 🔥 THE FIX IS HERE: Dynamic Amount Logic
                  let amountToShow = 0;
                  if (isOwner) {
                    amountToShow = txn.total_rent; // Owner ko sirf rent milta hai
                  } else {
                    // Agar settled ho gaya hai toh Total se Deposit minus kardo
                    amountToShow = txn.status === 'completed' 
                      ? (txn.total_amount - (txn.deposit || 0)) 
                      : txn.total_amount;
                  }
                  
                  const itemName = txn.product_name || txn.items?.title || "Item #" + txn.product_id?.substring(0,4);
                  const otherPartyName = isOwner ? (txn.renter_name || "User") : txn.actual_owner_name;
                  
                  return (
                    <div key={idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#004643]/[0.02] transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOwner ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                          {isOwner ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-rose-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#004643] text-sm truncate">
                            {isOwner ? `Rented to ${otherPartyName}` : `Borrowed from ${otherPartyName}`}
                          </p>
                          <p className="text-xs text-[#004643]/50 font-medium mt-0.5 truncate">
                            {itemName}
                          </p>
                          
                          {/* 🔥 PROOF VIEW SECTION */}
                          {(txn.before_image || txn.after_image) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {txn.before_image && (
                                <a href={txn.before_image} target="_blank" className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-200 transition">
                                  <ShieldCheck className="w-3 h-3" /> PRE-PROOF <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              {txn.after_image && (
                                <a href={txn.after_image} target="_blank" className="flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-200 transition">
                                  <CheckCircle2 className="w-3 h-3" /> POST-PROOF <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end shrink-0 ml-4">
                        <p className={`font-black text-lg ${isOwner ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isOwner ? `+₹${Number(amountToShow).toLocaleString()}` : `-₹${Number(amountToShow).toLocaleString()}`}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {txn.status === 'completed' ? 'Settled' : 'In Escrow'}
                        </span>

                        {/* 🔥 ACTION BUTTONS */}
                        {txn.status !== 'completed' && (
                          <div className="mt-2">
                            {((isOwner && !txn.before_image) || (!isOwner && !txn.after_image)) ? (
                              <button 
                                onClick={() => {
                                  setSelectedRentalId(txn.id);
                                  setProofType(isOwner ? "before" : "after");
                                  setShowCamera(true);
                                }}
                                className="flex items-center gap-1 text-[10px] font-black text-[#F0EDE5] bg-[#004643] hover:bg-[#004643]/90 px-3 py-1.5 rounded-lg transition shadow-sm"
                              >
                                <Camera className="w-3.5 h-3.5" /> 
                                {isOwner ? "Handover Proof" : "Return Proof"}
                              </button>
                            ) : (
                               <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                                 <CheckCircle2 className="w-3 h-3" /> Proof Uploaded
                               </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showAddMoney && <AddMoneyModal onClose={() => setShowAddMoney(false)} onSuccess={fetchData} />}

      {/* 🔥 LIVE CAMERA MODAL */}
      {showCamera && selectedRentalId && (
        <LiveCameraProof 
          rentalId={selectedRentalId} 
          type={proofType} 
          onClose={() => {
            setShowCamera(false);
            setSelectedRentalId("");
          }} 
          onSuccess={(url) => {
            showToast({ message: "Proof Saved! Item is now available & Deposit refunded.", type: "success" });
            fetchData(); 
            // Force refresh to sync global states if needed
            setTimeout(() => {
                window.location.reload(); 
            }, 1000);
          }} 
        />
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && !withdrawLoading && setShowWithdraw(false)}>
          <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden" style={{ animation: "slideUp 0.2s ease-out" }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#004643]/10 bg-white/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#004643]" />
                <h2 className="text-lg font-black text-[#004643]">Withdraw</h2>
              </div>
              {!withdrawLoading && <button onClick={() => setShowWithdraw(false)} className="p-2 rounded-xl text-[#004643]/40 hover:bg-[#004643]/10 transition"><X className="w-5 h-5" /></button>}
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-[#004643]/5 rounded-xl p-4 flex justify-between items-center border border-[#004643]/10">
                <span className="text-xs font-bold text-[#004643]/60">Balance:</span>
                <span className="text-lg font-black text-[#004643]">₹{walletBalance.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#004643]/40">₹</span>
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value) || "")} placeholder="0" className="w-full pl-10 pr-4 py-4 rounded-2xl border border-[#004643]/20 text-[#004643] font-black text-3xl focus:ring-2 focus:ring-[#004643]/40 outline-none transition" />
              </div>
              <button onClick={handleWithdraw} disabled={!withdrawAmount || withdrawAmount > walletBalance || withdrawLoading} className="w-full py-4 bg-[#004643] text-[#F0EDE5] font-bold rounded-2xl disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-2">
                {withdrawLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}