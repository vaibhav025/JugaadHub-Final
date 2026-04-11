import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    // 🌐 get client info
    const userAgent = req.headers.get("user-agent") || "unknown";
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 💾 INSERT (id + created_at auto)
    const { error } = await supabase.from("logins").insert([
      {
        email,
        ip,
        user_agent: userAgent,
      },
    ]);

    if (error) {
      console.error("DB Error:", error);
    }

    // 🔔 TELEGRAM
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `🚨 Login Alert\n\n👤 ${email}\n🌐 ${ip}\n📱 ${userAgent}\n🕒 ${new Date().toLocaleString()}`,
        }),
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}