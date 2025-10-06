# Fellowship Night Registration App

A modern, beautiful Next.js web application for event registration with automatic table assignment for university church fellowship events.

![Fellowship Night Registration](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-11-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- **Simple Registration Form**: Clean, intuitive form requesting only name and email
- **Automatic Table Assignment**: Smart algorithm assigns users to tables with up to 6 seats
- **Real-time Table Management**: Uses Firebase Firestore for reliable data storage
- **Beautiful UI/UX**: Modern design with smooth animations using Framer Motion
- **Fully Responsive**: Optimized for both mobile and desktop devices
- **Client-side Validation**: Instant feedback with email format validation
- **No Authentication Required**: Quick and frictionless registration process

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- A **Firebase** account (free tier works perfectly)

### Step 1: Clone and Install

```bash
# Navigate to the project directory
cd bookly_cacsaui

# Install dependencies
npm install
# or
yarn install
```

### Step 2: Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" or select an existing project
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In your Firebase project, navigate to **Build > Firestore Database**
   - Click "Create database"
   - Choose "Start in production mode" or "Start in test mode" (for development)
   - Select your preferred Cloud Firestore location

3. **Get Your Firebase Configuration**
   - Go to **Project Settings** (gear icon) > **General**
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to register a web app
   - Copy your Firebase configuration values

4. **Set Up Firestore Rules** (Important for Security)
   
   In the Firebase Console, go to **Firestore Database > Rules** and update with:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read access to tables for everyone
       match /tables/{tableId} {
         allow read: if true;
         
         // Only allow writes through authenticated admin or server
         // For now, allow writes (you can restrict this later)
         allow write: if true;
       }
     }
   }
   ```

   **Note**: For production, you should implement proper security rules!

### Step 3: Environment Configuration

1. Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

2. Open `.env.local` and fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 4: Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application! 🎉

## 📁 Project Structure

```
bookly_cacsaui/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── register/
│   │   │       └── route.ts        # API endpoint for registration
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main page component
│   ├── components/
│   │   ├── RegistrationForm.tsx    # Registration form component
│   │   └── ConfirmationDisplay.tsx # Success message component
│   ├── lib/
│   │   └── firebase.ts             # Firebase configuration
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── .env.example                    # Example environment variables
├── .env.local                      # Your environment variables (create this)
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies
```

## 🎨 How It Works

### Registration Flow

1. **User enters their name and email** in the registration form
2. **Client-side validation** checks for valid email format
3. **Form submission** sends data to the `/api/register` endpoint
4. **Server logic** (Firebase transaction):
   - Searches for tables with available seats (< 6 people)
   - If found, assigns user to the first available table
   - If no available tables, creates a new table
   - Updates Firestore with the new attendee
5. **Success response** displays confirmation with assigned table number

### Database Structure

Each table document in Firestore contains:

```typescript
{
  table_id: "table_1",           // Unique table identifier
  tableNumber: 1,                 // Display number (Table 1, Table 2, etc.)
  seat_count: 3,                  // Current number of attendees
  maxCapacity: 6,                 // Maximum seats per table
  attendees: [                    // Array of attendee objects
    {
      name: "John Doe",
      email: "john@example.com",
      registeredAt: Timestamp
    }
  ]
}
```

## 🛠️ Customization

### Change Table Capacity

Edit the constant in `src/app/api/register/route.ts`:

```typescript
const MAX_SEATS_PER_TABLE = 6; // Change this number
```

### Modify Colors

Update the color palette in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    // Your custom primary colors
  },
  accent: {
    // Your custom accent colors
  }
}
```

### Update Event Title

Modify the title in `src/app/page.tsx`:

```tsx
<h1>
  Your Custom Event Name
</h1>
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px and up)
- 📱 Tablets (768px and up)
- 💻 Desktops (1024px and up)
- 🖥️ Large screens (1280px and up)

## 🔒 Security Considerations

### For Development
The current Firestore rules allow public read/write access for easy setup.

### For Production
Consider implementing:
1. **Server-side validation** in the API route (✅ Already included)
2. **Rate limiting** to prevent spam registrations
3. **Stricter Firestore rules** with server-side operations
4. **Email verification** to ensure valid registrations
5. **Admin dashboard** for managing tables and attendees

Example production Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tables/{tableId} {
      allow read: if true;
      allow write: if false; // Only allow writes through Cloud Functions
    }
  }
}
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in the Vercel dashboard
5. Deploy!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Self-hosted with Docker

## 📊 Viewing Registrations

### Option 1: Firebase Console
View all registrations directly in the Firebase Console under Firestore Database.

### Option 2: API Endpoint
Access the GET endpoint to view all tables (for debugging):

```
GET http://localhost:3000/api/register
```

Response:
```json
{
  "tables": [
    {
      "id": "doc_id",
      "tableNumber": 1,
      "seat_count": 4,
      "attendees": [...]
    }
  ]
}
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animated with [Motion](https://motion.dev/)
- Database by [Firebase](https://firebase.google.com/)

---

**Made with ❤️ for University Church Fellowship**

For questions or support, please open an issue on GitHub.
