# Testing Guide - Motus Payment App

**Version**: 1.0  
**Last Updated**: 2025-10-22  
**Status**: Ready for Testing

---

## 🎯 Overview

This guide provides step-by-step testing procedures for all critical user flows in the Motus Payment App. Follow these tests to verify end-to-end functionality before deployment.

---

## 📋 Pre-Testing Setup

### 1. Environment Check
```bash
# Ensure you're in the project directory
cd /Users/cesarangulo/Documents/celo/payment-app/motus-payment-app

# Start development server
npm run dev

# Server should start at http://localhost:3000
```

### 2. Database Check
```bash
# Verify Prisma client is generated
npx prisma generate

# Check database connection
npx prisma studio
```

### 3. Required Test Data
- **Test Wallet Addresses**: Use Privy test mode or MetaMask test accounts
- **Test PSM Data**: Create at least 2 PSM profiles
- **Test User Data**: Create at least 2 user profiles

---

## 🧪 Test Suite 1: PSM Journey (Complete Flow)

### Test 1.1: PSM Registration
**Objective**: Verify PSM can create account

**Steps**:
1. Navigate to `/psms-register`
2. Connect wallet (Privy or MetaMask)
3. Fill form:
   - Nombre: "Dr. Test"
   - Apellido: "Therapist"
   - Email: "test.psm@motus.dao"
   - Cédula Profesional: "12345678"
   - Especialidades: Select "Ansiedad", "Depresión"
   - Experiencia: 5 años
   - Lugar Residencia: "Mexico City"
   - Biografía: "Test bio"
4. Submit form

**Expected Result**:
- ✅ Form submits successfully
- ✅ Redirected to `/certifications`
- ✅ PSM record created in database
- ✅ Status: `activo: false`, `certificado: false`

**Verification Query**:
```sql
SELECT * FROM "PSM" WHERE email = 'test.psm@motus.dao';
```

---

### Test 1.2: Certification Upload
**Objective**: Verify document upload functionality

**Steps**:
1. Should be on `/certifications` after registration
2. Verify "Upload" step is active
3. Drag & drop or click to select a PDF file (< 5MB)
4. Upload document

**Expected Result**:
- ✅ Upload progress indicator shows
- ✅ File validation (type, size) works
- ✅ Success message appears
- ✅ Automatically advances to "Payment" step
- ✅ Certification record created with `estado: 'pendiente'`

**Verification Query**:
```sql
SELECT * FROM "Certificacion" WHERE psmId = 'test-psm-id';
```

---

### Test 1.3: Payment Processing
**Objective**: Verify $65 activation fee payment

**Steps**:
1. On "Payment" step
2. Review payment breakdown:
   - Shows $65 USD
   - Lists included benefits
3. Click "Pagar $65 USD"
4. Complete payment (simplified for MVP)

**Expected Result**:
- ✅ Payment processing indicator
- ✅ Payment recorded: `pagado: true`
- ✅ Moves to "Pending" step
- ✅ fechaPago updated

**Verification Query**:
```sql
SELECT pagado, fechaPago FROM "Certificacion" WHERE psmId = 'test-psm-id';
```

---

### Test 1.4: Certification Pending State
**Objective**: Verify pending review UI

**Steps**:
1. Should be on "Pending" step
2. Verify display shows:
   - Yellow clock icon
   - "En Revisión" heading
   - 24-48 hour timeline
   - Checklist of completed items

**Expected Result**:
- ✅ Clear status communication
- ✅ Cannot proceed until admin approval
- ✅ Page refresh maintains state

---

### Test 1.5: Admin Approval (Manual)
**Objective**: Simulate admin approving certification

**Action** (via Prisma Studio or SQL):
```sql
-- Approve certification
UPDATE "Certificacion" 
SET estado = 'aprobada', "updatedDate" = NOW()
WHERE psmId = 'test-psm-id';

-- This should trigger PSM activation (via API)
UPDATE "PSM"
SET certificado = true, 
    activo = true, 
    disponible = true,
    fechaCertificacion = NOW(),
    estatusPago = 'pagado'
WHERE id = 'test-psm-id';

-- Create welcome reward
INSERT INTO "Recompensa" (
  receptorId, tipoReceptor, tipoRecompensa, puntos, descripcion
) VALUES (
  'test-psm-id', 'psm', 'certificacion', 50, 'Welcome bonus'
);
```

**Expected Result**:
- ✅ PSM activated in database
- ✅ 50 welcome points awarded

---

### Test 1.6: Certification Approved State
**Objective**: Verify approved certification UI

**Steps**:
1. Refresh `/certifications` page
2. Should show "Approved" step

**Expected Result**:
- ✅ Green checkmark icon
- ✅ "¡Certificación Aprobada!" heading
- ✅ List of what PSM can now do
- ✅ "Ver Mis Sesiones" button
- ✅ Button redirects to `/sessions`

---

### Test 1.7: View Sessions (Empty State)
**Objective**: Verify sessions page for PSM with no sessions

**Steps**:
1. Click "Ver Mis Sesiones" from approved certification
2. Navigate to `/sessions`

**Expected Result**:
- ✅ Page loads successfully
- ✅ Shows "Bienvenido, Dr. Test Therapist"
- ✅ Three tabs visible: Próximas, Pasadas, Todas
- ✅ Empty state shows: "No hay sesiones próximas"
- ✅ Calendar icon displayed
- ✅ No "Nueva Sesión" button (PSMs don't book)

---

### Test 1.8: Receive Patient Assignment (Manual)
**Objective**: Create test assignment for PSM

**Action** (via API or Database):
```sql
-- Create test user first
INSERT INTO "Usuario" (
  id, nombre, apellido, email, walletAddress, currentPsmId
) VALUES (
  'test-user-1', 'Test', 'Patient', 'patient@test.com', 
  '0xTestPatient', 'test-psm-id'
);

-- Create framing session
INSERT INTO "Sesion" (
  id, usuarioId, psmId, fechaSesion, tipoSesion, 
  duracionMinutos, estado
) VALUES (
  'test-session-1', 'test-user-1', 'test-psm-id',
  NOW() + INTERVAL '2 days', 'framing', 50, 'programada'
);
```

**Expected Result**:
- ✅ Assignment created
- ✅ Framing session scheduled

---

### Test 1.9: View Upcoming Session
**Objective**: PSM sees assigned patient session

**Steps**:
1. Refresh `/sessions`
2. Check "Próximas" tab

**Expected Result**:
- ✅ Session card appears
- ✅ Shows: "Paciente: Test Patient"
- ✅ Shows date & time
- ✅ Shows "framing" type
- ✅ Shows "GRATIS" payment indicator
- ✅ "Cancelar" and "Unirse" buttons visible
- ✅ Tab count shows (1)

---

### Test 1.10: Join Session
**Objective**: PSM joins video call

**Steps**:
1. Click "Unirse" button on session card

**Expected Result**:
- ✅ Opens Google Meet in new tab
- ✅ No errors in console

---

### Test 1.11: Mark Session Complete
**Objective**: PSM marks past session as complete

**Setup**: Modify session to be in the past
```sql
UPDATE "Sesion" 
SET fechaSesion = NOW() - INTERVAL '1 hour'
WHERE id = 'test-session-1';
```

**Steps**:
1. Refresh `/sessions`
2. Session should still show in "Próximas" (programada status)
3. "Marcar como Completada" button should appear
4. Click button
5. Enter payment amount: "30" USD
6. Confirm

**Expected Result**:
- ✅ Prompt for payment amount
- ✅ Session updated: `estado: 'completada'`
- ✅ `montoCobrado: 30`
- ✅ Commission calculated: $5 (accessible tier)
- ✅ PSM counters updated:
  - `totalSesiones` +1
  - `totalIngresos` +25 (30 - 5 commission)
- ✅ User `sesionesCompletadas` +1
- ✅ Rewards created (10 pts PSM, 5 pts User)
- ✅ Alert: "Session marked as complete! Rewards have been distributed."
- ✅ Session moves to "Pasadas" tab

**Verification Queries**:
```sql
-- Check session update
SELECT estado, montoCobrado, comisionPlataforma 
FROM "Sesion" WHERE id = 'test-session-1';

-- Check PSM stats
SELECT totalSesiones, totalIngresos 
FROM "PSM" WHERE id = 'test-psm-id';

-- Check rewards
SELECT * FROM "Recompensa" WHERE relacionadoId = 'test-session-1';
```

---

### Test 1.12: Receive Evaluation
**Objective**: Verify PSM receives rating from patient

**Note**: This test is completed from the User side (Test 2.8)

**Expected Result**:
- ✅ Evaluation visible in session record
- ✅ PSM reputation updated
- ✅ Average rating calculated

---

## 🧪 Test Suite 2: User Journey (Complete Flow)

### Test 2.1: User Registration
**Objective**: Patient creates account

**Steps**:
1. Navigate to `/user-register`
2. Connect wallet
3. Fill form:
   - Nombre: "Test"
   - Apellido: "Patient"
   - Email: "patient2@test.com"
   - Razón consulta: "Anxiety management"
4. Submit

**Expected Result**:
- ✅ User created in database
- ✅ Redirected to `/psms`

---

### Test 2.2: Browse PSMs
**Objective**: View available therapists

**Steps**:
1. On `/psms` page
2. Observe PSM cards

**Expected Result**:
- ✅ Only certified PSMs visible (`activo: true`)
- ✅ Each card shows:
  - Avatar with initials
  - Name
  - Star rating (if has reviews)
  - Specializations (up to 3 + more count)
  - Experience years
  - Location
  - Biography snippet
  - "Select Therapist" button

---

### Test 2.3: Search PSMs
**Objective**: Filter by name

**Steps**:
1. Enter "Dr. Test" in search box
2. Observe results update in real-time

**Expected Result**:
- ✅ Only matching PSMs shown
- ✅ Case-insensitive search
- ✅ Searches both nombre and apellido

---

### Test 2.4: Filter by Specialization
**Objective**: Filter by specialty

**Steps**:
1. Select "Ansiedad" from dropdown
2. Observe results

**Expected Result**:
- ✅ Only PSMs with "Ansiedad" specialty shown
- ✅ Count updates
- ✅ "All Specializations" resets filter

---

### Test 2.5: Select Therapist
**Objective**: Assign PSM to user

**Steps**:
1. Click "Select Therapist" on PSM card
2. Assignment modal opens

**Expected Result**:
- ✅ Modal displays:
  - PSM photo/avatar
  - Name
  - Star rating
  - Specializations
  - Biography
  - "Confirm Selection" button

---

### Test 2.6: Confirm Assignment & Schedule Framing Session
**Objective**: Complete therapist selection

**Steps**:
1. In modal, click "Confirm Selection"
2. Modal advances to scheduling step
3. Select a date (within next 7 days)
4. Select available time slot
5. Verify "FREE Framing Session" indicator
6. Click "Confirm Schedule"

**Expected Result**:
- ✅ Assignment API called with transaction
- ✅ User `currentPsmId` updated
- ✅ Framing session created:
  - `tipoSesion: 'framing'`
  - `montoCobrado: null`
  - `estado: 'programada'`
- ✅ Reward points created (5 pts for assignment)
- ✅ Success screen shows:
  - "Assignment Successful!"
  - Scheduled session details
  - "Go to Sessions" button
- ✅ Redirects to `/sessions`

**Verification Queries**:
```sql
-- Check assignment
SELECT currentPsmId FROM "Usuario" WHERE id = 'test-user-2';

-- Check framing session
SELECT * FROM "Sesion" 
WHERE usuarioId = 'test-user-2' AND tipoSesion = 'framing';

-- Check reward
SELECT * FROM "Recompensa" 
WHERE receptorId = 'test-user-2' AND tipoRecompensa = 'asignacion';
```

---

### Test 2.7: View Sessions & Book New Session
**Objective**: Manage sessions as user

**Steps**:
1. On `/sessions` page
2. Verify framing session appears in "Próximas"
3. Click "Nueva Sesión" button
4. SessionBookingModal opens

**Modal Flow**:
1. **Date step**: Select date from next 14 days grid
2. **Time step**: 
   - View available slots (9 AM - 8 PM, 50-min intervals)
   - Select time slot
3. **Payment step**:
   - Choose tier:
     - Symbolic: $10 (0% commission)
     - Accessible: $30 ($5 commission)
     - Full: $45 ($10 commission)
   - Review selection
4. Click "Book Session"
5. Success screen appears

**Expected Result**:
- ✅ Multi-step progress indicator works
- ✅ Availability API called correctly
- ✅ Time slots exclude booked sessions
- ✅ Payment tiers displayed correctly
- ✅ Session created in database
- ✅ Success message with details
- ✅ Modal auto-closes after 3 seconds
- ✅ Page refreshes showing new session

---

### Test 2.8: Cancel Session
**Objective**: User cancels upcoming session

**Steps**:
1. On session card, click "Cancelar"
2. Confirm cancellation dialog

**Expected Result**:
- ✅ Confirmation prompt: "Are you sure?"
- ✅ Session updated: `estado: 'cancelada'`
- ✅ Status badge changes to red "Cancelada"
- ✅ Moves to "Pasadas" tab
- ✅ No more action buttons

---

### Test 2.9: Join Session
**Objective**: User joins video call

**Steps**:
1. Click "Unirse" on upcoming session

**Expected Result**:
- ✅ Opens Google Meet in new tab

---

### Test 2.10: Rate Completed Session
**Objective**: Submit evaluation after session

**Setup**: Complete a session (Test 1.11 style)

**Steps**:
1. Navigate to "Pasadas" tab
2. Completed session shows "Evaluar Sesión" button
3. Click button
4. EvaluationModal opens
5. Fill evaluation:
   - Service rating: 5 stars
   - Therapist rating: 5 stars
   - Recommend: Yes
   - Comment: "Excellent session!"
6. Submit

**Expected Result**:
- ✅ Modal shows:
  - PSM name
  - Session date/time
  - Star rating inputs
  - Recommendation toggle
  - Comment textarea (500 char limit)
- ✅ Form validation works (all fields required except comment)
- ✅ Submission creates evaluation record
- ✅ PSM reputation updated:
  - `reputacion` += 2 * (service + therapist stars) = +20
  - Average rating recalculated
- ✅ User gets 3 reward points
- ✅ Success screen: "Thank You! You earned 3 reward points!"
- ✅ Auto-closes after 2 seconds
- ✅ Session refreshes to show "Sesión evaluada" indicator
- ✅ "Evaluar Sesión" button replaced with check icon

**Verification Queries**:
```sql
-- Check evaluation
SELECT * FROM "Evaluacion" WHERE sesionId = 'completed-session-id';

-- Check PSM reputation
SELECT reputacion, totalEvaluaciones 
FROM "PSM" WHERE id = 'test-psm-id';

-- Check user reward
SELECT * FROM "Recompensa" 
WHERE receptorId = 'test-user-id' AND tipoRecompensa = 'evaluacion';
```

---

## 🧪 Test Suite 3: Edge Cases

### Test 3.1: User Without PSM Assignment
**Objective**: Verify restricted access

**Steps**:
1. Create user without `currentPsmId`
2. Navigate to `/sessions`

**Expected Result**:
- ✅ No "Nueva Sesión" button visible
- ✅ Empty state shows
- ✅ No booking modal access

---

### Test 3.2: PSM Without Certification
**Objective**: Verify PSM cannot receive patients

**Steps**:
1. Create PSM with `certificado: false`
2. User attempts to browse PSMs

**Expected Result**:
- ✅ PSM not visible in `/psms` list
- ✅ Filter query excludes non-certified

---

### Test 3.3: Double Booking Prevention
**Objective**: Prevent slot conflicts

**Steps**:
1. Book session for PSM at 2:00 PM
2. Another user tries to book same PSM at 2:00 PM

**Expected Result**:
- ✅ Availability API excludes 2:00 PM slot
- ✅ Conflict prevented at database level

---

### Test 3.4: Invalid File Upload
**Objective**: Verify file validation

**Test Cases**:
1. File too large (> 5MB)
2. Wrong file type (.txt, .exe)
3. Empty file

**Expected Result**:
- ✅ Error message displays
- ✅ Upload blocked
- ✅ User can retry

---

### Test 3.5: Network Error Handling
**Objective**: Graceful failure

**Simulation**: Kill backend mid-request

**Expected Result**:
- ✅ Error message shown
- ✅ No white screen of death
- ✅ User can retry action

---

### Test 3.6: Form Validation
**Objective**: Prevent invalid submissions

**Test Cases**:
1. Empty required fields
2. Invalid email format
3. Rating without all stars selected
4. Payment without date/time

**Expected Result**:
- ✅ Submit button disabled or validation error
- ✅ Clear error messages
- ✅ Field highlighting

---

### Test 3.7: Session in Progress
**Objective**: Verify current session handling

**Steps**:
1. Session scheduled for current time (NOW)
2. Check tabs

**Expected Result**:
- ✅ Appears in "Próximas" if status = 'programada'
- ✅ "Unirse" button available
- ✅ Proper date/time formatting

---

### Test 3.8: Page Refresh State Persistence
**Objective**: Verify state reloads correctly

**Steps**:
1. Navigate through multi-step modal (certification or booking)
2. Refresh page mid-flow

**Expected Result**:
- ✅ Correct step loaded from database
- ✅ No data loss
- ✅ User can continue or restart

---

### Test 3.9: Mobile Responsiveness
**Objective**: Verify mobile UI

**Steps**:
1. Open app in mobile viewport (375px)
2. Navigate all pages

**Expected Result**:
- ✅ All pages responsive
- ✅ Modals stack vertically
- ✅ Buttons accessible
- ✅ Text readable
- ✅ Forms usable

---

### Test 3.10: Browser Back Button
**Objective**: Navigation doesn't break

**Steps**:
1. Navigate: Home → PSMs → Select → Sessions
2. Hit back button repeatedly

**Expected Result**:
- ✅ No crashes
- ✅ Modals close properly
- ✅ State maintained

---

## 📊 Success Criteria

### Minimum Pass Requirements (MVP Launch)
- [x] All PSM Journey tests pass (1.1 - 1.12)
- [x] All User Journey tests pass (2.1 - 2.10)
- [x] Zero TypeScript errors
- [x] No console errors on happy paths
- [x] Core edge cases handled (3.1 - 3.5)

### Nice to Have (Post-MVP)
- [ ] All edge cases pass (3.1 - 3.10)
- [ ] Performance optimized (< 3s page loads)
- [ ] Automated E2E tests with Playwright/Cypress
- [ ] Lighthouse score > 90

---

## 🐛 Bug Reporting Template

When you find issues during testing, document them as:

```markdown
**Bug ID**: BUG-001
**Test**: Test 2.7 - Book New Session
**Severity**: High | Medium | Low
**Description**: SessionBookingModal doesn't show available slots
**Steps to Reproduce**:
1. Navigate to /sessions
2. Click "Nueva Sesión"
3. Select date
**Expected**: Time slots appear
**Actual**: Empty list shown
**Console Errors**: [paste errors here]
**Screenshot**: [attach if relevant]
```

---

## ✅ Testing Checklist

Use this checklist to track your testing progress:

### Phase 1: Smoke Tests
- [ ] App starts without errors (`npm run dev`)
- [ ] All pages load (/, /psms, /sessions, /certifications)
- [ ] Database connection works
- [ ] Wallet connection works

### Phase 2: PSM Flow
- [ ] Test 1.1 - Registration
- [ ] Test 1.2 - Upload
- [ ] Test 1.3 - Payment
- [ ] Test 1.4 - Pending
- [ ] Test 1.5 - Admin Approval (manual)
- [ ] Test 1.6 - Approved State
- [ ] Test 1.7 - View Sessions (empty)
- [ ] Test 1.8 - Receive Assignment (setup)
- [ ] Test 1.9 - View Upcoming Session
- [ ] Test 1.10 - Join Session
- [ ] Test 1.11 - Mark Complete
- [ ] Test 1.12 - Receive Evaluation

### Phase 3: User Flow
- [ ] Test 2.1 - Registration
- [ ] Test 2.2 - Browse PSMs
- [ ] Test 2.3 - Search
- [ ] Test 2.4 - Filter
- [ ] Test 2.5 - Select Therapist
- [ ] Test 2.6 - Confirm & Schedule
- [ ] Test 2.7 - Book New Session
- [ ] Test 2.8 - Cancel Session
- [ ] Test 2.9 - Join Session
- [ ] Test 2.10 - Rate Session

### Phase 4: Edge Cases
- [ ] Test 3.1 - User without PSM
- [ ] Test 3.2 - Uncertified PSM
- [ ] Test 3.3 - Double booking
- [ ] Test 3.4 - Invalid upload
- [ ] Test 3.5 - Network errors
- [ ] Test 3.6 - Form validation
- [ ] Test 3.7 - Current sessions
- [ ] Test 3.8 - Page refresh
- [ ] Test 3.9 - Mobile UI
- [ ] Test 3.10 - Back button

---

## 🎉 Completion

Once all tests pass, your app is ready for:
1. **Stakeholder Demo** - Show completed flows
2. **User Acceptance Testing** - Real user feedback
3. **Staging Deployment** - Deploy to test environment
4. **Production Launch** - Go live!

---

**Happy Testing! 🚀**
