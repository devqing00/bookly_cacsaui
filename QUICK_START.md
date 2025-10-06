# 🚀 Quick Start Guide - Fellowship Registration System

**Version:** 1.0.0  
**Status:** Production Ready  
**Admin Password:** `admin123` (change in production!)

---

## 🏃 Running the Application

### Development Mode:
```powershell
npm run dev
```
Visit: http://localhost:3000

### Production Build:
```powershell
npm run build
npm start
```

---

## 🔑 Admin Access

### Login:
1. Navigate to: http://localhost:3000/admin
2. Enter password: `admin123`
3. Click "Login"

### Change Password:
```powershell
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_NEW_PASSWORD', 10));"
```
Then update `ADMIN_PASSWORD_HASH` in `.env.local`

---

## 📍 All Pages

| URL | Purpose | Access |
|-----|---------|--------|
| `/` | Main registration form | Public |
| `/check-registration` | Lookup registration | Public |
| `/check-in` | QR/manual check-in | Public (staff use) |
| `/admin` | Admin dashboard | 🔒 Password protected |
| `/activity-log` | Activity audit trail | Public (linked from admin) |

---

## 🎯 Quick Actions

### For Attendees:
1. **Register:** Fill form → Confirm → Get QR code
2. **Check Registration:** Enter email → View details

### For Staff:
1. **Check In:** Scan QR code OR Enter email manually

### For Admins:
1. **View All:** Login → See dashboard
2. **Edit User:** Click blue edit icon → Modify → Save
3. **Delete User:** Click red trash icon → Confirm
4. **Restore User:** Toggle "Show Deleted" → Click green restore
5. **Print Badge:** Click purple print icon
6. **Print Table Badges:** Click "Print badges" on table
7. **Print All Badges:** Click "Print All Badges" button
8. **View Activity:** Click "Activity Log" button
9. **Logout:** Click red "Logout" button

---

## 📊 Admin Dashboard Features

### Statistics (6 cards):
- Total Tables
- Total Attendees
- Avg/Table
- Full Tables
- Available Seats
- Checked In

### Controls:
- **Search:** Name, email, or phone
- **Filter:** All Tables / Available / Full
- **Show Deleted:** Toggle deleted users
- **Links:** Check Registration, Event Check-In, Activity Log
- **Print:** Single, Table, All badges
- **Logout:** Exit admin

### Per Attendee:
- Name, Email, Phone, Gender
- Table and Seat number
- Registration time (🕒)
- Status badges (Checked In, Gender, Deleted)
- Actions (Print, Edit, Delete)

---

## 🔧 Configuration

### Environment Variables (.env.local):
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Admin Password (bcrypt hash)
ADMIN_PASSWORD_HASH=$2b$10$mr5nH9sbcqSXVWeneoVs9u3DNnTgPNQv.T19fgPVR.2QsgTSbhO7i

# Email Service (optional)
RESEND_API_KEY=your_api_key_here
```

---

## 🐛 Troubleshooting

### Can't login to admin:
- Check password is correct: `admin123`
- Verify `.env.local` has `ADMIN_PASSWORD_HASH` set
- Restart dev server after changing `.env.local`
- Clear browser localStorage and try again

### QR scanner not working:
- Camera requires HTTPS (won't work on HTTP in production)
- Grant camera permissions when prompted
- Use manual entry mode as fallback

### Not seeing real-time updates:
- Check Firebase configuration in `.env.local`
- Verify Firestore security rules allow reads
- Refresh the page

### Badge generation fails:
- Check console for errors
- Ensure jsPDF and qrcode are installed
- Try with a single badge first

### Registration fails:
- Check all required fields are filled
- Verify phone number format
- Check Firebase is accessible
- Look for duplicate email

---

## 📱 Mobile Support

✅ **Fully Responsive:**
- Works on phones, tablets, desktops
- Touch-friendly buttons
- Mobile-optimized forms
- QR scanner works on mobile cameras

---

## 🎨 UI Components

### Colors:
- **Green:** Success, registration
- **Blue:** Info, edit
- **Red:** Delete, errors
- **Amber:** Warnings
- **Purple:** Check-in, print
- **Indigo:** Activity log

### Icons:
- ✏️ Edit (blue)
- 🗑️ Delete (red)
- 🔄 Restore (green)
- 🖨️ Print (purple)
- ✅ Check-in (green)
- 🕒 Registration time (gray)

---

## 📈 Capacity Management

### Thresholds:
- **< 80%:** Green (healthy)
- **80-99%:** Amber (warning)
- **100%:** Red (full)

### Notifications:
- Toast on registration
- Progress bar colors
- Warning badges on tables
- Stat card highlights

---

## 📝 Activity Log

### Tracked Actions:
- Edit user
- Delete user
- Restore user
- Check-in

### Filter Options:
- All Actions
- Edit
- Delete
- Restore
- Check-In

---

## 🔒 Security

### Features:
- ✅ Bcrypt password hashing
- ✅ Session tokens (24hr expiration)
- ✅ Server-side validation
- ✅ Input sanitization
- ✅ Firestore security rules
- ✅ Activity logging

### Best Practices:
1. Change default password
2. Use HTTPS in production
3. Restrict admin access
4. Monitor activity logs
5. Regular backups

---

## 📦 Dependencies

### Core:
- Next.js 14
- React 18
- TypeScript
- Firebase (Firestore)

### UI:
- Tailwind CSS
- Framer Motion
- Sonner (toasts)

### Features:
- libphonenumber-js (phone validation)
- @zxing/library (QR scanning)
- jsPDF (PDF generation)
- qrcode (QR generation)
- bcryptjs (password hashing)
- date-fns (date formatting)

---

## 🎯 Common Workflows

### New Registration:
```
1. User fills form (name, email, phone, gender)
2. Click "Continue"
3. Review in confirmation modal
4. Click "Confirm & Register"
5. See success screen with QR code
6. Table and seat assigned automatically
```

### Event Check-In:
```
1. Staff opens /check-in page
2. Choose QR Scanner or Manual Entry
3. Scan QR code OR Enter email
4. See success screen
5. Check-in recorded with timestamp
6. Admin dashboard updates instantly
```

### Admin Management:
```
1. Login to /admin
2. Search/filter to find user
3. Click edit icon → Modify details → Save
4. OR Click delete icon → Confirm deletion
5. Toggle "Show Deleted" to restore
6. Print badges as needed
7. View activity log for audit trail
```

---

## 📞 Support

### Documentation Files:
- `README.md` - Project overview
- `SETUP.md` - Detailed setup instructions
- `ALL_FEATURES_COMPLETE.md` - Feature summary (this file)
- `PASSWORD_PROTECTION_COMPLETE.md` - Security guide
- `IMPLEMENTATION_COMPLETE_FINAL.md` - Comprehensive guide (65 pages)

### Quick Links:
- Firebase Console: https://console.firebase.google.com
- Vercel Deployment: https://vercel.com
- Next.js Docs: https://nextjs.org/docs

---

## ✅ Pre-Deployment Checklist

- [ ] Test all features locally
- [ ] Change admin password
- [ ] Update `.env.local` for production
- [ ] Set up Firebase project
- [ ] Configure Firestore security rules
- [ ] Test on mobile devices
- [ ] Run production build
- [ ] Deploy to hosting platform
- [ ] Test on production domain
- [ ] Verify HTTPS enabled
- [ ] Test QR scanner in production
- [ ] Monitor for errors

---

## 🎉 Success!

Your Fellowship Registration System is ready to use! 

**Need help?** Check the comprehensive documentation files.

**Happy event managing!** 🎊

---

**Built with ❤️ using Next.js, TypeScript, Firebase, and Tailwind CSS**

