"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import OwnerOfferModal from "./OwnerOfferModal";
import FinalPaymentModal from "./FinalPaymentModal";

export default function OfferListener() {
  const { user } = useApp();
  const [pendingOffer, setPendingOffer] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPendingOffers = async () => {
      // 🔥 1. Check if URL has a specific payment ID (?pay=123)
      const urlParams = new URLSearchParams(window.location.search);
      const forcedPayId = urlParams.get('pay');

      // If user clicked the link in Chat, forcefully fetch that rental and ignore dismiss flags
      if (forcedPayId) {
        const { data } = await supabase
          .from("rentals")
          .select("*, items(title, image)")
          .eq("id", forcedPayId)
          .single();
        
        if (data && data.status === 'pending_payment') {
          setPendingOffer(data);
          // 🔥 URL CLEANER MAGIC: Ye URL se '?pay=' hata dega bina page refresh kiye!
          window.history.replaceState({}, document.title, window.location.pathname);
          return; // Stop here, show the forced modal
        }
      }

      // 🔥 2. Normal Flow (Background polling)
      const { data } = await supabase
        .from("rentals")
        .select(`*, items (title, image)`)
        .or(`and(owner_id.eq.${user.id},offer_status.eq.pending),and(renter_id.eq.${user.id},offer_status.eq.countered),and(renter_id.eq.${user.id},offer_status.eq.accepted)`)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Find the first offer that hasn't been dismissed by the user in this session
        const offerToShow = data.find((offer) => {
          if (offer.offer_status === 'accepted') {
            return !sessionStorage.getItem(`dismissed_pay_${offer.id}`);
          }
          return true; // Pending and Countered offers always show
        });

        setPendingOffer(offerToShow || null);
      } else {
        setPendingOffer(null);
      }
    };

    fetchPendingOffers();

    const channel = supabase
      .channel("custom-offer-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rentals" },
        (payload) => {
          const newData = payload.new as any;
          if (newData && (newData.owner_id === user.id || newData.renter_id === user.id)) {
            fetchPendingOffers();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!pendingOffer) return null;

  if (pendingOffer.offer_status === "accepted" && pendingOffer.renter_id === user?.id) {
    return (
      <FinalPaymentModal 
        rental={pendingOffer} 
        onClose={() => setPendingOffer(null)} 
      />
    );
  }

  return (
    <OwnerOfferModal 
      rental={pendingOffer} 
      onClose={() => setPendingOffer(null)} 
      onSuccess={() => setPendingOffer(null)} 
    />
  );
}