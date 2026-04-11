"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient"; 

export type Category = "Videography" | "Lab Gear" | "Electronics" | "Books" | "Tools" | "Music";

export interface Item {
  id: string;
  title: string;
  category: Category;
  dailyRent: number;
  deposit: number;
  owner: string;
  owner_id?: string;
  owner_name?: string;
  image: string;
  rating: number;
  reviews: number;
  description?: string;
  is_available?: boolean; 
  last_rental_days?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  is_read?: boolean; 
}

export interface Toast {
  message: string;
  type: "error" | "success" | "info";
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  items: Item[];
  addItem: (item: any) => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  showAddItemModal: boolean;
  setShowAddItemModal: (v: boolean) => void;
  checkoutItem: Item | null;
  setCheckoutItem: (item: Item | null) => void;
  chatMessages: ChatMessage[];
  sendMessage: (text: string, receiverId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toast: Toast | null;
  showToast: (toast: Toast) => void;
  unreadCount: number; 
  markChatAsRead: (senderId: string) => Promise<void>; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<Item | null>(null);
  const [toast, setToastState] = useState<Toast | null>(null);
  const [unreadCount, setUnreadCount] = useState(0); 

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0], 
        });
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: itemsData, error: itemsError } = await supabase.from("items").select("*").order("created_at", { ascending: false });
      if (itemsData) setItems(itemsData);
      if (itemsError) console.error("Error fetching items:", itemsError);

      if (user) {
        const { data: msgData, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: true });
        
        if (msgData) {
          setChatMessages(msgData);
          const unread = msgData.filter(m => m.receiver_id === user.id && !m.is_read).length;
          setUnreadCount(unread);
        }
        if (msgError) console.error("Error fetching messages:", msgError);
      } else {
        setChatMessages([]);
        setUnreadCount(0);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
            setChatMessages((prev) => {
              if (prev.some((msg) => msg.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            
            if (newMessage.receiver_id === user.id) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const showToast = useCallback((t: Toast) => {
    setToastState(t);
    setTimeout(() => setToastState(null), 4500);
  }, []);

  const addItem = useCallback(async (itemData: any) => {
    if (!user) {
      showToast({ message: "Please login to add an item.", type: "error" });
      return;
    }

    const payload = {
      ...itemData,
      owner_id: user.id,
      owner_name: user.name,
      owner: user.email,
      rating: 5.0,
      reviews: 0
    };

    const { error } = await supabase.from("items").insert([payload]);
    if (error) {
      showToast({ message: "Failed to add item", type: "error" });
    } else {
      showToast({ message: "Item added successfully! 🎉", type: "success" });
      const { data } = await supabase.from("items").select("*").order("created_at", { ascending: false });
      if (data) setItems(data);
    }
  }, [user, showToast]);

  const sendMessage = useCallback(
    async (text: string, receiverId: string) => {
      if (!user) return;
      const { error } = await supabase.from("messages").insert([
        {
          text,
          sender_id: user.id,
          receiver_id: receiverId,
          sender_name: user.name,
          is_read: false 
        },
      ]);
      if (error) {
        showToast({ message: "Message send failed", type: "error" });
      }
    },
    [user, showToast]
  );

  const markChatAsRead = useCallback(async (senderId: string) => {
    if (!user) return;
    
    setChatMessages((prev) => 
      prev.map(m => (m.sender_id === senderId && m.receiver_id === user.id) ? { ...m, is_read: true } : m)
    );
    
    setUnreadCount((prev) => {
      const remaining = chatMessages.filter(m => m.receiver_id === user.id && !m.is_read && m.sender_id !== senderId).length;
      return remaining > 0 ? remaining : 0;
    });

    await supabase.from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", senderId);
  }, [user, chatMessages]);

  return (
    <AppContext.Provider
      value={{
        user, setUser, items, addItem, 
        showLoginModal, setShowLoginModal,
        showAddItemModal, setShowAddItemModal, 
        checkoutItem, setCheckoutItem,
        chatMessages, sendMessage,
        searchQuery, setSearchQuery, 
        toast, showToast,
        unreadCount, markChatAsRead 
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}