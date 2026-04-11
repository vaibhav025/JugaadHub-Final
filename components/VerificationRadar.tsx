"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { Camera, AlertTriangle, Clock } from "lucide-react";

export default function VerificationRadar() {
  const { user } = useApp();
  const [missingBefore, setMissingBefore] = useState<any>(null); // For Renter
  const [missingAfter, setMissingAfter] = useState<any>(null);   // For Owner

  useEffect(() => {
    if (!user) return;

    const checkVerifications = async () => {
      const now = new Date().toISOString();

      // 1. FOR RENTER: Check if rental is active but 'Before Photo' is missing
      const { data: renterData } = await supabase
        .from("rentals")
        .select("*, items(title)")
        .eq("renter_id", user.id)
        .eq("status", "active") // OTP verify ho chuka hai
        .is("before_image", null)
        .limit(1);
      
      if (renterData && renterData.length > 0) setMissingBefore(renterData[0]);

      // 2. FOR OWNER: Check if rental time is OVER and 'After Photo' is missing
      const { data: ownerData } = await supabase
        .from("rentals")
        .select("*, items(title)")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .lt("expected_return_at", now) // Time is UP!
        .is("after_image", null)
        .limit(1);

      if (ownerData && ownerData.length > 0) setMissingAfter(ownerData[0]);
    };

    checkVerifications();
    // Check every 1 minute
    const interval = setInterval(checkVerifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle Renter Upload Click
  const handleRenterUpload = () => {
    alert(`Open Camera Modal to upload BEFORE photo for ${missingBefore.items.title}`);
    // Yahan apna LiveCameraProof modal trigger karna
  };

  // Handle Owner Upload Click
  const handleOwnerUpload = () => {
    alert(`Open Camera Modal to upload AFTER photo for ${missingAfter.items.title} to release security deposit!`);
    // Yahan apna LiveCameraProof modal trigger karna
  };

  return (
    <>
      {/* RENTER ALERT: Needs Before Photo */}
      {missingBefore && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-amber-100 border-2 border-amber-400 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-black text-amber-900 text-sm">Action Required: Verify Gear</h4>
              <p className="text-xs text-amber-800 font-medium mt-1">
                You recently received <b>{missingBefore.items.title}</b>. Please upload the "Before" photo immediately to avoid liability.
              </p>
              <button onClick={handleRenterUpload} className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20">
                <Camera className="w-4 h-4" /> Upload Before Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER ALERT: Needs After Photo (Rental Over) */}
      {missingAfter && !missingBefore && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-rose-100 border-2 border-rose-400 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <h4 className="font-black text-rose-900 text-sm">Rental Period Over!</h4>
              <p className="text-xs text-rose-800 font-medium mt-1">
                The rental for <b>{missingAfter.items.title}</b> has ended. Upload the "After" photo to verify its condition and release the escrow!
              </p>
              <button onClick={handleOwnerUpload} className="mt-3 w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20">
                <Camera className="w-4 h-4" /> Verify Return (After Photo)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}