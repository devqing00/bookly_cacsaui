# 🎯 Check-In System - Visual Flow Diagrams

---

## 📱 Complete Check-In Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION PHASE (Before Event)                    │
└─────────────────────────────────────────────────────────────────────────┘

    User                    Frontend                    Backend/Database
     │                         │                              │
     │  Opens website          │                              │
     ├────────────────────────>│                              │
     │                         │                              │
     │  Fills registration     │                              │
     │  (Name, Email, Phone)   │                              │
     ├────────────────────────>│                              │
     │                         │                              │
     │                         │  POST /api/register          │
     │                         ├─────────────────────────────>│
     │                         │                              │
     │                         │  Assign Table & Seat         │
     │                         │<─────────────────────────────┤
     │                         │  {table: 5, seat: 3}         │
     │                         │                              │
     │  ✅ Confirmation page   │                              │
     │<────────────────────────┤                              │
     │  with QR code           │                              │
     │                         │                              │
     │  [Downloads/Saves QR]   │                              │
     │                         │                              │

┌─────────────────────────────────────────────────────────────────────────┐
│                    EVENT DAY (Check-In Process)                         │
└─────────────────────────────────────────────────────────────────────────┘

    Attendee                Check-In Staff              Backend/Database
     │                         │                              │
     │  Arrives at venue       │                              │
     │  Shows QR code/Email    │                              │
     ├────────────────────────>│                              │
     │                         │                              │
     │                         │  Opens /check-in page        │
     │                         │  Enables camera              │
     │                         │                              │
     │  QR Code displayed      │  Scans QR code               │
     ├────────────────────────>│  Extracts email              │
     │                         │                              │
     │                         │  POST /api/check-in          │
     │                         │  {email: "..."}              │
     │                         ├─────────────────────────────>│
     │                         │                              │
     │                         │  Finds attendee              │
     │                         │  Validates not deleted       │
     │                         │  Checks not already in       │
     │                         │<─────────────────────────────┤
     │                         │                              │
     │                         │  Updates: checkedIn = true   │
     │                         │  Adds: checkedInAt timestamp │
     │                         │<─────────────────────────────┤
     │                         │                              │
     │  ✅ "Welcome John!"     │  Success toast shows         │
     │<────────────────────────┤  Name, Table, Seat           │
     │                         │                              │
     │  Enters event           │  Ready for next person       │
     │                         │                              │
```

---

## 🔄 Check-In API Internal Flow

```
POST /api/check-in
{ "email": "john@example.com" }
         │
         ▼
┌─────────────────────────┐
│ 1. Validate Input       │
│    ✓ Email provided?    │
└────────┬────────────────┘
         │ YES
         ▼
┌─────────────────────────┐
│ 2. Search Database      │
│    Loop through tables  │
│    Find matching email  │
└────────┬────────────────┘
         │ FOUND
         ▼
┌─────────────────────────┐
│ 3. Check Status         │
│    ✓ Not deleted?       │
│    ✓ Not checked in?    │
└────────┬────────────────┘
         │ VALID
         ▼
┌─────────────────────────┐
│ 4. Update Record        │
│    checkedIn = true     │
│    checkedInAt = now()  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 5. Log Activity         │
│    POST /activity-log   │
│    action: "check-in"   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 6. Return Success       │
│    {success: true,      │
│     attendee: {...}}    │
└─────────────────────────┘
```

---

## 📊 Database Structure During Check-In

### Before Check-In:
```javascript
// Firestore: /tables/TABLE_ID
{
  tableNumber: 5,
  attendees: [
    {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      gender: "Male",
      checkedIn: false,        // ← Not checked in
      checkedInAt: null,       // ← No timestamp
      deleted: false,
      registeredAt: "2025-10-01T10:00:00Z"
    }
  ]
}
```

### After Check-In:
```javascript
// Firestore: /tables/TABLE_ID
{
  tableNumber: 5,
  attendees: [
    {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      gender: "Male",
      checkedIn: true,         // ← ✅ Updated
      checkedInAt: {           // ← ✅ Timestamp added
        seconds: 1728138600,
        nanoseconds: 0
      },
      deleted: false,
      registeredAt: "2025-10-01T10:00:00Z"
    }
  ]
}

// Firestore: /activity_logs/AUTO_ID
{
  action: "check-in",
  performedBy: "admin",
  targetUser: "john@example.com",
  attendeeName: "John Doe",
  attendeeEmail: "john@example.com",
  tableNumber: 5,
  seatNumber: 1,
  details: "Attendee checked in at event",
  timestamp: {
    seconds: 1728138600,
    nanoseconds: 0
  }
}
```

---

## 🎨 Check-In Page State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                    CHECK-IN PAGE STATES                      │
└──────────────────────────────────────────────────────────────┘

        INITIAL STATE
             │
             ▼
    ┌────────────────┐
    │   IDLE MODE    │
    │  Choose method │
    └────┬──────┬────┘
         │      │
    SCANNER  MANUAL
         │      │
         ▼      ▼
┌──────────┐  ┌──────────┐
│ SCANNING │  │ ENTERING │
│  Camera  │  │  Email   │
│  Active  │  │          │
└────┬─────┘  └────┬─────┘
     │             │
     │ QR Detected│ Submit Form
     │             │
     └──────┬──────┘
            ▼
    ┌────────────────┐
    │  PROCESSING    │
    │  API Call      │
    └────┬──────┬────┘
         │      │
    SUCCESS  ERROR
         │      │
         ▼      ▼
┌──────────┐  ┌──────────┐
│ SUCCESS  │  │  ERROR   │
│ Display  │  │  Toast   │
│ Toast    │  │  Message │
└────┬─────┘  └────┬─────┘
     │             │
     │ 3s delay    │ Retry
     │             │
     └──────┬──────┘
            ▼
      BACK TO IDLE
```

---

## 📸 QR Code Scanner Visual

```
┌─────────────────────────────────────────────────────────┐
│  📷 QR Code Scanner Active                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    ┌─────────────────────────────────────────┐        │
│    │                                         │        │
│    │          ┌───────────────┐              │        │
│    │          │               │              │        │
│    │          │   █ █ █ █ █   │              │        │
│    │   [LIVE  │   █       █   │  CAMERA]     │        │
│    │          │   █   QR  █   │              │        │
│    │   [VIDEO │   █       █   │  FEED]       │        │
│    │          │   █ █ █ █ █   │              │        │
│    │          │               │              │        │
│    │          └───────────────┘              │        │
│    │         Point at QR code                │        │
│    │                                         │        │
│    └─────────────────────────────────────────┘        │
│                                                         │
│    ┌───────────────┐  ┌──────────────────┐           │
│    │ Stop Scanner  │  │ Manual Check-In  │           │
│    └───────────────┘  └──────────────────┘           │
│                                                         │
│    ✅ Last Check-In: John Doe                          │
│    📧 john@example.com                                 │
│    🪑 Table 5, Seat 3                                  │
│    ⏰ 2 minutes ago                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Manual Entry Visual

```
┌─────────────────────────────────────────────────────────┐
│  ✉️ Manual Check-In                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    Email Address                                        │
│    ┌─────────────────────────────────────────────┐    │
│    │ john.doe@example.com                        │    │
│    └─────────────────────────────────────────────┘    │
│                                                         │
│    ┌───────────────┐  ┌──────────────────┐           │
│    │   Check In    │  │  QR Scanner      │           │
│    └───────────────┘  └──────────────────┘           │
│                                                         │
│    ✅ Last Check-In: Jane Smith                        │
│    📧 jane@example.com                                 │
│    🪑 Table 3, Seat 2                                  │
│    ⏰ Just now                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔔 Toast Notifications

### Success Toast:
```
┌─────────────────────────────────────┐
│ ✅ Success                          │
│                                     │
│ John Doe checked in successfully!   │
│ Table 5, Seat 3                     │
└─────────────────────────────────────┘
```

### Already Checked In:
```
┌─────────────────────────────────────┐
│ ⚠️ Warning                          │
│                                     │
│ John Doe already checked in         │
│ at 2:30 PM                          │
└─────────────────────────────────────┘
```

### Not Found:
```
┌─────────────────────────────────────┐
│ ❌ Error                            │
│                                     │
│ Registration not found              │
│ Please verify email address         │
└─────────────────────────────────────┘
```

---

## 📈 Admin Dashboard Stats

```
┌────────────────────────────────────────────────────────────┐
│  Admin Dashboard - Check-In Statistics                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  📊 Total    │  │  ✅ Checked  │  │  ⏳ Pending  │   │
│  │  Registered  │  │  In          │  │  Check-In    │   │
│  │              │  │              │  │              │   │
│  │     150      │  │      87      │  │      63      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                            │
│  Check-In Progress:  ██████████░░░░░░ 58%                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow (CURRENT - INSECURE)

```
❌ CURRENT STATE - NO PROTECTION

Public User                Activity Log API
     │                           │
     │  GET /api/activity-log    │
     ├──────────────────────────>│
     │                           │
     │  ✅ Returns ALL logs      │  ← Anyone can see!
     │<──────────────────────────┤
     │                           │

Public User                Activity Log Page
     │                           │
     │  Visit /activity-log      │
     ├──────────────────────────>│
     │                           │
     │  ✅ Shows page            │  ← No login required!
     │<──────────────────────────┤
     │                           │
```

---

## 🔒 Security Flow (PROPOSED - SECURE)

```
✅ PROPOSED STATE - PROTECTED

Admin User                 Activity Log API
     │                           │
     │  GET /api/activity-log    │
     ├──────────────────────────>│
     │                           │
     │  Check session cookie     │
     │                           ├─────> Cookie exists?
     │                           │       Valid session?
     │                           │
     │  ✅ Authorized            │
     │  Returns logs             │
     │<──────────────────────────┤
     │                           │

Unauthorized User          Activity Log API
     │                           │
     │  GET /api/activity-log    │
     ├──────────────────────────>│
     │                           │
     │  No session cookie        │
     │                           ├─────> Not authenticated
     │                           │
     │  ❌ 401 Unauthorized      │
     │<──────────────────────────┤
     │                           │
```

---

## 🎯 Check-In Success Criteria

### Attendee Can Be Checked In If:
- ✅ Email exists in database
- ✅ Not marked as deleted
- ✅ Not already checked in
- ✅ Valid registration data

### Check-In Fails If:
- ❌ Email not found
- ❌ Already checked in
- ❌ Registration deleted
- ❌ Invalid email format

---

## 📱 Mobile Check-In Experience

```
iPhone / Android Device View:

┌───────────────────┐
│  📷 Event Check-In│
├───────────────────┤
│                   │
│  ┌─────────────┐ │
│  │             │ │
│  │   [Camera]  │ │
│  │             │ │
│  └─────────────┘ │
│                   │
│  [Stop Scanning] │
│  [Manual Entry]  │
│                   │
│  ✅ Last:         │
│  John Doe        │
│  Table 5, Seat 3 │
│                   │
│  [Back to Admin] │
│                   │
└───────────────────┘
```

---

## 🎉 Complete Check-In Timeline

```
Registration → Confirmation → Event Day → Check-In → Activity Log

    Day 1           Day 1        Day 30      Day 30      Day 30
      │               │             │           │           │
      ▼               ▼             ▼           ▼           ▼
  User registers  Gets QR code  Shows QR    Scanned     Logged
  Online form     Email sent     at venue    by staff    in system
      │               │             │           │           │
      └───────────────┴─────────────┴───────────┴───────────┘
               checkedIn: false → checkedIn: true
```

---

This visual guide shows exactly how the check-in system works from start to finish! 🎯

