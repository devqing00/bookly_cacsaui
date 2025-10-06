# Quick Setup Guide

## ⚡ 5-Minute Setup

Follow these steps to get your app running quickly:

### 1️⃣ Install Dependencies (2 minutes)

```bash
npm install
```

### 2️⃣ Create Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it (e.g., "cacsaui-bookly")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 3️⃣ Enable Firestore (30 seconds)

1. Click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your location
5. Click "Enable"

### 4️⃣ Get Firebase Config (1 minute)

1. Click the gear icon ⚙️ > "Project settings"
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. Register app (name it anything)
5. Copy the config values

### 5️⃣ Configure Environment Variables (30 seconds)

1. Rename `.env.example` to `.env.local`
2. Paste your Firebase config values
3. Save the file

### 6️⃣ Run the App! (10 seconds)

```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 🔥 Firebase Rules Setup (Optional but Recommended)

Copy the contents of `firestore.rules` to your Firebase Console:

1. Go to Firestore Database
2. Click "Rules" tab
3. Paste the rules from `firestore.rules`
4. Click "Publish"

---

## 🐛 Troubleshooting

### "Cannot find module 'firebase'"
- Run `npm install` again
- Delete `node_modules` and run `npm install`

### "Firebase: Error (auth/invalid-api-key)"
- Check your `.env.local` file
- Make sure all Firebase config values are correct
- Remove any quotes around the values

### "Permission denied" error
- Update your Firestore rules in Firebase Console
- Make sure "test mode" is enabled for development

---

## 📞 Need Help?

Check the full README.md for detailed documentation!
