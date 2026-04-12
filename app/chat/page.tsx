"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Send, ShieldCheck, Lock, MessageSquareOff, User as UserIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

// ── Aggressive Privacy Masking (OpSec Level: Paranoid) ─────────────────────────
const CREDIT_CARD_RE = /(?:\d[\s\-\.\u200B_~,]*){14,15}\d/g; 
const AADHAAR_RE = /(?:\d[\s\-\.\u200B_~,]*){11}\d/g; 
const PHONE_RE = /(?:\+?91[\s\-\.\u200B_~,]*)?[6-9](?:[\s\-\.\u200B_~,]*\d){9}/g; 

// 🔥 THE UPI NUKES 🔥
// 1. Catches standard symbols (@, [at]) for ANY extension (Paytm, Email, Crypto, Unknown Banks)
const UNIVERSAL_VPA_RE = /[A-Za-z0-9.\-_]{2,}[\s\u200B]*(@|\[at\]|\(at\))[\s\u200B]*[A-Za-z0-9]{2,20}/gi;
// 2. Catches the bare word "at" only if followed by a known Indian PSP/Bank (prevents false positives)
const OBFUSCATED_UPI_RE = /[A-Za-z0-9.\-_]{2,}[\s\u200B]+(at)[\s\u200B]+(paytm|ybl|ibl|axl|upi|ok[a-z]+|icici|sbi|hdfc|axis|kotak|yes|indus|fed|idfc|amazon|slice|post|navi|jio|airtel|freecharge|mobi|bhim|jupiter)[a-zA-Z]*/gi;

const PAN_CARD_RE = /[A-Z]{5}[\s\-\.\u200B]*[0-9]{4}[\s\-\.\u200B]*[A-Z]{1}/gi; 
const IFSC_RE = /[A-Z]{4}[\s\-\.\u200B]*0[\s\-\.\u200B]*[A-Z0-9]{6}/gi; 
const CRYPTO_ETH_RE = /0x[\s\u200B]*([a-fA-F0-9][\s\u200B]*){40}/gi; 
const CRYPTO_BTC_RE = /(?:1|3)(?:[1-9A-HJ-NP-Za-km-z][\s\u200B]*){25,34}|bc1(?:[a-zA-HJ-NP-Z0-9][\s\u200B]*){39,59}/g; 
const IPV4_RE = /(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)[\s\u200B]*\.[\s\u200B]*(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)[\s\u200B]*\.[\s\u200B]*(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)[\s\u200B]*\.[\s\u200B]*(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g; 
const JWT_RE = /eyJ[\w\-]+[\s\u200B]*\.[\s\u200B]*[\w\-]+[\s\u200B]*\.[\s\u200B]*[\w\-]+/g;

function maskText(raw: string): React.ReactNode[] {
  const MASK = "🔒 [HIDDEN BY JUGAADHUB]";
  
  // Execution order matters. Mask longest/most specific patterns first.
  let text = raw
    .replace(JWT_RE, MASK)
    .replace(CREDIT_CARD_RE, MASK) 
    .replace(AADHAAR_RE, MASK)     
    .replace(PHONE_RE, MASK)       
    .replace(CRYPTO_ETH_RE, MASK)
    .replace(CRYPTO_BTC_RE, MASK)
    .replace(PAN_CARD_RE, MASK)
    .replace(IFSC_RE, MASK)
    .replace(IPV4_RE, MASK)
    .replace(UNIVERSAL_VPA_RE, MASK) // Catches all emails and proper UPIs
    .replace(OBFUSCATED_UPI_RE, MASK); // Catches spaced out "at paytm" tricks

  const parts = text.split(MASK);
  const result: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part) result.push(<span key={`p${i}`}>{part}</span>);
    if (i < parts.length - 1) {
      result.push(
        <span key={`m${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[11px] font-bold mx-0.5 border border-red-200" title="Sensitive Data Redacted">
          <Lock className="w-2.5 h-2.5" /> HIDDEN
        </span>
      );
    }
  });
  return result;
}

function formatTime(timestamp: string) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const COLORS = ["bg-[#004643]", "bg-blue-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600"];

export default function ChatPage() {
  const { chatMessages, sendMessage, user, unreadCount, markChatAsRead } = useApp();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const [contactDetails, setContactDetails] = useState<Record<string, { is_verified: boolean; name: string }>>({});
  const [urlData, setUrlData] = useState({ id: "", name: "" });

  const [showMobileList, setShowMobileList] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nId = params.get("newUserId");
      const nName = params.get("newUserName");
      if (nId && nName) {
        setUrlData({ id: nId, name: nName });
        setShowMobileList(false); 
      }
    }
  }, []);

  // Dynamic Contact List Generator
  const dynamicContacts = useMemo(() => {
    if (!user) return [];
    const contactMap = new Map();

    chatMessages.forEach((msg) => {
      const isMine = msg.sender_id === user.id;
      const contactId = isMine ? msg.receiver_id : msg.sender_id;

      let contactName = "User";
      if (!isMine) {
        contactName = msg.sender_name; 
      } else {
        if (contactDetails[contactId]?.name) {
          contactName = contactDetails[contactId].name;
        } else if (contactId === urlData.id && urlData.name) {
          contactName = urlData.name;
        }
      }

      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          id: contactId,
          name: contactName,
          avatar: contactName.charAt(0).toUpperCase(),
          color: COLORS[contactId.length % COLORS.length],
          is_verified: contactDetails[contactId]?.is_verified || false
        });
      } else if (!isMine) {
        const existing = contactMap.get(contactId);
        existing.name = msg.sender_name;
        existing.avatar = msg.sender_name.charAt(0).toUpperCase();
        existing.is_verified = contactDetails[contactId]?.is_verified || false;
      }
    });

    return Array.from(contactMap.values());
  }, [chatMessages, user, contactDetails, urlData]); 

  const [activeContact, setActiveContact] = useState<any>(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      if (!user || dynamicContacts.length === 0) return;
      const userIds = dynamicContacts.map(c => c.id);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, is_verified, full_name")
          .in("id", userIds);

        if (data) {
          const detailsMap: Record<string, { is_verified: boolean; name: string }> = {};
          data.forEach(profile => {
            detailsMap[profile.id] = {
              is_verified: profile.is_verified || false,
              name: profile.full_name || "" 
            };
          });
          
          setContactDetails(prev => {
            const hasChanged = Object.keys(detailsMap).some(
              key => prev[key]?.is_verified !== detailsMap[key].is_verified || prev[key]?.name !== detailsMap[key].name
            );
            return hasChanged ? { ...prev, ...detailsMap } : prev;
          });
        }
      } catch (err) {
        console.error("Error fetching contact details:", err);
      }
    };

    fetchContactInfo();
  }, [chatMessages.length]);

  useEffect(() => {
    if (dynamicContacts.length > 0) {
      if (urlData.id) {
        const targetContact = dynamicContacts.find((c: any) => c.id === urlData.id);
        if (targetContact && activeContact?.id !== targetContact.id) {
          setActiveContact(targetContact);
        }
      } else if (!activeContact) {
        setActiveContact(dynamicContacts[0]);
      }
    }
  }, [dynamicContacts, urlData.id]); 

  const currentChat = useMemo(() => {
    if (!activeContact || !user) return [];
    return chatMessages.filter(msg => 
      (msg.sender_id === user.id && msg.receiver_id === activeContact.id) ||
      (msg.sender_id === activeContact.id && msg.receiver_id === user.id)
    );
  }, [chatMessages, activeContact, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat]);

  useEffect(() => {
    if (activeContact && unreadCount > 0 && user) {
      const hasUnread = chatMessages.some(
        (msg) => msg.sender_id === activeContact.id && msg.receiver_id === user.id && msg.is_read === false
      );

      if (hasUnread) {
        markChatAsRead(activeContact.id);
      }
    }
  }, [activeContact, chatMessages, unreadCount, user, markChatAsRead]);

  useEffect(() => {
    if (activeContact && contactDetails[activeContact.id]) {
      const updatedInfo = contactDetails[activeContact.id];
      if (activeContact.is_verified !== updatedInfo.is_verified || (updatedInfo.name && activeContact.name === "User")) {
        setActiveContact((prev: any) => ({
          ...prev, 
          is_verified: updatedInfo.is_verified,
          name: updatedInfo.name || prev.name,
          avatar: (updatedInfo.name || prev.name).charAt(0).toUpperCase()
        }));
      }
    }
  }, [contactDetails, activeContact]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !user || !activeContact) return;
    
    const currentInput = trimmed;
    setInput(""); 
    await sendMessage(currentInput, activeContact.id);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0EDE5]">
        <div className="text-center">
          <MessageSquareOff className="w-16 h-16 text-[#004643]/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#004643]">Please Login to Chat</h2>
          <Link href="/" className="text-[#004643] underline hover:text-[#004643]/70 mt-2 block">Go back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0EDE5] pb-16 md:pb-0">
      
      {/* Sidebar */}
      <aside className={`${showMobileList ? "flex" : "hidden"} sm:flex flex-col w-full sm:w-72 bg-[#F0EDE5] border-r border-[#004643]/10`}>
        <div className="px-4 py-4 border-b border-[#004643]/10 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/40">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="font-black text-[#004643]">Messages</h2>
        </div>

        <div className="mx-3 mt-3 mb-2 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[11px] text-red-600 font-medium leading-tight">Paranoid Anti-Leak Active: All PII and Virtual Payment Addresses masked.</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {dynamicContacts.length === 0 ? (
            <p className="text-xs text-center text-[#004643]/30 mt-10">No ongoing chats.</p>
          ) : (
            dynamicContacts.map((c: any) => {
              const hasUnreadFromThisContact = chatMessages.some(
                (msg) => msg.sender_id === c.id && msg.receiver_id === user.id && msg.is_read === false
              );

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveContact(c);
                    setShowMobileList(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                    c.id === activeContact?.id ? "bg-[#004643]/10 border-r-2 border-[#004643]" : "hover:bg-[#004643]/5"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center text-white font-bold shrink-0 relative`}>
                    {c.avatar}
                    {hasUnreadFromThisContact && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#F0EDE5] rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={`text-sm truncate ${hasUnreadFromThisContact ? "font-black text-[#004643]" : "font-semibold text-[#004643]"}`}>
                        {c.name}
                      </p>
                      {c.is_verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className={`${!showMobileList ? "flex" : "hidden"} sm:flex flex-1 flex-col min-w-0 bg-[#F0EDE5]`}>
        {activeContact ? (
          <>
            <div className="bg-[#F0EDE5] border-b border-[#004643]/10 px-4 py-4 flex items-center gap-3 shadow-sm">
              <button onClick={() => setShowMobileList(true)} className="sm:hidden p-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/40">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={`w-9 h-9 rounded-full ${activeContact.color} flex items-center justify-center text-white font-bold shrink-0`}>
                {activeContact.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-[#004643] text-sm truncate">{activeContact.name}</p>
                  {activeContact.is_verified && (
                    <div title="KYC Verified via DigiLocker" className="flex items-center justify-center p-0.5 rounded-full bg-emerald-100 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-auto hidden xs:flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-600 uppercase">Live</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {currentChat.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#004643]/30 space-y-2 opacity-60">
                  <MessageSquareOff className="w-12 h-12" />
                  <p className="text-sm font-medium">No messages yet. Say hi to {activeContact.name.split(' ')[0]}!</p>
                </div>
              ) : (
                currentChat.map((msg) => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-[#004643]/10 flex items-center justify-center text-[10px] font-bold mr-2 mt-auto text-[#004643]">
                          {msg.sender_name?.charAt(0) || activeContact.avatar}
                        </div>
                      )}
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMine ? "bg-[#004643] text-[#F0EDE5] rounded-br-none" : "bg-white border border-[#004643]/10 text-[#004643] rounded-bl-none"
                      }`}>
                        <p className="text-sm leading-relaxed break-words">{maskText(msg.text)}</p>
                        <p className={`text-[9px] mt-1 text-right font-medium ${isMine ? "text-[#F0EDE5]/50" : "text-[#004643]/30"}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="bg-[#F0EDE5] border-t border-[#004643]/10 p-4 sm:rounded-t-3xl shadow-[0_-4px_12px_rgba(0,70,67,0.06)]">
              <div className="flex gap-2 items-end max-w-4xl mx-auto">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message ${activeContact.name}...`}
                  className="flex-1 resize-none border border-[#004643]/20 bg-white/60 rounded-2xl p-3 text-sm text-[#004643] placeholder:text-[#004643]/30 focus:ring-2 focus:ring-[#004643]/30 focus:border-transparent outline-none transition-all max-h-32"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-3.5 bg-[#004643] text-[#F0EDE5] rounded-2xl hover:bg-[#004643]/80 active:scale-90 disabled:opacity-40 transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#004643]/30 bg-[#F0EDE5] relative">
            <button onClick={() => setShowMobileList(true)} className="sm:hidden absolute top-4 left-4 p-2 rounded-xl hover:bg-[#004643]/10 text-[#004643]/40">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UserIcon className="w-16 h-16 mb-4 opacity-50" />
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}