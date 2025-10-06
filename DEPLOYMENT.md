# 🚀 Deployment Guide

## Deploy to Vercel (Recommended - 5 minutes)

Vercel is the easiest way to deploy Next.js applications. It's free for personal projects!

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Your code pushed to a GitHub repository

### Step-by-Step Deployment

#### 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Fellowship registration app"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

#### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your repository
5. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

#### 3. Add Environment Variables

In the Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 4. Deploy!

Click "Deploy" and wait 1-2 minutes. Your app will be live at:
```
https://your-app-name.vercel.app
```

---

## Alternative: Deploy to Netlify

### Step 1: Push to GitHub (same as above)

### Step 2: Connect to Netlify

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

### Step 3: Add Environment Variables

In Netlify site settings:
1. Go to "Site settings" → "Environment variables"
2. Add all Firebase environment variables

### Step 4: Deploy

Click "Deploy site" and wait for completion.

---

## Deploy with Docker (Self-hosted)

### Dockerfile

Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Build and Run

```bash
# Build the image
docker build -t cacsaui-bookly .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your_key \
  -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain \
  -e NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id \
  -e NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket \
  -e NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender \
  -e NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id \
  cacsaui-bookly
```

---

## Custom Domain Setup

### Vercel

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as shown
5. Wait for DNS propagation (up to 48 hours)

### Netlify

1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic)

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] App loads correctly
- [ ] Registration form works
- [ ] Table assignment functions properly
- [ ] Admin dashboard displays data
- [ ] Mobile responsive design works
- [ ] Firebase connection established
- [ ] No console errors
- [ ] SSL certificate active (HTTPS)

### Test Registration:
1. Visit your deployed URL
2. Register a test user
3. Check admin dashboard
4. Verify in Firebase Console

---

## Production Firebase Setup

### Update Firestore Rules

For production, use stricter rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tables/{tableId} {
      allow read: if true;
      // Only allow writes through Cloud Functions or Admin SDK
      allow write: if false;
    }
  }
}
```

### Add Authorized Domain

In Firebase Console:
1. Go to Authentication → Settings
2. Click "Authorized domains"
3. Add your production domain (e.g., `fellowship-app.vercel.app`)

---

## Monitoring & Analytics

### Enable Vercel Analytics

```bash
npm install @vercel/analytics
```

Add to `src/app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Firebase Performance Monitoring

```bash
npm install firebase/performance
```

---

## Rollback & Version Control

### Vercel Rollback

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Git Rollback

```bash
# View commit history
git log --oneline

# Rollback to specific commit
git reset --hard COMMIT_HASH
git push -f origin main
```

---

## Environment-Specific Configurations

### Development
- Use Firebase test mode
- Verbose logging
- Source maps enabled

### Production
- Strict Firebase rules
- Error tracking
- Performance monitoring
- Rate limiting

---

## Troubleshooting Deployment

### Build Fails

**Error**: "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Error**: TypeScript errors
```bash
# Check tsconfig.json
# Ensure all types are defined
npm run build
```

### Runtime Errors

**Firebase connection issues**
- Verify environment variables in platform
- Check Firebase project settings
- Ensure domain is authorized in Firebase

**API route not working**
- Check API route path
- Verify Firebase initialization
- Check browser console for errors

---

## Performance Optimization

### Image Optimization

Use Next.js Image component:

```tsx
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={200}
/>
```

### Caching Strategy

Add to `next.config.js`:

```javascript
module.exports = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        },
      ],
    },
  ],
};
```

---

## Backup Strategy

### Firestore Backup

1. Enable automatic backups in Firebase Console
2. Export data regularly:

```bash
gcloud firestore export gs://your-bucket/backups
```

### Code Backup

- Always push to GitHub
- Tag releases: `git tag v1.0.0`
- Use GitHub releases for major versions

---

## Cost Estimation

### Free Tier (Perfect for small events)

**Vercel**: Free for personal projects
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS

**Firebase**: Free Spark plan includes
- 1GB storage
- 50K reads/day
- 20K writes/day
- (Sufficient for 1000+ registrations)

### Paid Tier (Large events)

Only needed if you exceed free limits.

---

## Support & Maintenance

### Regular Maintenance

- Update dependencies monthly: `npm update`
- Monitor Firebase usage
- Review error logs
- Test registration flow weekly

### Security Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🎉 You're Live!

Congratulations! Your Fellowship Night Registration app is now live and ready to accept registrations.

**Share your app:**
- Send the URL to participants
- Add QR code to posters
- Share on social media
- Email to fellowship members

**Monitor your app:**
- Check admin dashboard regularly
- Review Firebase Console
- Monitor Vercel Analytics
- Check for errors

Happy hosting! 🚀
