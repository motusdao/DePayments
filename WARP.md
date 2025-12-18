# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Motus Payment App** is a Next.js 15 frontend application for the MotusDAO mental health therapy platform, built on the Celo blockchain using Alfajores testnet. It enables therapists (PSMs - Professional Mental Health Providers) and users (patients) to connect for therapy sessions with blockchain-based payment tracking.

**Related Projects**: Smart contracts located at `/Users/cesarangulo/documents/celo/motus-contracts/`

## Development Commands

### Essential Commands
```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Database Commands
```bash
npx prisma generate    # Generate Prisma client (output: src/generated/prisma)
npx prisma migrate dev # Run database migrations
npx prisma studio      # Open Prisma Studio GUI
```

## Architecture

### Smart Wallet Integration (Privy + ZeroDev)

The app uses **Account Abstraction (ERC-4337)** with a dual-wallet approach:

1. **Privy Embedded Wallets**: Email-based authentication creates EOA wallets
2. **ZeroDev Kernel Accounts**: Smart accounts (v3.1) with ERC-4337 EntryPoint v0.7 for gasless transactions

**Key Flow**:
- User authenticates via Privy (email or MetaMask)
- `LocalSmartWalletProvider` detects wallet and creates ZeroDev Kernel account
- Kernel client acts as drop-in replacement for viem Wallet Client
- All transactions go through ZeroDev bundler with paymaster for gas sponsorship

**Critical Files**:
- `src/app/providers/AccountAbstraction.tsx` - ZeroDev integration following Privy's official patterns
- `src/contracts/contractService.ts` - Contract interactions using Kernel client
- `src/hooks/useMotusContracts.ts` - React hook wrapping contract operations

### Smart Contract Integration

**Contracts (Celo Alfajores)**:
- `MotusAssignmentsV2` (0x1039...B2D) - PSM-User assignments with self-registration
- `MotusCertificates` (0xD3FD...c3E) - PSM certification management
- `MotusEvaluations` (0xDaD8...3b) - Session feedback/ratings

**Two Transaction Patterns**:
1. **Admin-Assigned**: PSM creates assignment for user (legacy)
2. **Self-Registration**: User calls `registerUser()` to create own assignment (V2 feature)

### Database Architecture (Prisma + PostgreSQL)

**Core Models**:
- `PSM` - Therapist profiles with certifications, specializations, reputation
- `Usuario` - Patient profiles with therapeutic needs and process status
- `Sesion` - Therapy sessions with pricing and commission tracking
- `Certificacion` - PSM verification documents and $65 activation payment
- `Evaluacion` - Session ratings and feedback
- `Recompensa` - Token reward system for platform participation

**Key Relationships**:
- `Usuario.currentPsmId` → `PSM.id` (many-to-one assignment)
- Both PSM and Usuario have wallet addresses for blockchain integration
- Commission structure encoded in `Sesion` model (symbolic/accessible/full tiers)

### Farcaster Frame Integration

The app supports Farcaster frames with conditional UI:
- Frame detection via `window.self !== window.top`
- Sidebar/Topbar hidden in frames
- Frame-optimized container (max-width 400px)
- Uses `@farcaster/frame-sdk` and `@neynar/react`

### API Routes Structure

- `/api/psms` - PSM CRUD operations with specialization filters
- `/api/users` - User management with therapeutic profiles
- `/api/sessions` - Session scheduling and payment recording
- `/api/certifications` - Document upload and approval workflow
- `/api/assignments` - Smart PSM matching and assignment management

## Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy authentication
- `NEXT_PUBLIC_PRIVY_CLIENT_ID` - Privy client ID
- `DATABASE_URL` - PostgreSQL connection (via Prisma)
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)

ZeroDev Project ID is hardcoded in layout.tsx: `e46f4ac3-404e-42fc-a3d3-1c75846538a8`

## Important Implementation Notes

### Smart Wallet Transactions

When working with smart wallet transactions:
1. Always use `kernelClient` from `useSmartWallet()` hook
2. Encode transaction data using ethers.js Interface
3. Call `kernelClient.sendTransaction({ to, data, value })`
4. ZeroDev handles bundler submission and gas sponsorship automatically
5. Transaction hash returned is the UserOperation hash

### Contract Address Management

Network-specific addresses in `src/contracts/config.ts`:
- Default network: `alfajores`
- Use `getContractAddresses(network)` to retrieve addresses
- V1 contract kept for reference but V2 is active

### Prisma Client Generation

Prisma client is generated to **custom location**: `src/generated/prisma`
- Always run `npx prisma generate` after schema changes
- Import from `@/generated/prisma` in code

### TypeScript Path Aliases

Use `@/*` for imports: `import { contractService } from '@/contracts/contractService'`

## Economic Model

**Commission Tiers**:
- $5-$15 (Symbolic): 0% commission
- $20-$40 (Accessible): $5 fixed commission
- $45 (Full Rate): $10 commission
- PSM Certification: $65 one-time fee

**Reward Points**:
- Session completion: 10 pts (PSM), 5 pts (User)
- New certification: 50 pts
- Patient assignment: 5 pts

## Testing Patterns

Use the debug components in development:
- `UserStateDebug` - Shows Privy auth state
- `ContractTest` - Tests smart wallet and contract connectivity
- `SmartWalletTest` - Tests ZeroDev integration

Both render in `ClientOnly` wrapper to avoid SSR mismatches.

## Common Development Tasks

### Adding a New Contract Interaction

1. Add method to `ContractService` class in `contractService.ts`
2. Add corresponding method to `useMotusContracts` hook
3. Use kernel client for write operations, provider for reads
4. Encode function data with ethers.js when calling kernel client

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration_name>`
3. Run `npx prisma generate` to update client
4. Restart dev server to pick up new types

### Adding New API Route

Follow Next.js 15 App Router patterns:
- Create `src/app/api/<route>/route.ts`
- Export named functions: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`
- Use Prisma client for database operations
- Return `NextResponse.json()` for responses

## Known Considerations

- Frame context affects layout rendering (no sidebar/topbar)
- Smart wallet initialization requires authentication + wallet presence
- V2 contracts support both admin-assigned and self-registration flows
- Commission calculation happens in both Solidity contracts and database
- Celo Alfajores testnet may have rate limits on RPC calls
