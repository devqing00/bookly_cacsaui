# Manual Email Sending & Gender-Balanced Assignment

## Overview
This document describes two new features added to the event registration system:
1. **Manual Email Sending API** - Allows admins to resend confirmation emails to existing users
2. **Gender-Balanced Table Assignment** - Ensures equal gender distribution across all tables

---

## 1. Manual Email Sending API

### Endpoint
`POST /api/admin/send-email`

### Purpose
Allows administrators to manually send confirmation emails to users who are already registered in the system. Useful for:
- Resending emails if the original failed
- Sending emails to users registered through other means
- Testing email functionality

### Request
```json
POST /api/admin/send-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "message-id-from-email-service",
  "attendee": {
    "name": "John Doe",
    "email": "user@example.com",
    "tableNumber": 5,
    "tent": 2,
    "tableName": "El Roi 2 – The God Who Sees",
    "seatNumber": 3
  }
}
```

### Response (User Not Found)
```json
{
  "success": false,
  "error": "User not found with this email address"
}
```

### Additional GET Endpoint
`GET /api/admin/send-email?email=user@example.com`

This endpoint fetches user details without sending an email, useful for:
- Verifying if a user exists
- Previewing user information before sending

---

## 2. Gender-Balanced Table Assignment

### How It Works

The registration system now uses a **gender balance scoring algorithm** instead of random assignment to ensure equal gender distribution across tables.

### Algorithm Details

1. **Balance Score Calculation**
   - For each table, the system calculates a "balance score" representing how evenly genders are distributed
   - Lower score = better balance
   - Formula: Variance of gender counts across Male, Female, Other, and "Prefer not to say"

2. **Assignment Process**
   ```
   a. Randomly select a tent (1, 2, or 3)
   b. Find all available tables in that tent
   c. Calculate balance score for each table if the new user were added
   d. Assign user to the table with the LOWEST balance score
   e. If tent is full, repeat for all tents using the same balance algorithm
   ```

### Example Scenarios

**Scenario 1: Empty Table**
- A new female registers
- Table has 0 attendees
- Balance score: Equal (first attendee)
- Result: Assigned to table

**Scenario 2: Imbalanced Table**
- Table A: 5 Males, 1 Female
- Table B: 3 Males, 3 Females
- New female registers
- Table A score (after adding): Higher variance
- Table B score (after adding): Lower variance
- Result: Female assigned to Table B for better balance

**Scenario 3: Multiple Options**
- Multiple tables available in tent
- System evaluates each table's balance
- Assigns to table that creates most balanced distribution

### Benefits

1. **Fair Distribution**: No table becomes heavily skewed toward one gender
2. **Better Social Mix**: Tables have diverse representation
3. **Predictable Outcomes**: Algorithm consistently chooses balanced options
4. **Fallback Logic**: Still maintains tent randomization for initial selection

### Code Location

The gender balancing logic is implemented in:
- File: `src/app/api/register/route.ts`
- Functions:
  - `calculateGenderBalanceScore()` - Computes balance score
  - `findBestTableForGenderBalance()` - Selects optimal table

---

## Usage Examples

### Sending Email via cURL
```bash
curl -X POST http://localhost:3000/api/admin/send-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Sending Email via JavaScript/Fetch
```javascript
async function sendEmailToUser(email) {
  const response = await fetch('/api/admin/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Email sent!', result.messageId);
  } else {
    console.error('Failed:', result.error);
  }
}

// Usage
sendEmailToUser('user@example.com');
```

### Integration with Admin UI
```javascript
// In your admin panel component
const handleResendEmail = async (userEmail) => {
  try {
    const response = await fetch('/api/admin/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success(`Email sent to ${data.attendee.name}`);
    } else {
      toast.error(data.error);
    }
  } catch (error) {
    toast.error('Failed to send email');
  }
};
```

---

## Security Considerations

### Email Sending Endpoint
- Should be protected with admin authentication
- Consider rate limiting to prevent abuse
- Validate email format before processing
- Log all email sending attempts for audit trail

### Recommended: Add Authentication Middleware
```typescript
// Example middleware
export async function POST(request: Request) {
  // Add authentication check
  const session = await getServerSession();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ... rest of the code
}
```

---

## Testing

### Test Gender Balancing
1. Register multiple users with different genders
2. Check table distributions in admin panel
3. Verify no table has extreme imbalance (e.g., 8-0)

### Test Email Sending
1. Register a test user
2. Call manual email endpoint with their email
3. Verify email receipt
4. Test with non-existent email (should return 404)
5. Test with invalid email format (should return 400)

---

## Monitoring & Analytics

### Metrics to Track
- Gender distribution across all tables
- Email success/failure rates
- Average balance scores per table
- Manual email resend frequency

### Potential Dashboard Queries
```typescript
// Get gender distribution stats
const stats = {
  totalMales: /* count */,
  totalFemales: /* count */,
  averageBalanceScore: /* calculate */,
  mostBalancedTable: /* find */,
  leastBalancedTable: /* find */
};
```

---

## Future Enhancements

1. **Bulk Email Sending**
   - Send to multiple users at once
   - Send to all users in a tent
   - Send to all users at a specific table

2. **Balance Threshold Settings**
   - Allow admins to configure acceptable imbalance levels
   - Optional: Force strict 50/50 balance

3. **Email Templates**
   - Multiple email templates for different scenarios
   - Custom messages for resend vs. initial send

4. **Balance Reporting**
   - Admin dashboard showing real-time balance metrics
   - Visual charts of gender distribution
   - Alerts when imbalance exceeds threshold

---

## Troubleshooting

### Email Not Sending
1. Check environment variables: `GMAIL_USER` and `GMAIL_APP_PASSWORD`
2. Verify user exists in database
3. Check server logs for SMTP errors
4. Ensure email service is not rate-limited

### Balance Not Working as Expected
1. Verify gender values match exactly: "Male", "Female", "Other", "Prefer not to say"
2. Check if multiple tables have same balance score (randomness in tie-breaking)
3. Review logs to see which table was selected and why

---

## API Reference Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/admin/send-email` | POST | Send email to user | Yes (recommended) |
| `/api/admin/send-email?email=...` | GET | Fetch user details | Yes (recommended) |
| `/api/register` | POST | Register new user (with gender balancing) | No |

---

## Change Log

### Version 1.0.0 (Current)
- ✅ Added manual email sending endpoint
- ✅ Implemented gender-balanced table assignment
- ✅ Added balance score calculation algorithm
- ✅ Updated registration flow to use gender balancing
- ✅ Type-safe discriminated union for user lookup

---

## Questions or Issues?

For questions about these features, contact the development team or refer to the inline code comments in:
- `src/app/api/admin/send-email/route.ts`
- `src/app/api/register/route.ts`
