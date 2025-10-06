# 🧪 TESTING GUIDE - How to Verify All Features

## Quick Start

```bash
npm run dev
```

Then visit: `http://localhost:3000`

---

## ✅ Feature Testing Checklist

### 1. Duplicate Registration Prevention

**Test Steps:**
1. Go to registration form
2. Enter name: `John Doe`
3. Enter email: `test@example.com`
4. Click "Register"
5. Wait for confirmation (should get Table 1, Seat 1)
6. Click "Register Another Person"
7. Enter name: `Jane Doe`
8. Enter email: `test@example.com` (same as before)
9. **Watch the email field** - Should show ⚠️ icon
10. **Look below form** - Should see amber warning box
11. **Check button text** - Should say "View My Registration"
12. Click the button

**Expected Results:**
- ✅ Email field shows amber/warning state
- ✅ Amber alert box appears with existing table info
- ✅ Button text changes
- ✅ Amber info toast appears: "Welcome back!"
- ✅ Shows existing Table 1, Seat 1
- ✅ "Already Registered" heading
- ✅ No new entry created in database

---

### 2. Toast Notifications

**Test Scenarios:**

#### A. Success Toast (New Registration)
1. Register with new email
2. **Expected**: Green toast saying "Welcome [Name]! You've been assigned to Table X"
3. **Duration**: 4 seconds, then auto-dismiss
4. **Features**: Close button visible

#### B. Info Toast (Existing User)
1. Register with existing email
2. **Expected**: Blue/info toast saying "Welcome back!"
3. **Duration**: 3 seconds

#### C. Error Toast (Invalid Email)
1. Enter invalid email: `notanemail`
2. Submit form
3. **Expected**: Red toast saying "Invalid email format"

#### D. Loading Toast
1. Submit valid registration
2. **Expected**: Gray toast with spinner: "Processing your registration..."
3. Should disappear when complete

#### E. Admin Toast
1. Open admin page: `/admin`
2. In another tab, register new user
3. **Expected**: Green toast in admin: "New registration received!"

---

### 3. Confetti Animation

**Test Steps:**
1. Register with NEW email (not existing)
2. **Watch the screen immediately after submission**

**Expected Results:**
- ✅ Confetti bursts from left side
- ✅ Confetti bursts from right side
- ✅ Green colors: #22c55e, #16a34a, #15803d, #86efac
- ✅ Lasts for 3 seconds
- ✅ Multiple bursts (every 250ms)
- ✅ Only triggers for NEW registrations
- ✅ No confetti for existing users

---

### 4. 3D Card Flip Animation

**Test Steps:**
1. Register new user
2. **Watch the table number card**

**Expected Results:**
- ✅ Card rotates: 0° → 180° → 360°
- ✅ Slight scale increase: 1 → 1.05 → 1
- ✅ Takes 0.8 seconds
- ✅ Smooth spring easing
- ✅ Maintains 3D perspective

---

### 5. Seat Visualization Animation

**Test Steps:**
1. Register user and get assigned to table
2. **Watch the 6 circles below table number**

**Expected Results:**
- ✅ Circles appear sequentially (not all at once)
- ✅ Each has 0.1s delay (stagger effect)
- ✅ Filled seats are green with person icon
- ✅ Empty seats are gray
- ✅ Text shows "X of 6 seats at your table"
- ✅ Spring animation (bouncy feel)

**Test Different Scenarios:**
- Seat 1: Shows 1 green, 5 gray
- Seat 3: Shows 3 green, 3 gray
- Seat 6: Shows 6 green, 0 gray

---

### 6. QR Code Generation

**Test Steps:**
1. Complete registration
2. Look for "Show QR Code for Check-in" button
3. Click it

**Expected Results:**
- ✅ Button expands smoothly
- ✅ QR code appears (180x180px)
- ✅ White background with padding
- ✅ Border around code
- ✅ Text: "Show this QR code at check-in"
- ✅ Button text changes to "Hide QR Code"
- ✅ Click again to hide

**Scan Test:**
1. Open QR code scanner on phone
2. Scan the code
3. **Expected**: JSON data:
```json
{
  "name": "John Doe",
  "table": 5,
  "seat": 3,
  "event": "Fellowship Night"
}
```

---

### 7. Real-Time Email Validation

**Test Steps:**
1. Go to registration form
2. Click in email field
3. Type slowly: `t` `e` `s` `t`

**Expected Results:**
- ✅ Initially shows ✉️ icon (neutral)
- ✅ After typing `test` (invalid), still neutral
- ✅ Type `@example.com` → Shows 🔄 (checking)
- ✅ After 800ms → Shows ✓ (if new) or ⚠️ (if exists)
- ✅ Border changes color (green or amber)
- ✅ Background tint changes

**Timing Test:**
- Must wait 800ms after last keystroke
- Should NOT make API call on every keystroke

---

### 8. Admin Dashboard - Real-Time Updates

**Test Steps:**
1. Open admin page: `/admin`
2. **Do NOT click refresh**
3. Open registration in another tab
4. Register new user
5. **Watch admin page**

**Expected Results:**
- ✅ New table card appears automatically
- ✅ Statistics update instantly:
  - Total Tables (+1)
  - Total Attendees (+1)
  - Average recalculates
  - Available Seats (-1)
- ✅ Green toast notification appears
- ✅ Smooth fade-in animation
- ✅ No manual refresh needed

---

### 9. Admin Dashboard - Search & Filter

#### A. Search Test

**Steps:**
1. Go to `/admin`
2. Type in search box: `john`

**Expected:**
- ✅ Filters tables in real-time
- ✅ Shows only tables with "john" in name/email
- ✅ Case insensitive
- ✅ Shows "No matches" if none found
- ✅ Clears immediately when cleared

**Test Variations:**
- Search by full name: `John Doe`
- Search by email: `john@example.com`
- Search by table number: `5`
- Search partial: `joh`

#### B. Filter Test

**Steps:**
1. Click filter dropdown
2. Select "Available"

**Expected:**
- ✅ Shows only tables with < 6 attendees
- ✅ Hides full tables

**Test All Options:**
- "All Tables": Shows everything
- "Available": Shows < 6 attendees
- "Full": Shows only 6/6 tables

---

### 10. CSV Export

**Test Steps:**
1. Register 5-10 test users
2. Go to `/admin`
3. Click "Export CSV" button

**Expected Results:**
- ✅ File downloads immediately
- ✅ Filename: `fellowship-registrations-YYYY-MM-DD.csv`
- ✅ Contains all registrations
- ✅ Columns: Table, Seat, Name, Email, Registered At
- ✅ Green toast: "Registration data exported successfully!"

**Verify CSV Content:**
```csv
Table,Seat,Name,Email,Registered At
1,1,John Doe,john@email.com,10/5/2025, 2:30:15 PM
1,2,Jane Smith,jane@email.com,10/5/2025, 2:35:42 PM
```

---

### 11. Color-Coded Capacity

**Test Steps:**
1. Go to `/admin`
2. Register users to fill tables

**Expected Colors:**

**Green (0-79% full):**
- Badge: Green background
- Progress: Green bar
- Example: 3/6, 4/6

**Amber (80-99% full):**
- Badge: Amber background
- Progress: Still green bar
- Example: 5/6

**Red (100% full):**
- Badge: Red background
- Progress: Red bar
- "FULL" indicator appears
- Example: 6/6

---

### 12. Input Validation & Sanitization

#### A. Name Validation

**Test Invalid Names:**
1. Empty: `` → Error: "Name is required"
2. Too short: `A` → Error: "Name must be at least 2 characters"
3. Too long: `[101 characters]` → Error: "Name is too long"
4. Special chars: `John<script>` → Gets sanitized to `Johnscript`
5. Numbers: `John123` → Error: "Name can only contain letters..."

**Test Valid Names:**
- ✅ `John Doe`
- ✅ `Mary-Jane O'Connor`
- ✅ `Jean-Pierre`

#### B. Email Validation

**Test Invalid Emails:**
1. Empty: `` → Error: "Email is required"
2. No @: `johnemail.com` → Error: "Invalid email format"
3. No domain: `john@` → Error: "Invalid email format"
4. Spaces: `john @email.com` → Gets trimmed and validated

**Test Valid Emails:**
- ✅ `simple@example.com`
- ✅ `name+tag@example.co.uk`
- ✅ `user.name@subdomain.example.com`

---

### 13. Responsive Design

**Test Breakpoints:**

#### Desktop (>1024px)
1. Resize browser to 1920px width
2. **Expected**:
   - 3 columns of table cards
   - 5 stat cards in one row
   - Side-by-side search and filters

#### Tablet (768-1024px)
1. Resize to 800px width
2. **Expected**:
   - 2 columns of table cards
   - Stats wrap to 2 rows
   - Search and filter still side-by-side

#### Mobile (<768px)
1. Resize to 375px width
2. **Expected**:
   - 1 column of table cards
   - 2 columns of stat cards
   - Search and filter stack vertically
   - Larger touch targets

**Mobile Chrome DevTools:**
1. Open DevTools (F12)
2. Click device toolbar icon
3. Test on iPhone, iPad, Android devices

---

### 14. Accessibility

#### Keyboard Navigation
**Test Steps:**
1. Press `Tab` to navigate
2. Press `Enter`/`Space` to activate
3. Press `Escape` to close modals

**Expected:**
- ✅ Visible focus indicators
- ✅ Logical tab order
- ✅ Can submit form with Enter
- ✅ Can close toast with Escape

#### Screen Reader
**Test with:**
- Windows: NVDA
- Mac: VoiceOver (Cmd+F5)

**Expected:**
- ✅ Form labels read correctly
- ✅ Error messages announced
- ✅ Button purposes clear
- ✅ Toast notifications announced

---

### 15. Edge Cases & Error Handling

#### A. Network Errors
**Test:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to register

**Expected:**
- ✅ Error toast appears
- ✅ Message: "An unexpected error occurred"
- ✅ Form stays filled (data not lost)
- ✅ Can retry after reconnecting

#### B. Concurrent Registrations
**Test:**
1. Open 2 browser tabs
2. Start registration in both
3. Submit within 1 second of each other

**Expected:**
- ✅ Both succeed (no collision)
- ✅ Assigned to different seats
- ✅ Transaction retry handles race conditions

#### C. Table Full Scenario
**Test:**
1. Register 6 users for Table 1
2. Register 7th user

**Expected:**
- ✅ 7th user gets Table 2, Seat 1
- ✅ Table 1 shows "FULL" badge
- ✅ Table 1 shows red progress bar
- ✅ Admin filter "Full" shows Table 1

#### D. Firestore Index Not Ready
**Test:**
- Usually happens on first deploy
- Check console for fallback message

**Expected:**
- ✅ Falls back to manual filtering
- ✅ Console: "Index not ready, using fallback query..."
- ✅ Registration still works
- ✅ No user-facing errors

---

## 🐛 Known Issues to Watch For

1. **Confetti on Existing User**: Should NOT show confetti
   - ✅ Verify `isExisting` flag works

2. **Toast Overlap**: Multiple toasts stack properly
   - ✅ Check with rapid registrations

3. **Mobile Safari**: QR code might need tap to load
   - ✅ Test on actual iPhone if possible

4. **Firestore Offline**: Real-time updates pause
   - ✅ Should resume when back online

---

## 📊 Performance Benchmarks

**Target Metrics:**
- ⚡ Page load: < 2 seconds
- ⚡ Registration API: < 500ms
- ⚡ Email check API: < 300ms
- ⚡ Real-time update: < 100ms
- ⚡ Animation FPS: 60fps
- ⚡ First Contentful Paint: < 1.5s

**Test with:**
- Chrome DevTools → Lighthouse
- Target score: 90+ for all categories

---

## 🎯 Regression Testing Script

Run through this quick checklist before deploying:

```
[ ] Register new user → Confetti works
[ ] Register duplicate → Warning shown
[ ] Check admin → Real-time updates work
[ ] Search in admin → Filters correctly
[ ] Export CSV → Downloads correctly
[ ] Mobile view → Responsive
[ ] QR code → Generates correctly
[ ] Toast notifications → All working
[ ] Form validation → Catches errors
[ ] Table assignment → Sequential
[ ] Full table → Creates new table
[ ] Animations → Smooth and complete
```

---

## 🚀 Production Testing (After Deploy)

1. **Test on Vercel URL**: `https://your-app.vercel.app`
2. **Test from different locations**: VPN to different countries
3. **Test on actual devices**: Real phones, tablets
4. **Test with real users**: 5-10 friends
5. **Monitor Firebase Console**: Check for errors
6. **Check Vercel Analytics**: Verify tracking works

---

## 📝 Bug Report Template

If you find issues:

```markdown
### Bug Report

**Feature**: [e.g., Confetti Animation]
**Expected**: [What should happen]
**Actual**: [What actually happens]
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Environment**:
- Browser: [Chrome 120]
- Device: [MacBook Pro]
- Screen size: [1920x1080]

**Screenshots**: [If applicable]
**Console Errors**: [Any errors in browser console]
```

---

## ✅ Final Acceptance Criteria

Your app is ready for production when:

- [x] All 15 test categories pass
- [x] No console errors
- [x] Lighthouse score > 90
- [x] Works on Chrome, Firefox, Safari, Edge
- [x] Works on iOS and Android
- [x] Real-time updates < 1 second delay
- [x] Forms are accessible
- [x] Toasts appear correctly
- [x] Animations are smooth
- [x] CSV export works
- [x] QR codes scannable
- [x] No duplicate registrations
- [x] Handles 100+ concurrent users

---

**Happy Testing! 🎉**

If you find all tests passing, your app is production-ready and better than most commercial solutions!
