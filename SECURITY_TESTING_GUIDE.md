# 🧪 Security Testing Quick Guide

**How to Test the Security Fixes**

---

## Quick Test Scenarios

### ✅ Test 1: Activity Log Protection (30 seconds)

**Test Without Login:**
1. Open **incognito/private window** (important!)
2. Navigate to: `http://localhost:3000/activity-log`
3. **Expected Result:** 
   - ✅ You should see a loading spinner
   - ✅ Then redirect to `/admin?redirect=/activity-log`
   - ✅ Login modal appears

**Test With Login:**
1. Enter password: `admin123`
2. Click "Login"
3. **Expected Result:**
   - ✅ Toast: "Login successful! Redirecting..."
   - ✅ Auto-redirect back to `/activity-log`
   - ✅ Activity logs display

---

### ✅ Test 2: Check-In Page Protection (30 seconds)

**Test Without Login:**
1. Open **incognito/private window**
2. Navigate to: `http://localhost:3000/check-in`
3. **Expected Result:**
   - ✅ Toast: "Please login to access check-in"
   - ✅ Redirect to `/admin?redirect=/check-in`
   - ✅ Login modal appears

**Test With Login:**
1. Enter password: `admin123`
2. Click "Login"
3. **Expected Result:**
   - ✅ Toast: "Login successful! Redirecting..."
   - ✅ Auto-redirect back to `/check-in`
   - ✅ Check-in page loads (scanner mode)

---

### ✅ Test 3: API Protection (1 minute)

**Using Browser Console:**

1. Open DevTools (F12)
2. Go to Console tab
3. Paste this code:

```javascript
// Test without authentication (should fail)
fetch('/api/activity-log')
  .then(r => r.json())
  .then(data => console.log('Response:', data));

// Expected: {success: false, error: "Unauthorized - Admin login required"}
```

4. Now login to admin panel
5. Then test again:

```javascript
// Test with authentication (should work)
fetch('/api/activity-log')
  .then(r => r.json())
  .then(data => console.log('Response:', data));

// Expected: {success: true, logs: [...]}
```

---

### ✅ Test 4: Session Validation (30 seconds)

**Using Browser Console:**

```javascript
// Test session check endpoint
fetch('/api/auth/check-session')
  .then(r => r.json())
  .then(data => console.log('Session:', data));

// Not logged in: {authenticated: false, error: "No valid session found"}
// Logged in: {authenticated: true, message: "Valid session"}
```

---

### ✅ Test 5: Session Expiration (1 minute)

**Test Expired Session Handling:**

1. Login to admin panel (`admin123`)
2. Navigate to `/activity-log` (should work)
3. Open DevTools → Application tab → Cookies
4. Delete the `admin_session` cookie
5. Refresh the page
6. **Expected Result:**
   - ✅ Redirect to `/admin?redirect=/activity-log`
   - ✅ Must login again

---

## Visual Test Results

### ❌ BEFORE (Insecure):
```
http://localhost:3000/activity-log
→ Shows all admin activity logs ❌
→ No login required ❌
→ Anyone can access ❌
```

### ✅ AFTER (Secure):
```
http://localhost:3000/activity-log
→ Checks authentication ✅
→ Redirects to login ✅
→ Only admins can access ✅
```

---

## Complete Test Checklist

Run these tests in order:

- [ ] **Test 1:** Activity log redirects to login when not authenticated
- [ ] **Test 2:** Activity log loads after successful login
- [ ] **Test 3:** Check-in page redirects to login when not authenticated
- [ ] **Test 4:** Check-in page loads after successful login
- [ ] **Test 5:** Activity log API returns 401 without authentication
- [ ] **Test 6:** Activity log API returns data with authentication
- [ ] **Test 7:** Session check API returns correct status
- [ ] **Test 8:** Clearing cookies triggers re-authentication
- [ ] **Test 9:** Redirect URL preserved during login
- [ ] **Test 10:** Toast notifications display correctly

---

## Expected Behavior Summary

| Action | Without Login | With Login |
|--------|---------------|------------|
| Visit `/activity-log` | ❌ Redirect to login | ✅ Show logs |
| Visit `/check-in` | ❌ Redirect to login | ✅ Show scanner |
| Visit `/admin` | ✅ Show login modal | ✅ Show dashboard |
| GET `/api/activity-log` | ❌ 401 Unauthorized | ✅ 200 OK |
| POST `/api/activity-log` | ❌ 401 Unauthorized | ✅ 200 OK |
| GET `/api/auth/check-session` | ❌ `authenticated: false` | ✅ `authenticated: true` |

---

## Troubleshooting

### Issue: Stuck in redirect loop
**Solution:** Clear all cookies and localStorage, then refresh

### Issue: "Verifying authentication..." never ends
**Solution:** Check browser console for errors, verify API routes are running

### Issue: Login doesn't redirect back
**Solution:** Check URL has `?redirect=` parameter, verify admin page handleLogin function

### Issue: API still returns data without login
**Solution:** Verify cookies are being sent, check server console for errors

---

## Quick Commands

### Clear All Auth State (Browser Console):
```javascript
// Clear everything
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### Check Current Session (Browser Console):
```javascript
fetch('/api/auth/check-session')
  .then(r => r.json())
  .then(console.log);
```

### Check Cookies (Browser Console):
```javascript
console.log('Cookies:', document.cookie);
```

---

## Success Criteria

✅ **All tests pass** = Security properly implemented  
✅ **No unauthorized access** = Protection working  
✅ **Smooth redirects** = UX maintained  
✅ **Clear error messages** = User-friendly  

---

**Test Duration:** ~5 minutes for all tests  
**Required:** Incognito window, Browser DevTools  
**Password:** admin123

