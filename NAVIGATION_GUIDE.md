# Navigation Guide

## Overview

The app now features **role-based navigation** that automatically adapts based on whether the user is a Patient (User) or a Therapist (PSM).

---

## 🧭 Navigation Components

### 1. Sidebar (Left Menu)
- **Responsive**: Collapses on mobile, always visible on desktop
- **Role-Aware**: Shows different menu items for Users vs PSMs
- **Active State**: Current page is highlighted with purple accent

### 2. Topbar (Header)
- **Dynamic Title**: Shows current page name
- **Wallet Display**: Shows shortened wallet address
- **Authentication**: Connect/Disconnect wallet button
- **Notifications**: Bell icon for future notifications

---

## 👥 User Navigation (Patients)

### Menu Items:

1. **🏠 Dashboard** (`/`)
   - Overview of user's therapy journey
   - Quick stats and recent activity

2. **👥 Find Therapist** (`/psms`)
   - Browse available PSMs
   - Search by name
   - Filter by specialization
   - View ratings and reviews
   - Select therapist and book first session

3. **📅 My Sessions** (`/sessions`)
   - View upcoming sessions
   - See past session history
   - Book new sessions
   - Cancel sessions
   - Rate completed sessions
   - Join session links

4. **💳 Wallet** (`/wallet`)
   - Manage wallet connection
   - View balance and transactions

5. **👤 My Therapist** (`/current-hire`)
   - View assigned PSM details
   - Contact information
   - Session history with current PSM

6. **💰 Payments** (`/payments`)
   - Payment history
   - Transaction records
   - Commission details

7. **⚙️ Profile** (`/profile`)
   - Edit personal information
   - Update preferences
   - Account settings

---

## 🩺 PSM Navigation (Therapists)

### Menu Items:

1. **🏠 Dashboard** (`/`)
   - Overview of PSM practice
   - Patient statistics
   - Upcoming sessions

2. **✅ Certification** (`/certifications`)
   - **Upload Documents**: Submit certification files
   - **Pay Activation Fee**: $65 one-time payment
   - **Track Status**: See approval progress
   - **View Approval**: Certificate details after approval
   - Multi-step workflow with progress indicator

3. **📅 My Sessions** (`/sessions`)
   - View all sessions with patients
   - Mark sessions as complete
   - Receive session ratings
   - Manage schedule
   - View session details and payments

4. **💳 Wallet** (`/wallet`)
   - Manage wallet connection
   - View earnings and transactions

5. **👥 PSM Management** (`/psms-register`)
   - Register as PSM
   - Update PSM profile
   - Manage certifications
   - View reputation score

6. **💰 Payments** (`/payments`)
   - View earnings
   - Commission breakdown
   - Payment history

7. **⚙️ Profile** (`/profile`)
   - Edit PSM profile
   - Update specializations
   - Account settings

---

## 🔄 Key User Flows

### Patient Flow
```
1. Find Therapist (/psms)
   ↓
2. Browse & Filter PSMs
   ↓
3. Select Therapist (opens modal)
   ↓
4. Schedule First Session
   ↓
5. Confirm & Pay
   ↓
6. View in My Sessions (/sessions)
   ↓
7. Join Session
   ↓
8. Rate Session (after completion)
```

### PSM Flow
```
1. Certification (/certifications)
   ↓
2. Upload Documents
   ↓
3. Pay $65 Activation Fee
   ↓
4. Wait for Approval
   ↓
5. View Assigned Patients (Dashboard)
   ↓
6. Manage Sessions (/sessions)
   ↓
7. Mark Sessions Complete
   ↓
8. Receive Ratings & Reviews
```

---

## 📍 Page Locations

### For Testing Navigation

**User Pages:**
- Dashboard: `http://localhost:3000/`
- Find Therapist: `http://localhost:3000/psms`
- My Sessions: `http://localhost:3000/sessions`
- My Therapist: `http://localhost:3000/current-hire`
- Wallet: `http://localhost:3000/wallet`
- Payments: `http://localhost:3000/payments`
- Profile: `http://localhost:3000/profile`

**PSM Pages:**
- Dashboard: `http://localhost:3000/`
- Certification: `http://localhost:3000/certifications`
- My Sessions: `http://localhost:3000/sessions`
- PSM Management: `http://localhost:3000/psms-register`
- Wallet: `http://localhost:3000/wallet`
- Payments: `http://localhost:3000/payments`
- Profile: `http://localhost:3000/profile`

---

## 🎨 Visual Indicators

### Active Page
- **Background**: Light purple (`#f7f7f8`)
- **Text Color**: Purple (`#635BFF`)
- **Font Weight**: Bold
- **Icon Color**: Purple

### Hover State
- **Background**: Light purple fade-in
- **Text Color**: Purple
- **Icon Color**: Purple
- **Transition**: Smooth 200ms

### Inactive Pages
- **Text Color**: Dark gray (`#222`)
- **Icon Color**: Light gray (`#bdbdbd`)

---

## 🔧 Technical Implementation

### Role Detection
The sidebar automatically detects user role using:
```typescript
const isPSM = offChainUserData?.isPSM || userRole === 'PSM';
```

### Navigation Arrays
Two separate navigation arrays:
- `userNavItems` - For patients
- `psmNavItems` - For PSMs

### Dynamic Display
```typescript
const navItems = isPSM ? psmNavItems : userNavItems;
```

---

## 🚀 Feature Highlights

### New Features in Navigation:

1. **📅 My Sessions** (Both Roles)
   - Tabs: Upcoming / Past / All
   - Book new sessions
   - Rate completed sessions
   - Cancel/Join actions
   - Real-time session counts

2. **✅ Certification** (PSMs Only)
   - Document upload with drag & drop
   - Payment integration
   - Status tracking
   - Multi-step progress

3. **👥 Find Therapist** (Users Only)
   - Advanced search & filters
   - PSM ratings display
   - In-place booking flow

4. **Dynamic Page Titles**
   - Topbar shows current section
   - Contextual navigation feedback

---

## 📱 Mobile Responsiveness

### Mobile Behavior:
- **Sidebar**: Hidden by default, opens via hamburger menu
- **Overlay**: Dark backdrop when sidebar is open
- **Body Scroll**: Locked when sidebar is open
- **Close Actions**: 
  - Tap outside sidebar
  - Tap close button (×)
  - Navigate to a page

### Desktop Behavior:
- **Sidebar**: Always visible
- **Width**: Fixed 256px
- **Position**: Static left column

---

## 🎯 Quick Access

### Most Important Pages:

**For Users:**
1. `/psms` - Start here to find a therapist
2. `/sessions` - Manage all bookings
3. `/current-hire` - View your assigned PSM

**For PSMs:**
1. `/certifications` - Required first step
2. `/sessions` - Manage patient sessions
3. `/psms-register` - Update PSM profile

---

## 🐛 Known Considerations

1. **Role Detection**
   - Sidebar adapts immediately on login
   - Based on database `isPSM` field
   - Falls back to on-chain role data

2. **Page Access**
   - Both roles can technically access all pages
   - Navigation only shows relevant pages
   - Future: Add route guards for role-specific pages

3. **Certification Requirement**
   - PSMs must complete certification before receiving patients
   - Navigation shows certification page prominently

---

## ✅ Testing Checklist

### Navigation Testing:

- [ ] Sidebar shows correct items for User role
- [ ] Sidebar shows correct items for PSM role
- [ ] Active page is highlighted correctly
- [ ] Topbar shows correct page title
- [ ] Mobile hamburger menu works
- [ ] Sidebar closes on navigation (mobile)
- [ ] All links navigate correctly
- [ ] Icons display properly
- [ ] Hover states work
- [ ] Role switching updates navigation

---

## 📚 Related Documentation

- **TESTING_GUIDE.md** - Comprehensive testing procedures
- **IMPLEMENTATION_SUMMARY.md** - Feature architecture
- **PROGRESS.md** - Development progress
- **DEPLOYMENT_CHECKLIST.md** - Deployment steps
