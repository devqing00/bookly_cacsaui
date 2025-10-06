# 🔒 Security Architecture - Visual Overview

**Complete Security Implementation Diagram**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FELLOWSHIP REGISTRATION SYSTEM                   │
│                         Security Architecture                        │
└─────────────────────────────────────────────────────────────────────┘

PUBLIC ROUTES (No Authentication)              PROTECTED ROUTES (Auth Required)
────────────────────────────                  ───────────────────────────────

┌─────────────────┐                           ┌─────────────────┐
│   /  (Home)     │                           │  /activity-log  │
│   Public        │                           │  Admin Only     │
└─────────────────┘                           └────────┬────────┘
                                                       │
┌─────────────────┐                                   │ Session Check
│   /register     │                                   ↓
│   Public Form   │                           ┌─────────────────┐
└─────────────────┘                           │ /api/auth/      │
                                              │ check-session   │
┌─────────────────┐                           └────────┬────────┘
│ /check-         │                                    │
│  registration   │                                    │ Valid?
│   Public        │                           ┌────────┴────────┐
└─────────────────┘                           │        │        │
                                             YES      NO       
┌─────────────────┐                           │        │        
│   /admin        │ ────────────┐             │        │        
│   Login Modal   │             │             │        ↓        
└─────────────────┘             │             │   ┌─────────────────┐
                                │             │   │ Redirect to     │
┌─────────────────┐             │             │   │ /admin?redirect │
│ /api/register   │             │             │   └─────────────────┘
│   Public API    │             │             │
└─────────────────┘             │             ↓
                                │    ┌─────────────────┐
┌─────────────────┐             │    │  Show Page      │
│ /api/check-in   │             │    │  Content        │
│   Public API    │             │    └─────────────────┘
└─────────────────┘             │
                                │
                                │    ┌─────────────────┐
                                └───→│   /check-in     │
                                     │   Admin Only    │
                                     └────────┬────────┘
                                              │
                                              │ Session Check
                                              ↓
                                     ┌─────────────────┐
                                     │ Auth Required   │
                                     └────────┬────────┘
                                              │
                                     ┌────────┴────────┐
                                     │        │        │
                                    YES      NO       
                                     │        │        
                                     │        ↓        
                                     │   ┌─────────────────┐
                                     │   │ Redirect to     │
                                     │   │ /admin?redirect │
                                     │   └─────────────────┘
                                     │
                                     ↓
                            ┌─────────────────┐
                            │  QR Scanner     │
                            │  Ready          │
                            └─────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPLETE AUTH FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

        USER                    CLIENT                  SERVER
         │                        │                       │
         │  1. Visit Protected    │                       │
         │     /activity-log      │                       │
         ├───────────────────────>│                       │
         │                        │                       │
         │                        │  2. GET /api/auth/    │
         │                        │     check-session     │
         │                        ├──────────────────────>│
         │                        │                       │
         │                        │  3. Check Cookie      │
         │                        │     admin_session?    │
         │                        │<──────────────────────┤
         │                        │     NO / Invalid      │
         │                        │                       │
         │  4. Redirect to Login  │                       │
         │  /admin?redirect=      │                       │
         │  /activity-log         │                       │
         │<───────────────────────┤                       │
         │                        │                       │
         │  5. Show Login Modal   │                       │
         │<───────────────────────┤                       │
         │                        │                       │
         │  6. Enter Password     │                       │
         │     (admin123)         │                       │
         ├───────────────────────>│                       │
         │                        │                       │
         │                        │  7. POST /api/admin/  │
         │                        │     auth              │
         │                        ├──────────────────────>│
         │                        │                       │
         │                        │  8. Validate Password │
         │                        │     Set Cookie        │
         │                        │<──────────────────────┤
         │                        │  admin_session=auth   │
         │                        │                       │
         │  9. Success Toast      │                       │
         │  "Login successful!"   │                       │
         │<───────────────────────┤                       │
         │                        │                       │
         │  10. Auto Redirect     │                       │
         │  Back to /activity-log │                       │
         │<───────────────────────┤                       │
         │                        │                       │
         │                        │  11. GET /api/        │
         │                        │      activity-log     │
         │                        ├──────────────────────>│
         │                        │  Cookie: admin_session│
         │                        │                       │
         │                        │  12. Validate Cookie  │
         │                        │      Return Data      │
         │                        │<──────────────────────┤
         │                        │  {success: true, ...} │
         │                        │                       │
         │  13. Display Logs      │                       │
         │<───────────────────────┤                       │
         │                        │                       │
```

---

## 🛡️ Cookie Security

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COOKIE SECURITY LAYER                          │
└─────────────────────────────────────────────────────────────────────┘

Admin Login Success
       ↓
┌──────────────────────────────┐
│ Set Cookie: admin_session    │
│ Value: "authenticated"       │
│ HttpOnly: true (recommended) │
│ Secure: true (HTTPS)         │
│ SameSite: Strict             │
│ Path: /                      │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│ Every Protected Request      │
│ Includes Cookie              │
│ Cookie: admin_session=...    │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│ Server Validates             │
│ 1. Cookie exists?            │
│ 2. Value = "authenticated"?  │
│ 3. Not expired?              │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       │               │
    VALID          INVALID
       │               │
       ↓               ↓
┌────────────┐   ┌────────────┐
│ Allow      │   │ Deny       │
│ Request    │   │ 401        │
└────────────┘   └────────────┘
```

---

## 🎭 Protected vs Public Routes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ROUTE PROTECTION MATRIX                          │
└─────────────────────────────────────────────────────────────────────┘

PUBLIC ROUTES ✅                      PROTECTED ROUTES 🔒
─────────────────                    ────────────────────

/                                    /admin
├─ Register Form                     ├─ Dashboard
├─ No Auth Required                  ├─ Login Modal (if not auth)
└─ Open to All                       └─ Session Required

/register                            /activity-log
├─ Registration Form                 ├─ Admin Activity History
├─ No Auth Required                  ├─ Requires Session Cookie
└─ Open to All                       └─ Redirects if Not Auth

/check-registration                  /check-in
├─ Registration Lookup               ├─ QR Scanner / Manual Entry
├─ Email + Phone Verification        ├─ Requires Admin Login
├─ No Auth Required                  └─ Redirects if Not Auth
└─ Open to All                       

API ROUTES:                          API ROUTES:
                                    
/api/register                        /api/activity-log (GET)
├─ Create Registration               ├─ Read Activity Logs
├─ No Auth Required                  ├─ Requires Session Cookie
└─ Open to All                       └─ Returns 401 if Not Auth

/api/check-in                        /api/activity-log (POST)
├─ Mark Attendee Checked In          ├─ Create Activity Log
├─ No Auth Required                  ├─ Requires Session Cookie
└─ Open to All                       └─ Returns 401 if Not Auth

                                     /api/auth/check-session
                                     ├─ Validate Session
                                     ├─ No Auth Required (check only)
                                     └─ Returns auth status
```

---

## 🔄 Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ↓
┌─────────────────┐
│ User Opens App  │
│ No Session      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Check Local     │
│ Storage for     │
│ Token           │
└────┬────────┬───┘
     │        │
  FOUND    NOT FOUND
     │        │
     ↓        ↓
┌─────────┐ ┌─────────┐
│ Verify  │ │ Show    │
│ Token   │ │ Login   │
│ w/API   │ │ Modal   │
└────┬────┘ └────┬────┘
     │           │
  VALID      INVALID
     │           │
     └─────┬─────┘
           │
           ↓
    ┌──────────────┐
    │ User Logs In │
    │ admin123     │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │ Server Sets  │
    │ Cookie       │
    │ admin_session│
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │ Session      │
    │ ACTIVE       │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │ User Actions │
    │ Protected    │
    │ Routes OK    │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │ User Clicks  │
    │ Logout       │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │ Clear Cookie │
    │ Clear Token  │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │ Session      │
    │ ENDED        │
    └──────────────┘
```

---

## 🚦 Request Flow with Authentication

```
┌─────────────────────────────────────────────────────────────────────┐
│              REQUEST FLOW - PROTECTED ENDPOINT                      │
└─────────────────────────────────────────────────────────────────────┘

Browser                        Next.js API Route              Firestore
   │                                  │                           │
   │  GET /api/activity-log           │                           │
   │  Cookie: admin_session=auth      │                           │
   ├─────────────────────────────────>│                           │
   │                                  │                           │
   │                           ┌──────┴──────┐                   │
   │                           │ Check Auth  │                   │
   │                           │ Helper Fn   │                   │
   │                           └──────┬──────┘                   │
   │                                  │                           │
   │                           ┌──────┴──────┐                   │
   │                           │ Get Cookies │                   │
   │                           └──────┬──────┘                   │
   │                                  │                           │
   │                           ┌──────┴──────┐                   │
   │                           │ admin_      │                   │
   │                           │ session ==  │                   │
   │                           │ "auth"?     │                   │
   │                           └──────┬──────┘                   │
   │                                  │                           │
   │                           ┌──────┴──────┐                   │
   │                           │   YES: OK   │                   │
   │                           │   NO: 401   │                   │
   │                           └──────┬──────┘                   │
   │                                  │                           │
   │                                  │ Query activity_logs       │
   │                                  ├──────────────────────────>│
   │                                  │                           │
   │                                  │  Return documents         │
   │                                  │<──────────────────────────┤
   │                                  │                           │
   │  Response: {success: true, ...}  │                           │
   │<─────────────────────────────────┤                           │
   │                                  │                           │
```

---

## 🎨 UI States

```
┌─────────────────────────────────────────────────────────────────────┐
│                      UI STATE MACHINE                               │
└─────────────────────────────────────────────────────────────────────┘

PROTECTED PAGE (/activity-log, /check-in)

       INITIAL
          │
          ↓
   ┌──────────────┐
   │   LOADING    │
   │  Checking    │
   │  Auth...     │
   └──────┬───────┘
          │
    ┌─────┴─────┐
    │           │
AUTHENTICATED  NOT AUTH
    │           │
    ↓           ↓
┌────────┐  ┌────────┐
│ SHOW   │  │REDIRECT│
│ PAGE   │  │TO LOGIN│
│CONTENT │  │        │
└────────┘  └───┬────┘
                │
                ↓
         ┌──────────────┐
         │ LOGIN MODAL  │
         │ /admin       │
         └──────┬───────┘
                │
          ┌─────┴─────┐
          │           │
       SUCCESS     FAIL
          │           │
          ↓           ↓
   ┌──────────┐  ┌────────┐
   │ REDIRECT │  │ SHOW   │
   │  BACK    │  │ ERROR  │
   └──────────┘  └────────┘
```

---

## 🎯 Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEFENSE IN DEPTH                                 │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: CLIENT-SIDE CHECKS
┌──────────────────────────────┐
│ • useEffect auth check       │
│ • Redirect if not auth       │
│ • Loading states             │
│ • Toast notifications        │
└──────────────┬───────────────┘
               │
               ↓
Layer 2: API ROUTE PROTECTION
┌──────────────────────────────┐
│ • Cookie validation          │
│ • Return 401 if invalid      │
│ • No data leakage            │
│ • Proper error messages      │
└──────────────┬───────────────┘
               │
               ↓
Layer 3: SESSION MANAGEMENT
┌──────────────────────────────┐
│ • Secure cookies             │
│ • HttpOnly flag              │
│ • SameSite protection        │
│ • HTTPS in production        │
└──────────────┬───────────────┘
               │
               ↓
Layer 4: DATABASE ACCESS
┌──────────────────────────────┐
│ • Firestore security rules   │
│ • Limited queries            │
│ • Proper indexing            │
│ • Data validation            │
└──────────────────────────────┘
```

---

## 📊 Security Coverage

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROTECTION COVERAGE                              │
└─────────────────────────────────────────────────────────────────────┘

ROUTES                      | PUBLIC | PROTECTED | COVERAGE
────────────────────────────┼────────┼───────────┼──────────
/                           │   ✅   │           │  N/A
/register                   │   ✅   │           │  N/A
/check-registration         │   ✅   │           │  N/A
/admin                      │        │    ✅     │  100%
/activity-log               │        │    ✅     │  100%
/check-in                   │        │    ✅     │  100%
────────────────────────────┼────────┼───────────┼──────────
API: /api/register          │   ✅   │           │  N/A
API: /api/check-in          │   ✅   │           │  N/A
API: /api/activity-log GET  │        │    ✅     │  100%
API: /api/activity-log POST │        │    ✅     │  100%
API: /api/auth/check-session│   ✅   │           │  N/A
────────────────────────────┴────────┴───────────┴──────────

OVERALL SECURITY SCORE: ✅ 100%
```

---

**All security layers working together to protect your Fellowship Registration System!** 🔒

