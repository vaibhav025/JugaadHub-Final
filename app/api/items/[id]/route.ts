import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// FIX: Yahan ANON_KEY ki jagah SERVICE_ROLE_KEY use kar rahe hain RLS bypass karne ke liye
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const resolvedParams = await params;
    const itemId = resolvedParams.id;
    
    console.log(`Deleting item from Supabase DB: ${itemId}`);

    const { data, error } = await supabase
      .from('items') 
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error("Supabase Error:", error.message);
      throw new Error(error.message);
    }

    return NextResponse.json(
      { message: "Item successfully removed from Database" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Delete handler error:", error);
    return NextResponse.json(
      { error: "Failed to remove item", details: error.message },
      { status: 500 }
    );
  }
}