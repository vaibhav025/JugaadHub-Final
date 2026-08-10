import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini safely
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Missing GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Tool 1: Corsair Calendar Function
const createCalendarEventTool: FunctionDeclaration = {
  name: "create_calendar_event",
  description: "Books a handover meeting between the item owner and the renter on Google Calendar.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      ownerEmail: {
        type: SchemaType.STRING,
        description: "The email address of the person who owns the item.",
      },
      renterEmail: {
        type: SchemaType.STRING,
        description: "The email address of the person renting the item.",
      },
      time: {
        type: SchemaType.STRING,
        description: "The time of the meeting, e.g., '10:00 AM Thursday'.",
      },
    },
    required: ["ownerEmail", "renterEmail", "time"],
  },
};

// Tool 2: Search Equipment Function
const searchEquipmentTool: FunctionDeclaration = {
  name: "search_equipment",
  description: "Searches the database for rental equipment based on a keyword.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      searchQuery: {
        type: SchemaType.STRING,
        description: "The keyword to search for, e.g., 'camera', 'lens', 'video editing'.",
      },
    },
    required: ["searchQuery"],
  },
};

export async function POST(request: Request) {
  try {
    const { userMessage } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ reply: "API Key missing on the server. Please check .env.local!" });
    }

    // Using the latest flash model with BOTH tools
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest", 
      tools: [{ functionDeclarations: [createCalendarEventTool, searchEquipmentTool] }],
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      // 🔍 ACTION 1: SEARCH EQUIPMENT
      // 🔍 ACTION 1: SEARCH EQUIPMENT
        if (call.name === "search_equipment") {
        const { searchQuery } = call.args as any;
        console.log("--> Action Detected: AI searching Supabase for:", searchQuery);

        // Exact schema columns: title, description, category, dailyRent, owner, image
        const { data: items, error } = await supabase
            .from("items")
            .select("id, title, description, category, dailyRent, owner, image")
            .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
            .eq('is_available', true) // Sirf available items dikhayega
            .limit(3);

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ 
            reply: `Sorry bro, abhi JugaadHub par "${searchQuery}" ke liye koi equipment available nahi hai. 😔` 
            });
        }

        // Poora data array frontend ko bhej rahe hain taaki cards render ho sakein
        return NextResponse.json({ 
            reply: "Mujhe tumhare liye yeh mast options mile hain. Agar inmein se koi final karna hai toh bata do, main calendar par handover meeting set kar dunga! 👇",
            items: items 
        });
        }
      
      // 📅 ACTION 2: BOOK CALENDAR MEETING
      if (call.name === "create_calendar_event") {
        const { ownerEmail, renterEmail, time } = call.args as any;
        
        console.log("--> Action Detected: Gemini wants to book a meeting at:", time);

        // 🚀 THE REAL CORSAIR MCP CALL 🚀
        try {
          const webhookUrl = process.env.CORSAIR_WEBHOOK_URL; 
          
          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                action: "create_calendar_event", 
                data: { ownerEmail, renterEmail, time } 
              })
            });
          } else {
            console.warn("Webhook URL missing! Add CORSAIR_WEBHOOK_URL to .env.local");
          }

          const successMessage = `Awesome! I have successfully booked the handover meeting for ${time} via Corsair Google Calendar MCP! 📅`;
          return NextResponse.json({ reply: successMessage });
          
        } catch (webhookError) {
          console.error("Corsair Webhook Failed:", webhookError);
          return NextResponse.json({ 
            reply: "Oops! I tried to book the meeting, but the calendar server is down right now." 
          });
        }
      }
    }

    // Normal chat flow (no function triggered)
    return NextResponse.json({ reply: response.text() });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { reply: "Oops! I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}