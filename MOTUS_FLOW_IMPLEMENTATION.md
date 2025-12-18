# MotusDAO User Flow Implementation 

## 🎯 Overview

This implementation adapts the MotusDAO platform to support the complete user flows outlined in your launch plan. The system now handles the end-to-end journey for both PSMs (therapists) and users (patients) with proper database structures, APIs, and user interfaces.

## 📊 Database Schema Enhancements

### Enhanced PSM Model
- **Professional Information**: License numbers, specializations, academic background, years of experience, professional biography, profile photos
- **Certification & Status**: Certification status, payment status, active/available flags
- **Platform Participation**: Flags for supervision, courses, research, and community activities
- **Reputation & Metrics**: Reputation points, total sessions, total earnings tracking

### Enhanced Usuario Model
- **Therapeutic Profile**: Main concerns, type of attention needed, assignment preferences
- **Process Status**: Registration → Framing → Active → Paused states
- **Payment Preferences**: Payment modality and amount tracking

### New Supporting Models
- **Sesion**: Complete session management with pricing, commission calculation, notes
- **Evaluacion**: Session feedback and rating system
- **Certificacion**: PSM document verification and payment processing
- **Recompensa**: Token reward system for both PSMs and users
- **Newsletter**: Email list management
- **ConfiguracionPlataforma**: Platform-wide settings management

## 🚀 API Endpoints

### PSM Management (`/api/psms`)
- **GET**: List PSMs with filters (status, specialization, availability)
- **POST**: Register new PSM with complete professional profile
- Automatic certification record creation
- Professional validation (license, experience, specializations)

### User Management (`/api/users`)
- **GET**: Retrieve users with therapeutic profiles
- **POST**: Register users with therapeutic needs and preferences
- Automatic PSM matching based on preferences

### Session Management (`/api/sessions`)
- **GET**: Retrieve sessions by user, PSM, or status
- **POST**: Schedule new therapy sessions
- **PATCH**: Update session status, add notes, process payments
- Automatic commission calculation based on payment tiers:
  - $5-$15: 0% commission (symbolic payments)
  - $20-$40: $5 fixed commission
  - $45: $10 commission (standard rate)

### Certification System (`/api/certifications`)
- **GET**: List certification requests and statuses
- **POST**: Upload certification documents
- **PATCH**: Review and approve certifications
- **PUT**: Process certification payments ($65 USD)
- Automatic PSM activation upon approval and payment

### Assignment System (`/api/assignments`)
- **GET**: Smart PSM recommendations based on user preferences
- **POST**: Assign users to PSMs with automatic framing session creation
- **PATCH**: Manage assignment changes and process status

## 💻 User Interface Components

### PSM Registration (`/psms-register`)
- **3-Section Form**:
  1. Basic Information (personal details)
  2. Professional Information (license, specializations, experience)
  3. Platform Participation (optional activities)
- **Specialization Selection**: Multi-select checkboxes for therapeutic approaches
- **Form Validation**: Comprehensive validation for professional requirements
- **Success Flow**: Clear next steps for certification

### User Registration (`/user-register`)
- **Therapeutic Onboarding**: Focus on mental health needs
- **Assignment Preferences**: Choose between automatic matching or profile exploration
- **Privacy-First**: Clear data usage communication
- **Encouraging UX**: Supportive language for mental health journey

## 🔄 Complete User Flows

### PSM Journey
1. **Registration**: Complete professional profile with specializations
2. **Document Upload**: Submit certification documents
3. **Payment**: Pay $65 USD certification fee
4. **Review**: Platform team reviews credentials
5. **Activation**: PSM becomes active and can receive patients
6. **Patient Reception**: Automatic or manual patient assignment
7. **Session Management**: Schedule, conduct, and track sessions
8. **Rewards**: Earn tokens for sessions, community participation

### User Journey
1. **Registration**: Provide therapeutic needs and preferences
2. **PSM Assignment**: Automatic matching or profile exploration
3. **Framing Session**: Initial therapeutic framework discussion
4. **Payment Agreement**: Establish payment tier (symbolic/accessible/full)
5. **Regular Sessions**: Ongoing therapy with session tracking
6. **Feedback**: Rate sessions and PSMs
7. **Community**: Access to content and community features

## 💰 Economic Model Implementation

### Commission Structure
- **Symbolic Payments ($5-$15)**: 0% commission - full amount to PSM
- **Accessible Payments ($20-$40)**: $5 fixed commission
- **Full Payments ($45)**: $10 commission
- **Certification Fee**: $65 one-time payment for PSM activation

### Reward System
- **Session Completion**: 10 points for PSMs, 5 points for users
- **Certification**: 50 welcome bonus points for new PSMs
- **Patient Assignment**: 5 points for new patient connections
- **Community Participation**: Variable points for activities

## 🛡️ Key Features

### Data Integrity
- Unique email constraints for both PSMs and users
- Proper relational integrity with cascading rules
- Audit trails with created/updated timestamps

### Security & Privacy
- Wallet integration for optional blockchain features
- Secure session notes and therapeutic information
- Privacy-first user registration flow

### Scalability
- Efficient database queries with proper indexing
- Pagination support for large datasets
- Modular API structure for easy expansion

### User Experience
- Progressive disclosure in registration forms
- Clear status indicators throughout user journeys
- Responsive design for mobile and desktop

## 🚧 Next Steps for Launch

### Phase 1: MVP Launch (Immediate)
1. **Database Migration**: Apply all schema changes
2. **Testing**: Comprehensive testing of all flows
3. **Content**: Add real PSM profiles and specializations
4. **UI Polish**: Final design and UX improvements

### Phase 2: Post-Launch Enhancements
1. **Analytics Dashboard**: KPI tracking for both user types
2. **Advanced Matching**: ML-based PSM-user matching algorithms
3. **Community Features**: Forums, group sessions, educational content
4. **Mobile App**: React Native implementation
5. **Payment Integration**: Full Transak/Stripe integration

## 📋 Critical Launch Checklist

- [ ] Test PSM registration flow end-to-end
- [ ] Test user registration and assignment flow
- [ ] Verify session booking and payment processing
- [ ] Test certification approval process
- [ ] Validate reward point distribution
- [ ] Ensure email notifications work
- [ ] Check mobile responsiveness
- [ ] Security audit of API endpoints
- [ ] Load testing for expected user volume
- [ ] Backup and recovery procedures

## 🎊 Success Metrics

### User Acquisition
- PSM registrations per week
- User registrations per week
- Conversion rate from registration to first session

### Engagement
- Session completion rate
- User retention at 30, 60, 90 days
- PSM utilization rate (sessions per PSM)

### Economic
- Total platform revenue
- Average session value
- Certification conversion rate

The platform is now fully equipped to handle the complete MotusDAO user experience as outlined in your launch plan. The architecture supports both the current MVP requirements and future scaling needs while maintaining the human-centered approach that's core to the mental health mission.
