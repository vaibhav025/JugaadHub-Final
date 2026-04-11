"use client";

import { useState, useRef } from "react";
import { X, PackagePlus, Image as ImageIcon } from "lucide-react";
import { useApp, type Category } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

const CATEGORIES: Category[] = [
  "Videography", "Lab Gear", "Electronics", "Books", "Tools", "Music",
];

export default function AddItemModal() {
  const { setShowAddItemModal, addItem, showToast, user } = useApp();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Electronics");
  const [description, setDescription] = useState("");
  const [dailyRent, setDailyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [maxDays, setMaxDays] = useState(10); 
  const [loading, setLoading] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const close = () => setShowAddItemModal(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({ message: "Size < 5MB please!", type: "error" });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !title.trim() || !dailyRent) {
      showToast({ message: "All fields are required!", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const publicUrl = await uploadToCloudinary(imageFile);

      const newItem = {
        title: title.trim(),
        category,
        description: description.trim(),
        dailyRent: parseFloat(dailyRent),
        deposit: parseFloat(deposit) || 0,
        owner: user?.email ?? "anon@std.ggsipu.ac.in",
        image: publicUrl, 
      };

      const { data, error } = await supabase.from("items").insert([
        {
          title: newItem.title,
          category: newItem.category,
          description: newItem.description,
          dailyRent: newItem.dailyRent,
          deposit: newItem.deposit,
          owner: newItem.owner,
          owner_id: user?.id,
          image: newItem.image,
          max_days: maxDays, 
        },
      ]);

      if (error) throw error;
      
      showToast({ message: "Item Listed Successfully!", type: "success" });
      setTimeout(() => window.location.reload(), 1500); 
      close();
    } catch (err: any) {
      showToast({ message: err.message || "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Reusable input class for the custom theme
  const inputClassName = "w-full px-4 py-3 rounded-xl border border-[#004643]/20 bg-white text-[#004643] placeholder-[#004643]/40 focus:ring-2 focus:ring-[#004643]/20 focus:border-[#004643] outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="bg-[#F0EDE5] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto" style={{ animation: "slideUp 0.25s ease-out" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#004643]/10 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#004643]/10 rounded-xl flex items-center justify-center">
              <PackagePlus className="w-5 h-5 text-[#004643]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#004643]">List an Item</h2>
              <p className="text-xs font-semibold text-[#004643]/50">Earn from your gear</p>
            </div>
          </div>
          <button onClick={close} className="p-2 text-[#004643]/40 hover:text-[#004643] hover:bg-[#004643]/10 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          
          {/* Image Upload Area */}
          <div onClick={() => fileInputRef.current?.click()} className={`relative h-40 border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 transition-all ${imagePreview ? 'border-[#004643]' : 'border-[#004643]/30 bg-[#004643]/5 hover:bg-[#004643]/10'}`}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-[#004643]/40" />
                <p className="text-xs font-bold text-[#004643]/80">Upload Item Photo</p>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          </div>

          <input type="text" placeholder="Item Name" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClassName} />

          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputClassName}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Rent/Day (₹)" value={dailyRent} onChange={(e) => setDailyRent(e.target.value)} className={inputClassName} />
            <input type="number" placeholder="Security Deposit (₹)" value={deposit} onChange={(e) => setDeposit(e.target.value)} className={inputClassName} />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#004643]/70 mb-1.5 ml-1">Maximum Rental Days Allowed</label>
            <input 
              type="number" 
              min="1" 
              max="30" 
              placeholder="Max Days (e.g. 10)" 
              value={maxDays} 
              onChange={(e) => setMaxDays(Number(e.target.value))} 
              className={inputClassName} 
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#004643] text-[#F0EDE5] font-bold rounded-2xl hover:bg-[#004643]/90 disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-[#004643]/20">
            {loading ? "Optimizing & Uploading..." : "List Item Now"}
          </button>
        </form>

      </div>
    </div>
  );
}