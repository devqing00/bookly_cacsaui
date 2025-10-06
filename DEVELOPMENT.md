# 🎯 Fellowship Night Registration App - Development Guide

## ✅ What's Been Built

### Core Features
- ✅ Modern, responsive registration form
- ✅ Automatic table assignment (6 seats per table)
- ✅ Real-time Firebase Firestore integration
- ✅ Client-side form validation
- ✅ Beautiful success confirmation display
- ✅ Smooth animations with Framer Motion
- ✅ Admin dashboard to view all tables
- ✅ Mobile-first responsive design

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Animations**: Framer Motion
- **Validation**: Client-side with regex

---

## 📂 File Structure Overview

```
bookly_cacsaui/
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx               # Main registration page
│   │   ├── layout.tsx             # Root layout with metadata
│   │   ├── globals.css            # Global styles
│   │   ├── admin/                 # Admin dashboard
│   │   │   └── page.tsx           # View all tables/registrations
│   │   └── api/
│   │       └── register/
│   │           └── route.ts       # Registration API endpoint
│   │
│   ├── components/
│   │   ├── RegistrationForm.tsx   # Registration form component
│   │   └── ConfirmationDisplay.tsx # Success message component
│   │
│   ├── lib/
│   │   └── firebase.ts            # Firebase initialization
│   │
│   └── types/
│       └── index.ts               # TypeScript types
│
├── .env.example                   # Example environment variables
├── .env.local                     # Your Firebase config (create this!)
├── firestore.rules                # Firestore security rules
├── README.md                      # Full documentation
├── SETUP.md                       # Quick setup guide
└── package.json                   # Dependencies
```

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- React 18
- Firebase SDK
- Tailwind CSS
- Framer Motion
- TypeScript

### Step 2: Set Up Firebase

**Important:** You MUST complete this step before running the app!

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database (Start in test mode)
3. Copy your Firebase config
4. Create `.env.local` file from `.env.example`
5. Paste your Firebase config values

See `SETUP.md` for detailed instructions.

### Step 3: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 📄 Page Routes

| Route | Description |
|-------|-------------|
| `/` | Main registration page |
| `/admin` | Admin dashboard (view all tables) |
| `/api/register` (POST) | Register a new attendee |
| `/api/register` (GET) | Get all tables (JSON) |

---

## 🔥 How the Table Assignment Works

### Algorithm Flow:

1. **User submits form** with name and email
2. **API receives request** at `/api/register`
3. **Transaction starts** (ensures data consistency)
4. **Query Firestore** for tables with available seats:
   ```typescript
   WHERE seat_count < 6
   ORDER BY seat_count ASC, tableNumber ASC
   ```
5. **Two scenarios**:
   
   **Scenario A: Available table found**
   - Add user to the first available table
   - Increment `seat_count`
   - Return assigned table number
   
   **Scenario B: All tables full**
   - Create a new table
   - Auto-increment table number
   - Assign user as first attendee
   - Return new table number

6. **Success response** sent to client
7. **Confirmation displayed** with table assignment

### Database Schema:

```typescript
// Firestore Collection: "tables"
{
  table_id: "table_1",        // Unique identifier
  tableNumber: 1,              // Display number (1, 2, 3...)
  seat_count: 3,               // Current attendees
  maxCapacity: 6,              // Maximum capacity
  attendees: [                 // Array of attendee objects
    {
      name: "John Doe",
      email: "john@example.com",
      registeredAt: Timestamp
    }
  ]
}
```

---

## 🎨 Customization Guide

### Change Table Capacity

**File**: `src/app/api/register/route.ts`

```typescript
const MAX_SEATS_PER_TABLE = 8; // Change from 6 to 8
```

### Update Event Name

**File**: `src/app/page.tsx`

```tsx
<h1>Your Custom Event Name</h1>
```

### Modify Color Scheme

**File**: `tailwind.config.js`

```javascript
colors: {
  primary: {
    500: '#your-color',  // Change primary color
  },
  accent: {
    500: '#your-color',  // Change accent color
  }
}
```

### Add Required Fields

**File**: `src/components/RegistrationForm.tsx`

Add new state and validation for additional fields like phone number, department, etc.

---

## 🧪 Testing the Application

### Test Registration Flow:

1. Go to http://localhost:3000
2. Fill in name and email
3. Submit form
4. Verify success message with table number
5. Go to http://localhost:3000/admin
6. Verify attendee appears in the correct table

### Test Table Assignment Logic:

**Test Case 1: First Registration**
- Register 1 person
- Expected: Assigned to Table 1

**Test Case 2: Fill a Table**
- Register 6 people total
- Expected: All assigned to Table 1

**Test Case 3: Overflow to New Table**
- Register the 7th person
- Expected: Assigned to Table 2

**Test Case 4: Multiple Tables**
- Continue registering
- Expected: Even distribution, new tables created as needed

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module 'firebase'"
**Solution**: 
```bash
rm -rf node_modules
npm install
```

### Issue: Firebase errors on startup
**Solution**: 
- Check `.env.local` exists
- Verify all Firebase config values are correct
- No quotes around values in `.env.local`

### Issue: "Permission denied" in Firestore
**Solution**: 
- Update Firestore rules in Firebase Console
- Copy rules from `firestore.rules` file

### Issue: TypeScript errors
**Solution**: 
- These are expected before `npm install`
- Run `npm install` to install dependencies
- Restart VS Code TypeScript server

---

## 📊 Admin Dashboard

Access the admin dashboard at `/admin` to:
- View all tables
- See attendee lists for each table
- Check seat availability
- Monitor total registrations
- View real-time updates

**Features**:
- Total tables count
- Total attendees count
- Visual progress bars
- Full attendee details
- Refresh button for latest data

---

## 🔒 Security Best Practices

### Development (Current Setup)
- Firestore rules allow public read/write
- Good for testing and development

### Production Recommendations
1. **Restrict Firestore writes** to server-side only
2. **Add rate limiting** to prevent spam
3. **Implement email verification**
4. **Add CAPTCHA** for bot protection
5. **Use environment variables** for secrets
6. **Enable Firestore security rules**:
   ```javascript
   match /tables/{tableId} {
     allow read: if true;
     allow write: if false; // Use Cloud Functions
   }
   ```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Set up production Firebase project
- [ ] Update Firestore security rules
- [ ] Add environment variables to hosting platform
- [ ] Test registration flow thoroughly
- [ ] Test on mobile devices
- [ ] Enable Firebase monitoring
- [ ] Set up backup strategy
- [ ] Configure custom domain
- [ ] Add analytics (optional)
- [ ] Set up error tracking

### Deploy to Vercel:
```bash
npm run build  # Test build locally
vercel         # Deploy to Vercel
```

---

## 📈 Future Enhancements (Optional)

Consider adding:
- [ ] Email confirmation after registration
- [ ] QR code generation for table assignment
- [ ] Check-in functionality
- [ ] Waitlist when event is full
- [ ] Admin authentication
- [ ] Export attendees to CSV
- [ ] SMS notifications
- [ ] Social media sharing
- [ ] Event capacity limits
- [ ] Multiple event support

---

## 💡 Tips & Tricks

### Quick Development Workflow:
1. Make changes to code
2. Save file (auto-reload with Next.js)
3. Check browser for updates
4. Test in mobile view (Chrome DevTools)

### Debugging Firebase:
```typescript
// Add to firebase.ts for debugging
console.log('Firebase initialized:', app.name);
```

### View Firebase Data:
- Go to Firebase Console
- Navigate to Firestore Database
- Click on "tables" collection
- View all documents

---

## 📞 Support

If you encounter issues:
1. Check the README.md for detailed docs
2. Review SETUP.md for setup steps
3. Check Firebase Console for errors
4. Review browser console for errors
5. Check Network tab for API errors

---

## 🎉 You're All Set!

Your Fellowship Night Registration app is ready to use! 

**Quick Commands:**
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
```

**Important URLs:**
- Main App: http://localhost:3000
- Admin: http://localhost:3000/admin
- API: http://localhost:3000/api/register

Enjoy building! 🚀
