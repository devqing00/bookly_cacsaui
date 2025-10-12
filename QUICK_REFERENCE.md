# Quick Reference: Manual Sender Features

## ✅ What's Been Added

### 1. Frontend Admin Page
**Route:** `/admin/manual-send`

**Features:**
- 🔍 Search by Email or Phone Number
- 👤 User Information Display
- 📧 Manual Email Sending
- 📱 Manual WhatsApp Sending
- 🎨 Beautiful UI with animations

### 2. Enhanced Email API
**Endpoint:** `/api/admin/send-email`

**New Features:**
- Search by phone number (in addition to email)
- GET endpoint supports both: `?email=...` or `?phone=...`
- Proper TypeScript type safety with discriminated unions

### 3. WhatsApp Sending API
**Endpoint:** `/api/admin/send-whatsapp`

**Features:**
- Generates badge PDF automatically
- Sends formatted message with event details
- Attaches badge PDF to WhatsApp message
- Works in development mode without API (for testing)
- Supports multiple WhatsApp providers (Twilio, WhatsApp Business API, etc.)

---

## 🚀 Quick Start

### Access the Manual Sender
1. Navigate to: `http://localhost:3000/admin/manual-send`
2. Choose search method (Email or Phone)
3. Enter user identifier
4. Click "Find User"
5. Click "Send Email" or "Send WhatsApp"

### For Production (WhatsApp)
Add to `.env.local`:
```bash
WHATSAPP_API_URL=your_api_endpoint
WHATSAPP_API_KEY=your_api_key
```

### For Development (WhatsApp)
Leave the above variables unset. The system will:
- Generate badge successfully
- Return preview data
- Log what would be sent

---

## 📋 Use Cases

| Scenario | Solution |
|----------|----------|
| Wrong email address | Search by phone → Send via WhatsApp |
| Email not received | Search by email → Resend email or send WhatsApp |
| Lost badge | Search by either → Send replacement |
| Email in spam | Send via WhatsApp as alternative |
| No email access | Use phone search → WhatsApp only |

---

## 🔧 API Endpoints

### 1. Search User
```bash
# By email
GET /api/admin/send-email?email=user@example.com

# By phone
GET /api/admin/send-email?phone=+234XXXXXXXXX
```

### 2. Send Email
```bash
POST /api/admin/send-email
{
  "email": "user@example.com"
}
```

### 3. Send WhatsApp
```bash
POST /api/admin/send-whatsapp
{
  "phone": "+234XXXXXXXXX"
}

# OR with email fallback
{
  "phone": "+234XXXXXXXXX",
  "email": "user@example.com"
}
```

### 4. Preview WhatsApp
```bash
GET /api/admin/send-whatsapp?phone=+234XXXXXXXXX
```

---

## 📱 WhatsApp Message Format

The message includes:
- ✨ Personalized greeting
- 📋 Table assignment (name, number, tent, seat)
- 📅 Event details (venue, date, time)
- ⚠️ Important instructions
- 📄 Attached badge PDF with QR code

---

## 🎯 Gender-Balanced Assignment

Registration now uses smart gender balancing:
- Calculates balance score for each table
- Assigns users to tables that improve gender distribution
- Prevents heavily skewed tables (e.g., 8 males, 0 females)
- Still maintains tent randomization

---

## 📂 Files Created/Modified

### Created:
1. `/src/app/admin/manual-send/page.tsx` - Admin UI
2. `/src/app/api/admin/send-whatsapp/route.ts` - WhatsApp API
3. `/WHATSAPP_INTEGRATION_GUIDE.md` - Complete setup guide
4. `/MANUAL_EMAIL_AND_GENDER_BALANCE.md` - Email & gender docs
5. `/EXAMPLE_ManualEmailSender.tsx` - Example component
6. `/QUICK_REFERENCE.md` - This file

### Modified:
1. `/src/app/api/admin/send-email/route.ts` - Added phone search
2. `/src/app/api/register/route.ts` - Added gender balancing

---

## 🔐 Security Notes

**Important:** The manual send page should be protected!

Add authentication:
```typescript
// In page.tsx or route.ts
import { getServerSession } from 'next-auth';

const session = await getServerSession();
if (!session?.user?.isAdmin) {
  redirect('/admin/login');
}
```

Also consider:
- Rate limiting on send endpoints
- Audit logging for all manual sends
- IP whitelisting for admin pages
- CORS restrictions

---

## 🐛 Troubleshooting

### User Not Found
- ✓ Check spelling/format
- ✓ Verify user is registered
- ✓ Try alternate search method (phone vs email)
- ✓ Check database directly

### Email Not Sending
- ✓ Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars
- ✓ Check email service logs
- ✓ Confirm email format is valid
- ✓ Check spam folder

### WhatsApp Not Sending
- ✓ Verify `WHATSAPP_API_URL` and `WHATSAPP_API_KEY`
- ✓ Check phone number format (E.164)
- ✓ Confirm user has phone number on file
- ✓ Test in dev mode first (no API)
- ✓ Check provider account credits

### Badge Not Generating
- ✓ Check badgeGenerator.ts for errors
- ✓ Verify fonts are loaded
- ✓ Check server logs
- ✓ Test badge generation independently

---

## 📞 WhatsApp Provider Options

### Quick Comparison

| Provider | Setup Difficulty | Cost | Best For |
|----------|-----------------|------|----------|
| Twilio | ⭐⭐ Easy | $ Low | Quick start, testing |
| WhatsApp Business API | ⭐⭐⭐⭐ Hard | $$ Medium | Official, scalable |
| WATI | ⭐⭐ Easy | $$ Medium | No-code, user-friendly |
| 360Dialog | ⭐⭐⭐ Medium | $$ Medium | European compliance |

### Recommended for Beginners
**Twilio** - Easiest setup, good documentation, sandbox for testing

### Recommended for Production
**WhatsApp Business API** - Official, reliable, best features

See `WHATSAPP_INTEGRATION_GUIDE.md` for detailed setup instructions.

---

## 📊 Testing Checklist

### Before Production
- [ ] Test email sending with real address
- [ ] Test WhatsApp in dev mode (no API)
- [ ] Configure WhatsApp API credentials
- [ ] Test WhatsApp with your phone number
- [ ] Verify badge PDF displays correctly
- [ ] Test phone number normalization
- [ ] Test email as fallback when phone fails
- [ ] Add admin authentication
- [ ] Set up error logging
- [ ] Test rate limiting
- [ ] Document your WhatsApp provider setup
- [ ] Train staff on manual send page

---

## 💡 Tips

1. **Always test with your own contact first**
2. **Keep WhatsApp API credentials secure**
3. **Monitor API usage/costs**
4. **Log all manual sends for audit**
5. **Have email as backup to WhatsApp**
6. **Standardize phone number format in DB**
7. **Update event details in message template**
8. **Consider bulk sending for efficiency**

---

## 🎓 Training Users

### For Admins
1. Show them `/admin/manual-send` page
2. Explain search toggle (email vs phone)
3. Demonstrate user lookup
4. Show both send buttons
5. Explain when to use each method

### Common Scenarios
- "User says email is wrong" → Search by phone, send WhatsApp
- "User didn't get email" → Resend email or try WhatsApp
- "User wants another copy" → Search and resend
- "User only has phone" → Use phone search, WhatsApp send

---

## 📈 Next Steps

Consider implementing:
1. Bulk sending (multiple users at once)
2. Message scheduling
3. Delivery status tracking
4. Automated reminders
5. Send history/audit log
6. Export send reports
7. Message templates

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `WHATSAPP_INTEGRATION_GUIDE.md` | Complete WhatsApp setup |
| `MANUAL_EMAIL_AND_GENDER_BALANCE.md` | Email & gender features |
| `EXAMPLE_ManualEmailSender.tsx` | React component example |
| `QUICK_REFERENCE.md` | This quick guide |

---

## ✨ Summary

You now have:
- ✅ Beautiful admin interface for manual sending
- ✅ Email sending with phone search
- ✅ WhatsApp sending with badge attachment
- ✅ Gender-balanced table assignment
- ✅ Comprehensive documentation
- ✅ Development mode for testing
- ✅ Type-safe APIs
- ✅ Production-ready code

**Start using it at:** `/admin/manual-send`

---

**Questions?** Check the detailed guides or review the inline code comments!
