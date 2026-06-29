import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header. Use Bearer <API_KEY>" }, { status: 401 });
    }

    const apiKey = authHeader.split(" ")[1];

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id, is_active")
      .eq("key_hash", apiKey)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return NextResponse.json({ error: "Invalid or inactive API Key" }, { status: 401 });
    }

    const userId = keyData.user_id;

    // Check if user is approved
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_approved")
      .eq("id", userId)
      .single();

    if (!profile?.is_approved) {
      return NextResponse.json({ error: "Account pending approval by administrator." }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { recipient, message, device_id } = body;

    if (!recipient || !message) {
      return NextResponse.json({ error: "Missing required fields: 'recipient' and 'message'" }, { status: 400 });
    }

    // Determine device
    let targetDeviceId = device_id;
    if (!targetDeviceId) {
      const { data: devices } = await supabaseAdmin
        .from("devices")
        .select("id")
        .eq("user_id", userId)
        .order("is_online", { ascending: false })
        .limit(1);
        
      if (!devices || devices.length === 0) {
        return NextResponse.json({ error: "No connected devices found for this account." }, { status: 400 });
      }
      targetDeviceId = devices[0].id;
    }

    // Insert message
    const { data: messageData, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert([{
        user_id: userId,
        device_id: targetDeviceId,
        recipient: String(recipient),
        message_body: String(message),
        status: "queued",
        direction: "outbound"
      }])
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to queue message", details: insertError.message }, { status: 500 });
    }

    // Update last_used_at on API key
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", apiKey);

    return NextResponse.json({ 
      success: true, 
      message: "Message queued successfully", 
      data: { message_id: messageData.id } 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
