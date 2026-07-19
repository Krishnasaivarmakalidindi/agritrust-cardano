# AgriTrust 🌾

> **Trusted Agricultural Commerce Network**
>
> Version 1.0 (Hackathon Release)

AgriTrust is a decentralized, Web3-powered agricultural marketplace where farmers sell directly to buyers, AI assists with intelligent pricing, and Cardano smart contracts secure escrow payments to guarantee absolute trust and provenance.

---

## 📊 Presentation (Pitch Deck)

[View AgriTrust Pitch Deck on Gamma](https://gamma.app/docs/AgriTrust-o751jono5yy472f)

---

## 🏗️ Architecture

```text
                React + TypeScript
                        │
              Context / Services
                        │
        ┌───────────────┴───────────────┐
        │                               │
     Supabase                     Cardano (Preview Testnet)
        │                               │
 Authentication             MeshJS Wallet Connect
 PostgreSQL                 Smart Contracts / Escrow
 Storage                    Transaction Proofs
 Realtime                   Cardano Ledger State
        │                               │
        └───────────────┬───────────────┘
                        ▼
                  Trust Ledger
                        ▼
              QR Verification Certificate
```

---

## ✨ Features

- **Realtime Marketplace:** Built on Supabase Realtime, offers and orders sync instantly between buyers and farmers without refreshing.
- **Cardano Escrow:** Buyers lock ADA in a smart contract using MeshJS (supporting Lace, Eternl). Funds are only released when delivery is confirmed.
- **Trust Ledger:** Every critical action is recorded as a block. The Trust Ledger verifies the integrity of the chain and prevents data tampering.
- **QR Certificate:** Completed trades generate a verifiable QR code linking to a public verification passport, proving the provenance of the agricultural goods.
- **AI Pricing:** Simulated AI engine suggests optimal pricing based on market demand and historical data.
- **Fallback Simulation:** If no Cardano wallet is detected, the app seamlessly falls back to a simulated Web3 environment to ensure demonstrations never fail.

---

## 📂 Folder Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components (Navbar, Sidebar, QRCertificate, etc)
│   ├── context/          # React Context providers (AuthContext)
│   ├── pages/            # Main application views (Dashboard, Wallet, TrustLedger, Verify)
│   ├── services/         # API and Blockchain logic (Supabase client, MeshJS wrappers)
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Helper functions (TrustScore calculator, etc)
│   ├── App.tsx           # Main router shell
│   └── main.tsx          # Application entry point with MeshProvider
├── public/               # Static assets
└── package.json          # Dependencies (Vite, Tailwind, MeshSDK, Supabase)
```

---

## 🚀 Installation Guide

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
3. **Environment Variables:**
   Create a `.env` file in the `frontend` root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## 🔧 Supabase Setup

To deploy the backend:
1. Create a new Supabase project.
2. In the **SQL Editor**, run the provided `schema.sql` (found in project documentation) to build the 10 core tables (`profiles`, `products`, `offers`, `orders`, `contracts`, `wallet_transactions`, `reviews`, `blockchain_logs`, `notifications`, `wallets`).
3. Under **Authentication > Email**, turn **Confirm email OFF** for seamless hackathon onboarding.
4. Under **Database > Replication**, enable Realtime for `products`, `offers`, `orders`, and `notifications`.

---

## 🪙 Cardano Setup & MeshJS

This application utilizes **@meshsdk/react** to interface with Cardano CIP-30 browser wallets.

- **Network:** Cardano Preview Testnet
- **Wallets Supported:** Lace, Eternl, Nami (via MeshJS)
- **Escrow Logic:** When a buyer accepts a farmer's offer, funds are moved from their wallet to a simulated Plutus Script address (`addr_test1_plutus_escrow...`). Once the buyer confirms delivery, the script releases funds to the farmer.

*(Note: For the hackathon demonstration, if a real Aiken compiled Plutus script is not deployed, the application will construct standard ADA transfers to simulate the escrow flow, capturing real Transaction Hashes in the Trust Ledger).*

---

## 🧪 Testing Guide

**Multi-User Realtime Test:**
1. Open Browser A: Click **Quick Access** -> **Continue as Farmer**. List a product.
2. Open Browser B: Click **Quick Access** -> **Continue as Buyer**. 
3. Watch the product appear instantly in Browser B. Submit an offer.
4. Watch the offer appear instantly in Browser A.

**Blockchain Audit Test:**
1. Complete a trade.
2. Navigate to **Trust Ledger**.
3. Click **Verify Blockchain Integrity**. The system will trace the parent hashes of all blocks to ensure cryptographic integrity.
4. Click **View QR Certificate** on a completed trade to view the public verification passport.

---

## 🚀 Deployment Guide

This application is ready to be deployed on Vercel or Netlify.
1. Connect your GitHub repository to Vercel.
2. Set the Build Command to `npm run build` and Output Directory to `dist`.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel Environment Variables.
4. Deploy!

---

*Built for the global Cardano Hackathon.* 🌍
