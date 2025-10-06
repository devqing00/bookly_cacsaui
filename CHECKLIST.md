# ✅ Quick Start Checklist

Follow this checklist to get your Fellowship Registration app running in minutes!

## 📋 Pre-Launch Checklist

### Step 1: Install Dependencies ⏱️ 2 minutes
- [ ] Open terminal in project folder
- [ ] Run `npm install`
- [ ] Wait for installation to complete
- [ ] Verify no errors appear

### Step 2: Firebase Setup ⏱️ 5 minutes
- [ ] Go to https://console.firebase.google.com
- [ ] Create new project (or select existing)
- [ ] Enable Firestore Database
- [ ] Choose "Start in test mode"
- [ ] Select your region/location
- [ ] Click "Enable"

### Step 3: Get Firebase Config ⏱️ 2 minutes
- [ ] Click ⚙️ icon → Project Settings
- [ ] Scroll to "Your apps"
- [ ] Click web icon `</>`
- [ ] Register app (name it anything)
- [ ] Copy configuration values

### Step 4: Environment Setup ⏱️ 1 minute
- [ ] Copy `.env.example` to `.env.local`
- [ ] Open `.env.local` in editor
- [ ] Paste Firebase values (NO quotes)
- [ ] Save file

### Step 5: First Run ⏱️ 30 seconds
- [ ] Run `npm run dev`
- [ ] Wait for "ready" message
- [ ] Open http://localhost:3000
- [ ] Verify page loads

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Registration form displays
- [ ] Can type in name field
- [ ] Can type in email field
- [ ] Form validation shows errors for empty fields
- [ ] Form validation shows error for invalid email
- [ ] Submit button shows loading state
- [ ] Success message appears after submission
- [ ] Table number is displayed
- [ ] User name appears in confirmation

### Admin Dashboard
- [ ] Navigate to `/admin`
- [ ] Dashboard loads successfully
- [ ] See registered user in table
- [ ] Total counts are correct
- [ ] Refresh button works

### Multiple Registrations
- [ ] Register another person (click "Register another")
- [ ] Verify assigned to same table
- [ ] Register 6 people total
- [ ] Verify all in Table 1
- [ ] Register 7th person
- [ ] Verify assigned to Table 2

### Mobile Testing
- [ ] Open in mobile browser (or use DevTools)
- [ ] Form is readable on small screen
- [ ] Buttons are easily tappable
- [ ] Success message displays well
- [ ] Admin dashboard works on mobile

---

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Test registration flow one more time

### Firebase Production Setup
- [ ] Update Firestore rules (copy from `firestore.rules`)
- [ ] Test rules don't block registration
- [ ] Verify data appears in Firestore Console
- [ ] Check Firebase quotas/limits

### Documentation
- [ ] Read README.md
- [ ] Understand SETUP.md
- [ ] Review DEPLOYMENT.md
- [ ] Bookmark Firebase Console URL

---

## 🌐 Deployment Checklist

### GitHub
- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Create GitHub repository
- [ ] Push: `git push -u origin main`

### Vercel (Recommended)
- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub
- [ ] Click "Add New Project"
- [ ] Import your repository
- [ ] Add environment variables
- [ ] Click "Deploy"
- [ ] Wait for deployment (~2 minutes)
- [ ] Click "Visit" to see live site

### Post-Deployment
- [ ] Test registration on live site
- [ ] Check admin dashboard on live site
- [ ] Verify Firebase connection works
- [ ] Test on mobile device
- [ ] Share URL with test users

---

## 📊 Final Verification

### URLs to Check
- [ ] Main site: https://your-app.vercel.app
- [ ] Admin: https://your-app.vercel.app/admin
- [ ] API: https://your-app.vercel.app/api/register

### Firebase Console
- [ ] Go to Firestore Database
- [ ] See "tables" collection
- [ ] See documents with attendees
- [ ] Check usage/quotas

### Features Working
- [ ] Registration works
- [ ] Table assignment correct
- [ ] Success message shows
- [ ] Admin dashboard displays data
- [ ] Mobile responsive
- [ ] HTTPS enabled (automatic with Vercel)

---

## 🎉 Launch Checklist

### Before Announcing
- [ ] Test with 5-10 people first
- [ ] Monitor Firebase Console
- [ ] Check for any errors
- [ ] Verify email addresses are saved correctly
- [ ] Ensure table assignments are logical

### Marketing Materials
- [ ] Share registration URL
- [ ] Create QR code (use qr-code-generator.com)
- [ ] Post on social media
- [ ] Email fellowship members
- [ ] Create event poster with QR code

### Monitoring
- [ ] Check admin dashboard regularly
- [ ] Monitor total registrations
- [ ] Watch Firebase usage
- [ ] Respond to user questions

---

## ⚠️ Common Issues & Fixes

### "Cannot find module 'firebase'"
```bash
npm install
```

### Firebase connection errors
- [ ] Check `.env.local` exists
- [ ] Verify all values are correct
- [ ] No quotes around values
- [ ] Restart dev server

### Build fails
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Permission denied (Firestore)
- [ ] Update rules in Firebase Console
- [ ] Use "test mode" for development

### TypeScript errors
- [ ] These are normal before `npm install`
- [ ] Run `npm install` first
- [ ] Restart VS Code if needed

---

## 💡 Pro Tips

### Development
- Use Chrome DevTools for debugging
- Test mobile view with DevTools (F12 → Mobile icon)
- Check Console tab for errors
- Use Network tab to see API calls

### Firebase
- Bookmark Firebase Console
- Check usage daily during event
- Export data after event for records
- Enable automatic backups

### User Support
- Test the flow yourself first
- Have backup plan (Google Form)
- Monitor registrations during event
- Have tech support available

---

## 📞 Need Help?

### Quick Troubleshooting
1. Check browser console (F12)
2. Check terminal for errors
3. Verify Firebase connection
4. Review documentation files

### Documentation
- **README.md** - Full documentation
- **SETUP.md** - Quick setup
- **DEVELOPMENT.md** - Development details
- **DEPLOYMENT.md** - Deployment guide
- **PROJECT_SUMMARY.md** - Project overview

---

## ✨ You're Ready!

When all boxes are checked, your app is ready to:
- Accept registrations
- Assign tables automatically
- Display confirmations
- Track attendees

**Good luck with your Fellowship Night event!** 🎉

---

*Print this checklist and check off items as you complete them!*
