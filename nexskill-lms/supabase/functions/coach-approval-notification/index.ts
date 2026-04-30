import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received Webhook Payload:", JSON.stringify(payload, null, 2));

    // The 'record' contains the data from the 'coach_profiles' table (inserted row)
    const { record } = payload;
    
    if (!record) {
      console.error("No record found in payload");
      return new Response(JSON.stringify({ error: "No record found in payload" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Setup Nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Deno.env.get("GMAIL_USER"),
        pass: Deno.env.get("GMAIL_APP_PASSWORD"),
      },
    });

    // Format the registration date
    const regDate = new Date(record.created_at).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";

    // Send the notification email to the Admin
    const info = await transporter.sendMail({
      from: `"NexSkill System" <${Deno.env.get("GMAIL_USER")}>`,
      to: adminEmail,
      subject: "🚨 ACTION REQUIRED: New Coach Pending Approval",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #d32f2f; border-bottom: 2px solid #f5f5f5; padding-bottom: 10px;">New Coach Registration</h2>
          <p>A new coach has registered and is currently <strong>Pending Approval</strong>.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #304DB5; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Coach Name:</strong> ${record.full_name || 'Not provided'}</p>
            <p style="margin: 5px 0;"><strong>Email Address:</strong> ${record.email}</p>
            <p style="margin: 5px 0;"><strong>Registration Date:</strong> ${regDate}</p>
          </div>
          
          <p>Please log in to the admin dashboard to review their credentials and approve the account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/admin/coaches" 
               style="background: #304DB5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Review Application
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated system notification from NexSkill LMS.
          </p>
        </div>
      `,
    });

    console.log("Admin notification sent:", info.messageId);

    return new Response(JSON.stringify({ message: "Admin notified successfully", messageId: info.messageId }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err) {
    console.error("Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
