# Implementation Plan: Critical Features

## Overview
This document outlines the implementation plan for 4 critical missing features in the Motus Payment App. Each feature is broken down into backend (API) and frontend (UI) components with clear dependencies and testing steps.

---

## Feature 1: Evaluations/Ratings System

### Priority: HIGH
**Estimated Time**: 4-6 hours

### Backend Components

#### 1.1 Create `/api/evaluations/route.ts`
**File**: `src/app/api/evaluations/route.ts`

**Endpoints**:
- `GET /api/evaluations` - List evaluations with filters
  - Query params: `usuarioId`, `psmId`, `sesionId`, `minRating`
  - Returns evaluations with related session/PSM/user data
  
- `POST /api/evaluations` - Create new evaluation
  - Required fields: `sesionId`, `usuarioId`, `psmId`, `calificacionServicio`, `calificacionPsm`, `recomendaria`
  - Optional: `comentario`
  - Validation: 1-5 rating scale, session must be completed
  - Side effects:
    - Update PSM reputation points
    - Mark session as evaluated
    - Create reward points for user (bonus for leaving feedback)

**Key Logic**:
```javascript
// Reputation calculation
const reputationBonus = calificacionPsm * 2; // 2-10 points per rating
await prisma.pSM.update({
  where: { id: psmId },
  data: {
    reputacionPuntos: { increment: reputationBonus }
  }
});
```

**Dependencies**: None (Prisma model already exists)

---

### Frontend Components

#### 1.2 Create Evaluation Modal Component
**File**: `src/app/components/EvaluationModal.tsx`

**Features**:
- Star rating UI (1-5 stars) for service and PSM
- Yes/No toggle for "Would you recommend?"
- Optional text area for comments
- Submit button with loading state
- Thank you confirmation state

**Props**:
```typescript
interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    psmId: string;
    psmName: string;
    fechaSesion: Date;
  };
  onSubmitSuccess: () => void;
}
```

#### 1.3 Display PSM Ratings
**File**: Update `src/app/psms/page.tsx`

**Enhancements**:
- Show average rating (stars) on PSM cards
- Display total number of reviews
- Add rating filter/sort options

#### 1.4 Session Evaluation Trigger
**File**: `src/app/sessions/page.tsx` (to be created in Feature 3)

**Behavior**:
- Show "Rate Session" button for completed sessions without evaluation
- Automatically prompt for evaluation 1 hour after session completion
- Show "Already Rated" badge for evaluated sessions

---

## Feature 2: Certification Upload & Payment UI

### Priority: HIGH
**Estimated Time**: 6-8 hours

### Backend Components

#### 2.1 File Upload API (if not using external storage)
**File**: `src/app/api/upload/route.ts`

**Options**:
- **Option A**: Direct to cloud storage (Cloudinary, AWS S3, Vercel Blob)
- **Option B**: Base64 encoding (not recommended for production)
- **Recommended**: Use Vercel Blob for simplicity

**Endpoint**:
- `POST /api/upload` - Upload certification document
  - Accept file upload (PDF, JPG, PNG)
  - Return secure URL
  - Max file size: 5MB

#### 2.2 Enhance Certification API
**File**: Update `src/app/api/certifications/route.ts`

**Changes**:
- Add validation for file type/size
- Add webhook endpoint for payment confirmation
- Add status transitions logic

---

### Frontend Components

#### 2.3 Create Certifications Page
**File**: `src/app/certifications/page.tsx`

**Layout** (Multi-step flow):

**Step 1: Upload Documents**
```
┌─────────────────────────────────────┐
│  📄 Upload Professional License     │
│  [Drag & Drop or Click to Browse]  │
│  ✓ cedula_profesional.pdf          │
├─────────────────────────────────────┤
│  📄 Upload Additional Credentials   │
│  [Drag & Drop or Click to Browse]  │
│  ✓ diploma.pdf                      │
├─────────────────────────────────────┤
│  [Continue to Payment]              │
└─────────────────────────────────────┘
```

**Step 2: Payment**
```
┌─────────────────────────────────────┐
│  💳 Certification Fee: $65 USD      │
│                                     │
│  Payment Options:                   │
│  ○ Transak (Credit Card/Bank)      │
│  ○ Wallet (CELO/cUSD)              │
├─────────────────────────────────────┤
│  [Process Payment]                  │
└─────────────────────────────────────┘
```

**Step 3: Review Pending**
```
┌─────────────────────────────────────┐
│  ⏳ Under Review                    │
│                                     │
│  Your documents are being reviewed  │
│  by our team. This typically takes  │
│  2-3 business days.                 │
│                                     │
│  Status: Payment Confirmed ✓        │
│  Status: Documents Pending Review   │
└─────────────────────────────────────┘
```

**Components to Create**:
- `FileUploader.tsx` - Drag & drop file upload component
- `CertificationStatus.tsx` - Status badge and timeline
- `PaymentSelector.tsx` - Toggle between Transak and wallet payment

**State Management**:
```typescript
type CertificationStep = 'upload' | 'payment' | 'pending' | 'approved' | 'rejected';
const [currentStep, setCurrentStep] = useState<CertificationStep>('upload');
```

#### 2.4 PSM Registration Flow Update
**File**: Update `src/app/psms-register/page.tsx`

**Changes**:
- After successful registration, redirect to `/certifications`
- Show certification requirement message
- Add "Skip for now" option (PSM inactive until certified)

---

## Feature 3: Session Booking & Management UI

### Priority: HIGH
**Estimated Time**: 8-10 hours

### Backend Components

#### 3.1 Session Availability API
**File**: `src/app/api/sessions/availability/route.ts`

**Endpoint**:
- `GET /api/sessions/availability?psmId=xxx&date=YYYY-MM-DD`
  - Returns available time slots for PSM on given date
  - Blocks already booked slots
  - Returns PSM's working hours

**Logic**:
```javascript
// Get PSM's existing sessions for date
const existingSessions = await prisma.sesion.findMany({
  where: {
    psmId,
    fechaSesion: {
      gte: startOfDay(date),
      lte: endOfDay(date)
    },
    estado: { notIn: ['cancelada'] }
  }
});

// Generate available slots (9 AM - 8 PM, 50-min sessions + 10-min break)
const slots = generateTimeSlots(existingSessions);
```

---

### Frontend Components

#### 3.2 Create Sessions Dashboard Page
**File**: `src/app/sessions/page.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Session Management                                  │
├─────────────────────────────────────────────────────┤
│  Tabs: [ Upcoming | Past | All ]                    │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐       │
│  │ 📅 Jan 15, 2025 • 3:00 PM               │       │
│  │ 👤 Dr. Maria Lopez                       │       │
│  │ 🏷️  Individual Session (50 min)          │       │
│  │ 💰 $45 USD                               │       │
│  │                                          │       │
│  │ [Join] [Cancel] [Reschedule]            │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │ 📅 Jan 10, 2025 • 2:00 PM (Completed)   │       │
│  │ 👤 Dr. Carlos Ruiz                       │       │
│  │ ⭐⭐⭐⭐⭐ Rated                            │       │
│  │                                          │       │
│  │ [View Details]                           │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

**Features**:
- Filter by status (programada, completada, cancelada)
- Sort by date
- Session action buttons based on status
- Color coding for session types

#### 3.3 Create Session Booking Modal
**File**: `src/app/components/SessionBookingModal.tsx`

**Flow**:
1. **Select Date** - Calendar picker (disable past dates)
2. **Select Time** - Show available slots from availability API
3. **Confirm Details** - Summary with PSM info, date, time, estimated cost
4. **Payment Method** - Select payment tier ($5-$45)

**Props**:
```typescript
interface SessionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  psmId: string;
  psmName: string;
  userId: string;
}
```

**State Machine**:
```typescript
type BookingStep = 'date' | 'time' | 'confirm' | 'payment' | 'success';
const [step, setStep] = useState<BookingStep>('date');
```

#### 3.4 Create Session Detail Modal
**File**: `src/app/components/SessionDetailModal.tsx`

**Content**:
- Session date/time
- PSM/User information
- Session type and notes
- Payment information
- Actions: Cancel (if upcoming), Rate (if completed), Download receipt

#### 3.5 Calendar Integration Component
**File**: `src/app/components/SessionCalendar.tsx`

**Library**: Use `react-big-calendar` or `@fullcalendar/react`

**Features**:
- Month/week/day views
- Color-coded sessions by type
- Click event to view details
- Drag to reschedule (future enhancement)

---

## Feature 4: Functional PSM Assignment Flow

### Priority: CRITICAL
**Estimated Time**: 6-8 hours

### Backend Components

#### 4.1 Assignment Confirmation API
**File**: Update `src/app/api/assignments/route.ts`

**Enhancement to POST endpoint**:
- Add transaction wrapper for atomic operations:
  1. Update user's `currentPsmId`
  2. Create framing session
  3. Create reward for PSM
  4. Send notification (future)

**Response Structure**:
```json
{
  "success": true,
  "assignment": {
    "usuario": { ... },
    "psm": { ... },
    "framingSession": {
      "id": "session-123",
      "fechaSesion": "2025-01-16T14:00:00Z",
      "tipoSesion": "encuadre"
    }
  },
  "message": "Successfully assigned to Dr. Maria Lopez"
}
```

---

### Frontend Components

#### 4.2 Enhance PSM Browse Page
**File**: Update `src/app/psms/page.tsx`

**Current State**: Basic list with non-functional "Hire PSM" button

**Target State**:

**Layout Changes**:
```
┌─────────────────────────────────────────────────────┐
│  Find Your Therapist                                 │
├─────────────────────────────────────────────────────┤
│  [Search] [Filter by Specialization ▼]              │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐           │
│  │ 👤 Dr. Maria Lopez                   │           │
│  │ ⭐⭐⭐⭐⭐ 4.8 (24 reviews)            │           │
│  │ 🎓 10 years experience               │           │
│  │ 🏷️  Anxiety, Depression, Trauma      │           │
│  │                                      │           │
│  │ "Cognitive-behavioral approach..."   │           │
│  │                                      │           │
│  │ [View Profile] [Select Therapist]    │           │
│  └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

**Enhancements**:
- Display PSM ratings and review count
- Show specializations as tags
- Add "View Profile" button for detailed bio
- Make "Select Therapist" button functional

#### 4.3 Create PSM Assignment Confirmation Modal
**File**: `src/app/components/AssignmentConfirmationModal.tsx`

**Flow**:

**Step 1: Confirm Selection**
```
┌─────────────────────────────────────────┐
│  Confirm Your Therapist Selection       │
├─────────────────────────────────────────┤
│  👤 Dr. Maria Lopez                     │
│  ⭐⭐⭐⭐⭐ 4.8 (24 reviews)              │
│                                         │
│  Specializations:                       │
│  • Anxiety & Depression                 │
│  • Cognitive-Behavioral Therapy         │
│  • Trauma Recovery                      │
│                                         │
│  Next Steps:                            │
│  1. Schedule framing session (free)     │
│  2. Discuss therapeutic goals           │
│  3. Begin regular sessions              │
│                                         │
│  [Cancel] [Confirm Selection]           │
└─────────────────────────────────────────┘
```

**Step 2: Schedule Framing Session**
```
┌─────────────────────────────────────────┐
│  Schedule Your Framing Session          │
├─────────────────────────────────────────┤
│  A framing session helps establish      │
│  therapeutic goals and expectations.    │
│                                         │
│  📅 Select Date: [Calendar Picker]      │
│  🕐 Select Time: [Time Slots]           │
│                                         │
│  Duration: 50 minutes                   │
│  Cost: FREE (first session)             │
│                                         │
│  [Back] [Confirm & Schedule]            │
└─────────────────────────────────────────┘
```

**Step 3: Success**
```
┌─────────────────────────────────────────┐
│  🎉 Assignment Successful!              │
├─────────────────────────────────────────┤
│  You're now connected with              │
│  Dr. Maria Lopez                        │
│                                         │
│  📅 Framing Session Scheduled:          │
│  January 16, 2025 at 2:00 PM            │
│                                         │
│  We've sent confirmation details to     │
│  your email.                            │
│                                         │
│  [View My Sessions] [Go to Dashboard]   │
└─────────────────────────────────────────┘
```

**Props**:
```typescript
interface AssignmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  psm: {
    id: string;
    nombre: string;
    apellido: string;
    especialidades: string[];
    biografia: string;
    reputacionPuntos: number;
    totalSesiones: number;
  };
  userId: string;
}
```

**State Management**:
```typescript
type AssignmentStep = 'confirm' | 'schedule' | 'success';
const [step, setStep] = useState<AssignmentStep>('confirm');
const [selectedDate, setSelectedDate] = useState<Date | null>(null);
const [selectedTime, setSelectedTime] = useState<string | null>(null);
```

#### 4.4 Create PSM Profile Detail Modal
**File**: `src/app/components/PSMProfileModal.tsx`

**Content**:
- Full bio and approach
- Education and credentials
- Complete list of specializations
- Session pricing information
- Availability overview
- Reviews/testimonials section

#### 4.5 Add "My Therapist" View
**File**: Update `src/app/current-hire/page.tsx`

**Features**:
- Show currently assigned PSM details
- Quick actions: Schedule session, Message (future), Change therapist
- Session history with this PSM
- Payment summary

---

## Implementation Order

### Phase 1: Backend Foundation (Days 1-2)
1. ✅ Create `/api/evaluations` route
2. ✅ Create `/api/upload` route (if needed)
3. ✅ Create `/api/sessions/availability` route
4. ✅ Enhance `/api/assignments` POST endpoint

### Phase 2: Core UI Components (Days 3-4)
5. ✅ `EvaluationModal.tsx`
6. ✅ `FileUploader.tsx`
7. ✅ `SessionBookingModal.tsx`
8. ✅ `AssignmentConfirmationModal.tsx`

### Phase 3: Main Pages (Days 5-6)
9. ✅ `/certifications` page
10. ✅ `/sessions` page
11. ✅ Update `/psms` page

### Phase 4: Integration & Testing (Days 7-8)
12. ✅ Connect all modals to APIs
13. ✅ Add loading states and error handling
14. ✅ Test complete user flows
15. ✅ Add data validation and edge cases

---

## Testing Checklist

### Feature 1: Evaluations
- [ ] Create evaluation after completed session
- [ ] Prevent duplicate evaluations
- [ ] PSM reputation updates correctly
- [ ] Rating validation (1-5 scale)
- [ ] Display ratings on PSM cards

### Feature 2: Certifications
- [ ] Upload PDF/image files
- [ ] File size validation (max 5MB)
- [ ] Payment processing via Transak
- [ ] Status updates reflect in PSM profile
- [ ] PSM activation after approval + payment

### Feature 3: Sessions
- [ ] Book session with available time slot
- [ ] View upcoming sessions
- [ ] Cancel/reschedule session
- [ ] Mark session as completed
- [ ] Trigger evaluation after completion

### Feature 4: Assignment
- [ ] Browse PSMs with correct data
- [ ] Select and confirm PSM assignment
- [ ] Framing session auto-created
- [ ] User's currentPsmId updated
- [ ] Reward points awarded to PSM

---

## File Structure Summary

```
src/app/
├── api/
│   ├── evaluations/
│   │   └── route.ts                    [NEW]
│   ├── upload/
│   │   └── route.ts                    [NEW]
│   ├── sessions/
│   │   ├── route.ts                    [EXISTS]
│   │   └── availability/
│   │       └── route.ts                [NEW]
│   └── assignments/
│       └── route.ts                    [UPDATE]
│
├── certifications/
│   └── page.tsx                        [NEW]
│
├── sessions/
│   └── page.tsx                        [NEW]
│
├── psms/
│   └── page.tsx                        [UPDATE]
│
├── current-hire/
│   └── page.tsx                        [UPDATE]
│
└── components/
    ├── EvaluationModal.tsx             [NEW]
    ├── FileUploader.tsx                [NEW]
    ├── CertificationStatus.tsx         [NEW]
    ├── PaymentSelector.tsx             [NEW]
    ├── SessionBookingModal.tsx         [NEW]
    ├── SessionDetailModal.tsx          [NEW]
    ├── SessionCalendar.tsx             [NEW]
    ├── AssignmentConfirmationModal.tsx [NEW]
    └── PSMProfileModal.tsx             [NEW]
```

---

## Dependencies to Install

```bash
# Calendar/Date Components
npm install react-big-calendar date-fns

# File Upload
npm install react-dropzone

# Star Rating
npm install react-rating-stars-component

# Additional Icons (if needed)
npm install lucide-react
```

---

## Environment Variables

Add to `.env.local`:

```bash
# File Upload (if using Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here

# Transak
NEXT_PUBLIC_TRANSAK_API_KEY=your_transak_key

# Payment Webhook Secret (if needed)
TRANSAK_WEBHOOK_SECRET=your_webhook_secret
```

---

## Success Metrics

After implementation, these user flows should be complete:

### PSM Journey
1. ✅ Register as PSM
2. ✅ Upload certification documents
3. ✅ Pay $65 activation fee
4. ✅ Get approved and activated
5. ✅ Receive patient assignments
6. ✅ View scheduled sessions
7. ✅ Receive ratings/feedback

### User Journey  
1. ✅ Register as patient
2. ✅ Browse PSMs with ratings
3. ✅ Select and confirm PSM
4. ✅ Schedule framing session
5. ✅ Book regular sessions
6. ✅ Complete sessions
7. ✅ Rate PSM and sessions

---

## Next Steps After MVP

1. **Email Notifications** - Session reminders, booking confirmations
2. **In-App Messaging** - PSM-Patient communication
3. **Video Session Integration** - Zoom/Google Meet links
4. **Advanced Analytics** - Dashboard with charts and trends
5. **Mobile Optimization** - PWA or React Native app
6. **Admin Panel** - Review certifications, manage disputes
7. **Payment History** - Detailed transaction logs
8. **Prescription Management** - Digital prescription system (if applicable)
