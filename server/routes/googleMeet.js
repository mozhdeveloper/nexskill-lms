import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();
console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// For local development, set credentials directly
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback'
);

// 1. Generate Auth URL (Coach needs to authorize their calendar)
router.get('/auth', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.json({ url });
});

// 2. Callback for OAuth
router.get('/callback', async (req, res) => {
  const code = req.query.code || new URLSearchParams(req.url.split('?')[1]).get('code');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Encode tokens and send to frontend as URL param
    const encoded = encodeURIComponent(JSON.stringify(tokens));
    res.redirect(`http://localhost:5173/coach/coaching-tools?google_tokens=${encoded}`);
  } catch (error) {
    console.error('OAuth Error:', error.message, error.response?.data);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// 3. Create Meeting Link
router.post('/create-meeting', async (req, res) => {
  const { tokens, title, startTime, durationMinutes } = req.body;
  
  if (!tokens) {
    return res.status(401).json({ error: 'Google authentication tokens required' });
  }

  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000);

  const event = {
    summary: title,
    description: 'Group Coaching Session via NexSkill LMS',
    start: {
      dateTime: startTime,
      timeZone: 'Asia/Manila',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Asia/Manila',
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    res.json({ 
      meetingLink: response.data.hangoutLink,
      eventId: response.data.id
    });
  } catch (error) {
    console.error('Google Calendar API Error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

export default router;
