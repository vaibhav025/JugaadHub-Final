"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, CheckCircle2, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useApp } from "@/context/AppContext";

interface Props {
  rentalId: string;
  type: "before" | "after"; 
  onClose: () => void;
  onSuccess: (imageUrl: string) => void;
}

export default function LiveCameraProof({ rentalId, type, onClose, onSuccess }: Props) {
  const { sendMessage } = useApp(); 
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError("Camera access denied. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const watermarkText = `JugaadHub ${type.toUpperCase()} Proof: ${timestamp}`;
    ctx.fillStyle = "rgba(0, 70, 67, 0.7)"; 
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(watermarkText, canvas.width / 2, canvas.height - 20);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const uploadPhoto = async () => {
    if (!capturedPhoto) return;
    setIsUploading(true);

    try {
      const res = await fetch(capturedPhoto);
      const blob = await res.blob();
      const fileName = `${rentalId}_${type}_${Date.now()}.jpg`;

      // 1. Upload Image to Storage
      const { error: uploadError } = await supabase.storage
        .from('handover_images')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('handover_images')
        .getPublicUrl(fileName);

      // 🔥 2. FETCH CURRENT DB STATE
      // Check if the OTHER proof already exists
      const { data: rental, error: fetchError } = await supabase
        .from('rentals')
        .select('renter_id, deposit, product_id, payment_method, before_image, after_image')
        .eq('id', rentalId)
        .single();

      if (fetchError || !rental) throw new Error("Could not find rental details.");

      // 🔥 3. SMART ESCROW LOGIC (Check if BOTH proofs are now present)
      let isReadyToSettle = false;

      // If we are uploading AFTER proof, check if BEFORE proof exists
      if (type === "after" && rental.before_image) {
        isReadyToSettle = true;
      }
      
      // If we are uploading BEFORE proof, check if AFTER proof mysteriously exists
      if (type === "before" && rental.after_image) {
         isReadyToSettle = true;
      }

      // 🔥 4. UPDATE DATABASE (Save the photo first)
      const updatePayload: any = {
        [type === "before" ? "before_image" : "after_image"]: publicUrl
      };

      // If BOTH proofs are present, initiate settlement!
      if (isReadyToSettle) {
        updatePayload.status = "completed";
      }

      const { error: dbError } = await supabase
        .from('rentals')
        .update(updatePayload)
        .eq('id', rentalId);

      if (dbError) throw dbError;

      // 🔥 5. RUN SETTLEMENT TASKS (ONLY IF READY)
      if (isReadyToSettle) {
        // A. RESTORE ITEM AVAILABILITY
        const { error: itemError } = await supabase
          .from('items')
          .update({ is_available: true })
          .eq('id', rental.product_id);
        
        if (itemError) console.error("Failed to update item availability.");

        // B. REFUND LOGIC & MESSAGING
        if (!rental.payment_method || rental.payment_method === 'wallet') {
          const { error: refundError } = await supabase.rpc('add_to_wallet', {
            target_user_id: rental.renter_id,
            amount: rental.deposit
          });
          if (refundError) console.error("Wallet Refund failed:", refundError);

          await sendMessage(`💰 REFUND SUCCESSFUL\n\nYour item has been safely returned. Both proofs are verified. The Security Deposit of ₹${rental.deposit} has been credited back to your JugaadHub Wallet.`, rental.renter_id);
        } else if (rental.payment_method === 'upi' || rental.payment_method === 'razorpay') {
          await sendMessage(`💸 DEPOSIT REFUND INITIATED\n\nBoth proofs verified! Your rented item was safely returned to the owner!\n\nA refund of ₹${rental.deposit} has been initiated to your original payment method. It will reflect in your bank account shortly.\n\nThanks for renting on JugaadHub!`, rental.renter_id);
        }
      }

      // 6. Success Feedback and Close
      setTimeout(() => {
        onSuccess(publicUrl);
        onClose();
      }, 1000); 

    } catch (error: any) {
      console.error("Critical Flow Error:", error);
      alert("Error: " + (error.message || "Failed to process proof. Please try again."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center justify-between p-4 bg-black/50 text-white absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-sm">Condition Proof ({type.toUpperCase()})</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {cameraError ? (
          <div className="text-white text-center px-4">
            <p className="mb-4">{cameraError}</p>
            <button onClick={onClose} className="px-6 py-2 bg-[#004643] rounded-xl font-bold">Close</button>
          </div>
        ) : capturedPhoto ? (
          <img src={capturedPhoto} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-8 bg-black/90 flex items-center justify-center gap-8">
        {capturedPhoto ? (
          <>
            <button onClick={() => { setCapturedPhoto(null); startCamera(); }} disabled={isUploading} className="flex flex-col items-center text-white/50 hover:text-white transition">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-1 border border-white/10">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Retake</span>
            </button>
            <button onClick={uploadPhoto} disabled={isUploading} className="flex flex-col items-center text-emerald-400">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-1 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <CheckCircle2 className="w-10 h-10" />}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{isUploading ? "Syncing..." : "Confirm"}</span>
            </button>
          </>
        ) : (
          <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center relative group active:scale-90 transition-all">
            <div className="w-16 h-16 bg-white rounded-full group-hover:scale-95 transition-all shadow-xl flex items-center justify-center text-[#004643]">
               <Camera className="w-8 h-8" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}