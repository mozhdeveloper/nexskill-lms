import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/coach-pending', async (req, res) => {
  console.log("📩 Webhook Received!");
  
  try {
    // In Express, we use req.body directly
    const record = req.body.record || req.body;
    
    console.log("📦 Payload Record:", JSON.stringify(record, null, 2));

    if (!record || !record.email) {
      console.error("❌ Error: No email found in the record.");
      return res.status(400).json({ success: false, error: 'No email found in payload' });
    }

    if (record.role !== 'coach') {
      console.log("ℹ️ Skipping: User is not a coach.");
      return res.status(200).json({ success: true, message: 'Not a coach, skipping email.' });
    }

    // SMTP Config
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const fullName = `${record.first_name || ''} ${record.middle_name || ''} ${record.last_name || ''}`.trim() || 'Coach';

    const mailOptions = {
      from: `"NexSkill LMS" <${process.env.GMAIL_USER}>`,
      to: record.email,
      subject: 'Your NexSkill Coach Account is Pending Approval',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #22c55d; color: white; padding: 20px; text-align: center;">
            <h1 style="font-size: 50px;">NexSkill</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Hello ${fullName},</h2>
            <p>Your registration was successful! Your account is currently <strong>PENDING APPROVAL</strong> by our admin team.</p>
            <p>Please wait for a notification email once your account has been reviewed.</p>
            <p><strong>Registered Email:</strong> ${record.email}</p>
            <br/>
            <p>Best regards,<br/>The NexSkill Team</p>
          </div>
        </div>
      `,
    };

    console.log(`📧 Attempting to send email to: ${record.email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email Sent Successfully:', info.messageId);

    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('❌ Nodemailer Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
