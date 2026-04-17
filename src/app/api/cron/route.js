import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Initialize carefully so Vercel doesn't crash during the statically analyzed build step
// if the environment variables haven't been pasted into the Vercel dashboard yet.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    // By checking min < 30, we ensure that a CRON trigger running at XX:00 or XX:30 
    // will only trigger ONCE per day right at the stroke of midnight organically.
    const isMidnight = (hour === 0 && min >= 0 && min < 30);

    // Check if the current date matches the wish date
    const targetDateMatch = `${String(tzDateStr.getMonth() + 1).padStart(2, "0")}-${String(tzDateStr.getDate()).padStart(2, "0")}`;
    const wishDateParts = wish.date.split('-');
    const wishMonthDay = wishDateParts.length === 3 ? `${wishDateParts[1]}-${wishDateParts[2]}` : wish.date; // handle YYYY-MM-DD
    
    if (userEmail && isMidnight && wishMonthDay === targetDateMatch) {
      console.log(`[EMAIL SEND] To: ${userEmail} -> It is 12:00 AM in ${wish.country}! Wish happy ${wish.event} to ${wish.name}!`);
      
      const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6d28d9; margin: 0;">🌌 Midnightwish</h1>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0; color: #0f172a;">It's precisely Midnight!</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #475569;">
            This is your reminder for <strong>${wish.name}</strong>. It is exactly 12:00 AM right now in their local timezone (${wish.country}).
          </p>
          <div style="background: white; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
            <h3 style="margin: 0 0 5px 0;">Event: ${wish.event}</h3>
            <p style="margin: 0; color: #64748b;">${wish.date}</p>
          </div>
          <p style="font-size: 16px; margin-bottom: 0;">Don't forget to reach out and make their day special!</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
          You received this alert because you configured a tracker in your Midnightwish universe.<br/>
          Built for cross-timezone temporal synchronization.
        </p>
      </div>`;

      try {
        await resend.emails.send({
          from: "reminders@midnightwish.chayjuturi.com",
          to: userEmail,
          subject: `Midnightwish: Say Happy ${wish.event} to ${wish.name}!`,
          html: emailHtml
        });
        sentCount++;
      } catch (err) {
        console.error("Resend delivery failed:", err);
      }
    }
  }

  return NextResponse.json({ 
    status: "success", 
    wishesProcessed: sentCount,
    timestamp: new Date().toISOString()
  });
}
