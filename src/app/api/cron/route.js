import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Triggered by a scheduler running hourly.
 * It queries Supabase for all wishes, determines what the current time is 
 * in the wish's specified timezone, and triggers the email if it is midnight locally for them.
 */
export async function GET(request) {
  // Authentication mechanism for the CRON (e.g. Vercel Cron Secret)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Query Supabase for all wishes
  const { data: wishes, error } = await supabase
    .from('wishes')
    .select('*, profiles(email, user_name)');
    
  if (error) {
    console.error("Failed to fetch wishes:", error);
    return NextResponse.json({ error: "DB Fetch failed" }, { status: 500 });
  }

  let sentCount = 0;

  for (const wish of wishes || []) {
    const userEmail = wish.profiles?.email;
    const tz = wish.timezone || "Asia/Kolkata";
    
    // Check what the current time is in that timezone
    const nowInTz = new Date().toLocaleString("en-US", { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false });
    const tzDateStr = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
    
    const [hour, min] = nowInTz.split(':').map(Number);
    const isMidnight = (hour === 0 && min >= 0 && min <= 59); // Assuming cron runs hourly

    // Check if the current date matches the wish date
    const targetDateMatch = `${String(tzDateStr.getMonth() + 1).padStart(2, "0")}-${String(tzDateStr.getDate()).padStart(2, "0")}`;
    const wishDateParts = wish.date.split('-');
    const wishMonthDay = wishDateParts.length === 3 ? `${wishDateParts[1]}-${wishDateParts[2]}` : wish.date; // handle YYYY-MM-DD
    
    if (userEmail && isMidnight && wishMonthDay === targetDateMatch) {
      console.log(`[EMAIL SEND] To: ${userEmail} -> It is 12:00 AM in ${wish.country}! Wish happy ${wish.event} to ${wish.name}!`);
      // await resend.emails.send({ ... })
      sentCount++;
    }
  }

  return NextResponse.json({ 
    status: "success", 
    wishesProcessed: sentCount,
    timestamp: new Date().toISOString()
  });
}
