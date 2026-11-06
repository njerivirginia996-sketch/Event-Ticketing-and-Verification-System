# TiketiPass: Event Ticketing & Real-Time Gate Verification System

**TiketiPass** is a high-concurrency event ticketing and gate verification platform designed for live entertainment, technology conferences, and festivals. It features sub-second HMAC-SHA256 signed QR verification, a pending-payment checkout flow, offline gate scanning with auto-sync, dynamic anti-screenshot rotating QR codes, and Gemini 3.8 Flash AI assistants.

---

## 🚀 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Attendee**: Discover events, reserve tickets with a high-concurrency 10-minute hold lock, complete payment before receiving signed digital passes, transfer tickets with instant reissue, request refunds, and query TiketiBot (AI).
   - **Gate Staff / Verifier**: Mobile-optimized dark-mode scanner with camera QR reading, instant visual results (`VALID`, `ALREADY USED`, `INVALID`), Web Audio API chimes & haptics, offline manifest caching for zero-internet stadiums, batch sync with duplicate collision detection, and manual search fallback.
   - **Event Organizer**: Real-time sales velocity, revenue metrics, live gate check-in progress, Gemini AI event description writer, promo code engine, attendee CSV export, complimentary pass issuance, and revenue settlement requests.
   - **Super Admin**: Platform governance, gross volume and commission fee auditing, organizer account approvals, payout clearing, and Kenya Data Protection Act 2019 compliant audit logging.

2. **Security & Anti-Fraud Architecture**:
   - **HMAC-SHA256 Token Signing**: QR code contains a cryptographically signed payload (`ticketId`, `eventId`, `ticketNumber`, `timestamp`, `signature`) rather than a simple ID, preventing counterfeit passes.
   - **30-Second Dynamic Rotating QR**: Prevents screenshot sharing at gates.
   - **Atomic Database Check-In**: Prevents concurrent duplicate admissions across multiple gate lanes.
   - **Fraud Alert Engine**: Detects duplicate scan attempts across different gates within seconds.

3. **High-Concurrency Ticket Hold Engine**:
   - 10-minute temporary inventory reservation lock during checkout prevents race conditions and overselling during blockbuster ticket drops.

4. **React Native & Supabase Architecture Hub**:
   - Interactive mobile device simulator showcasing the native mobile scanner experience.
   - One-click copy & export of complete React Native (Expo) code and Supabase PostgreSQL schema with Row-Level Security (RLS) policies.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

Copy `.env.example` to `.env` and replace the placeholders with private values. Generate a unique QR signing key (for example, with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`); the server will not start without `QR_SECRET_KEY`.

Seed account passwords and privileged portal access codes are optional environment variables. Set them to enable the corresponding demo sign-ins; without them, seeded accounts cannot log in. Organizer and Gate Verifier registration requires the matching configured portal code and activates the account immediately, without administrator approval. Super Admin account requests still require approval. `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD` configure the seeded Super Admin login at startup, including when a database file already exists. The local database at `data/db.json` is created automatically and is excluded from Git because it can contain user data and credentials.

Attendee Google sign-in requires a Google OAuth 2.0 Web application client ID in `GOOGLE_CLIENT_ID`. Add the app's production and local origins to the authorized JavaScript origins in Google Cloud Console, then set the client ID in the deployment environment. Google ID tokens are verified by the server; the app never asks for or stores a Google password.

## 💳 Payment Flow

Checkout creates a `pending` order and keeps the selected tickets reserved. It does not issue tickets, count revenue, or send a purchase confirmation until payment is confirmed. The current M-Pesa and card flows are development simulations; the development UI has an explicit test confirmation action. Production payment-provider integration and verified callbacks are not implemented, so production orders remain pending rather than being marked paid without confirmation.

---

## 🛠️ Development & Deployment

### Run Locally
```bash
npm install
npm run dev
```
The server will start at `http://localhost:3000`.

### Production Build & Run
```bash
npm run build
npm start
```

### Deploy to Google Cloud Run
In AI Studio Build mode or your shell:
1. Export or sync to your GitHub repository.
2. Deploy the containerized Node.js service to Google Cloud Run.
