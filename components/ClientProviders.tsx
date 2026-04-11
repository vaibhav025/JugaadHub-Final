"use client";

import type { ReactNode } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import LoginModal from "@/components/LoginModal";
import AddItemModal from "@/components/AddItemModal";
import CheckoutModal from "@/components/CheckoutModal";
import Toast from "@/components/Toast";
import BottomNav from "@/components/BottomNav";

function GlobalOverlays() {
  const { showLoginModal, showAddItemModal } = useApp();
  return (
    <>
      {showLoginModal && <LoginModal />}
      {showAddItemModal && <AddItemModal />}
      <CheckoutModal />
      <Toast />
      <BottomNav />
    </>
  );
}

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <GlobalOverlays />
    </AppProvider>
  );
}
