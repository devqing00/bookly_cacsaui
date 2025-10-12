# WhatsApp Integration Guide

## Overview
The manual sender system now supports sending event badges and confirmation details via WhatsApp for users who may have incorrect email addresses but valid phone numbers.

---

## Features

### 1. Manual Email/WhatsApp Sender Page
- **Route:** `/admin/manual-send`
- **Purpose:** Admin interface to manually send confirmations via email or WhatsApp
- **Search Methods:** 
  - By Email Address
  - By Phone Number

### 2. WhatsApp Sending API
- **Endpoint:** `POST /api/admin/send-whatsapp`
- **Functionality:** Sends badge PDF and event details via WhatsApp

---

## WhatsApp API Setup

### Supported Providers

The system is designed to work with various WhatsApp API providers. Here are the main options:

#### Option 1: Twilio WhatsApp API (Recommended)
**Setup:**
1. Create a Twilio account at https://www.twilio.com
2. Enable WhatsApp messaging
3. Get your credentials

**Environment Variables:**
```bash
WHATSAPP_API_URL=https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
WHATSAPP_API_KEY=your_twilio_auth_token
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Twilio sandbox number
```

**Note:** Twilio uses a different API format. You'll need to modify the API call in the route.

#### Option 2: WhatsApp Business API (Official)
**Requirements:**
- Facebook Business Manager account
- Verified business
- Approved phone number

**Environment Variables:**
```bash
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/{phone-number-id}/messages
WHATSAPP_API_KEY=your_permanent_access_token
```

#### Option 3: Third-Party Providers
- **WATI** (https://www.wati.io)
- **Interakt** (https://www.interakt.shop)
- **MessageBird** (https://www.messagebird.com)
- **360Dialog** (https://www.360dialog.com)

---

## Configuration

### 1. Add Environment Variables

Create or update your `.env.local` file:

```bash
# WhatsApp Configuration
WHATSAPP_API_URL=your_whatsapp_api_endpoint
WHATSAPP_API_KEY=your_api_key_or_token

# Optional: Provider-specific variables
TWILIO_ACCOUNT_SID=your_sid
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
```

### 2. Without WhatsApp API (Development Mode)

If you don't configure the WhatsApp API, the system will:
- Generate the badge PDF successfully
- Return a success response with preview data
- Log what would have been sent (for testing)

---

## API Reference

### Send WhatsApp Message

**Endpoint:** `POST /api/admin/send-whatsapp`

**Request Body:**
```json
{
  "phone": "+234 XXX XXX XXXX",
  "email": "fallback@example.com"  // Optional: used if phone lookup fails
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "messageId": "wamid.XXX",
  "attendee": {
    "name": "John Doe",
    "phone": "+234 XXX XXX XXXX",
    "tableNumber": 5,
    "tent": 2,
    "tableName": "El Roi 2 – The God Who Sees",
    "seatNumber": 3
  }
}
```

**Development Mode Response (No API configured):**
```json
{
  "success": true,
  "message": "WhatsApp API not configured. In production, message would be sent.",
  "devInfo": {
    "to": "+234 XXX XXX XXXX",
    "messagePreview": "🎉 *CACSAUI Love Feast 2025*...",
    "badgeGenerated": true,
    "attendee": { ... }
  }
}
```

### Preview WhatsApp Message

**Endpoint:** `GET /api/admin/send-whatsapp?phone=XXX` or `?email=XXX`

**Response:**
```json
{
  "success": true,
  "preview": {
    "to": "+234 XXX XXX XXXX",
    "message": "Hello John!\n\nYour CACSAUI Love Feast...",
    "attendee": { ... }
  }
}
```

---

## Message Format

The WhatsApp message includes:

```
🎉 *CACSAUI Love Feast 2025*

Hello [Name]! 👋

Your registration is confirmed! Here are your details:

📋 *Event Details:*
━━━━━━━━━━━━━━━━
🏛️ Table: [Table Name]
🎪 Tent: [Number]
💺 Seat Number: [Number]

📅 *Event Information:*
━━━━━━━━━━━━━━━━
📍 Venue: [Event Location]
📆 Date: [Event Date]
🕐 Time: [Event Time]

⚠️ *Important Instructions:*
━━━━━━━━━━━━━━━━
✅ Please download and save your badge (attached)
✅ Show your badge QR code at the entrance
✅ Arrive 30 minutes before the event
✅ Keep this message for reference

Your personalized badge with QR code is attached to this message.

See you at the Love Feast! 🍽️✨

_CACSAUI Love Feast Team_
```

**Attachment:** PDF badge with QR code

---

## Frontend Usage

### Manual Send Page

Access at: **`/admin/manual-send`**

**Features:**
1. **Search Toggle:** Switch between email and phone search
2. **User Lookup:** Find registered users
3. **Send Email:** Resend confirmation email
4. **Send WhatsApp:** Send badge via WhatsApp

**UI Elements:**
- Search type selector (Email/Phone)
- Input field with auto-complete
- User information display card
- Dual action buttons (Email & WhatsApp)
- Status indicators
- Instructions and use cases

---

## Use Cases

### 1. Wrong Email Address
**Scenario:** User provided incorrect email during registration

**Solution:**
1. Search by phone number
2. Verify user details
3. Send badge via WhatsApp

### 2. Email Not Received
**Scenario:** Email went to spam or failed to send

**Solutions:**
- Resend via email
- Send via WhatsApp as alternative

### 3. Lost Badge
**Scenario:** User deleted confirmation email

**Solution:**
- Search by email or phone
- Resend via preferred method

### 4. Phone-Only Registration
**Scenario:** User has unreliable email but good WhatsApp

**Solution:**
- Primary delivery via WhatsApp
- Email as backup

---

## Customization

### Update Event Details

Edit the message in `/api/admin/send-whatsapp/route.ts`:

```typescript
const message = `
🎉 *CACSAUI Love Feast 2025*
...
📍 Venue: YOUR_VENUE_HERE
📆 Date: YOUR_DATE_HERE
🕐 Time: YOUR_TIME_HERE
...
`;
```

### Modify Badge Design

The badge is generated using `/lib/badgeGenerator.ts`. Customize:
- Colors
- Layout
- QR code styling
- Trophy/logo

---

## Twilio Integration (Specific Setup)

If using Twilio, modify the API call in `route.ts`:

```typescript
// Replace the existing whatsappResponse fetch with:
const whatsappResponse = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.WHATSAPP_API_KEY}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      To: `whatsapp:${attendee.phone}`,
      Body: message,
      MediaUrl: `data:application/pdf;base64,${base64PDF}`,
    }),
  }
);
```

---

## WhatsApp Business API Integration

For official WhatsApp Business API:

```typescript
const whatsappResponse = await fetch(
  `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: attendee.phone.replace(/[^0-9]/g, ''),
      type: 'document',
      document: {
        filename: `CACSAUI_LoveFeast_Badge_${attendee.name.replace(/\s+/g, '_')}.pdf`,
        caption: message,
        link: `data:application/pdf;base64,${base64PDF}`,
      },
    }),
  }
);
```

---

## Testing

### Test Without API (Development)

1. Don't set `WHATSAPP_API_URL` in `.env.local`
2. Use the manual send page
3. System will simulate sending and return preview data

### Test With API (Production)

1. Configure environment variables
2. Use sandbox numbers if available (Twilio)
3. Start with your own phone number
4. Verify badge PDF attachment
5. Check message formatting

### Manual Testing Script

```bash
# Test user lookup by phone
curl "http://localhost:3000/api/admin/send-whatsapp?phone=%2B234XXXXXXXXX"

# Test WhatsApp sending
curl -X POST http://localhost:3000/api/admin/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+234XXXXXXXXX"}'
```

---

## Troubleshooting

### Badge Not Generating
**Issue:** PDF generation fails

**Solutions:**
- Check if fonts are loaded correctly
- Verify badgeGenerator.ts has no errors
- Check server logs for specific errors

### WhatsApp Not Sending
**Issue:** API returns error

**Check:**
1. Environment variables are set correctly
2. Phone number format is correct (E.164 format)
3. API credentials are valid
4. Account has sufficient credits/quota
5. Phone number is opted-in (for Business API)

### Phone Number Format Issues
**Issue:** User not found by phone

**Solution:**
- System normalizes phone numbers by removing spaces, dashes, parentheses
- Ensure database phone numbers are stored consistently
- Test with different formats: `+234XXX`, `234XXX`, `0XXX`

### Development Mode Not Working
**Issue:** Getting production errors in dev

**Solution:**
- Ensure `WHATSAPP_API_URL` is NOT set in `.env.local` for dev mode
- Check console logs for detailed error messages
- Verify badge generation works independently

---

## Security Considerations

1. **Rate Limiting:** Implement rate limits to prevent abuse
2. **Authentication:** Add admin authentication to manual send page
3. **Phone Validation:** Validate phone numbers before sending
4. **Cost Monitoring:** Track WhatsApp API usage (messages cost money)
5. **Error Logging:** Log failures for audit trail
6. **Personal Data:** Handle phone numbers securely (GDPR/privacy)

### Recommended: Add Authentication

```typescript
// In route.ts
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ... rest of code
}
```

---

## Cost Estimation

### Typical Pricing (as of 2025)

| Provider | Cost per Message | Notes |
|----------|------------------|-------|
| Twilio | $0.005 - $0.01 | Varies by country |
| WhatsApp Business API | $0.005 - $0.02 | First 1000/month free |
| Third-Party | $0.01 - $0.05 | Varies widely |

**For 200 attendees:** ~$1 - $10 depending on provider

---

## Future Enhancements

1. **Bulk Sending:** Send to multiple users at once
2. **Scheduled Messages:** Schedule reminders before event
3. **Message Templates:** Pre-approved templates for Business API
4. **Read Receipts:** Track if messages were read
5. **Interactive Messages:** Buttons for RSVP confirmation
6. **Automated Reminders:** Day-before event reminders
7. **Status Webhooks:** Real-time delivery status updates

---

## Support & Documentation

### Additional Resources
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Badge Generator Code](/src/lib/badgeGenerator.ts)
- [Manual Send Page](/src/app/admin/manual-send/page.tsx)

### Getting Help
For issues or questions:
1. Check server logs for detailed errors
2. Verify environment configuration
3. Test with preview endpoint first
4. Contact your WhatsApp API provider support

---

## Quick Start Checklist

- [ ] Choose WhatsApp API provider
- [ ] Create provider account
- [ ] Get API credentials
- [ ] Add environment variables to `.env.local`
- [ ] Test in development mode first
- [ ] Send test message to your own phone
- [ ] Update event details in message template
- [ ] Add authentication to admin routes
- [ ] Set up error monitoring
- [ ] Configure rate limiting
- [ ] Train admins on manual send page
- [ ] Document your specific provider setup

---

## Example: Complete Twilio Setup

### 1. Install Twilio SDK (Optional)
```bash
npm install twilio
```

### 2. Environment Variables
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. Modified Route
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In POST handler:
await client.messages.create({
  from: process.env.TWILIO_WHATSAPP_FROM,
  to: `whatsapp:${attendee.phone}`,
  body: message,
  mediaUrl: [`data:application/pdf;base64,${base64PDF}`],
});
```

---

**Last Updated:** October 12, 2025
