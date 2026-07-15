# Live Demo Script & Future Improvements

Here is a step-by-step guide on how you should structure your presentation to the class, how to engage the students interactively, and what technical improvements are needed to take this from a course project to a production-ready startup.

---

## 🎭 The Live Demo Script (5-10 Minutes)

The goal of this demo is to show that your platform solves a real problem: bridging physical hardware (IoT) with on-chain finance safely and legally.

### Phase 1: The Pitch (1-2 mins)
1. **Open the Home Page**: Show the sleek `Nexus RWA` landing page on the projector.
2. **The Problem**: Explain that bringing physical assets (like solar panels) on-chain is risky. How do you prove the solar panel is actually generating energy? How do you prevent illegal wallets from buying the asset?
3. **The Solution**: Explain your architecture.
   - We use **ERC-3643** so only verified identities can hold the token.
   - We use **TPM Hardware Enclaves** (telemetry) to prove the asset is working.
   - We use **Chainlink** to automate the yield payouts based on that hardware data.

### Phase 2: Audience Participation (3-5 mins)
*This is where you get the students involved using their `UZH_ETH`!*

1. **The "KYC" Step**:
   - Ask the class to go to your deployed URL.
   - Tell them to click **"Pass KYC"** (or go to the Onboarding page).
   - *Explain*: In the real world, this would take them through Onfido/SumSub. For this demo, clicking the `AutoKYC` button mimics a passed KYC check and instantly whitelists their wallet on the ERC-3643 `IdentityRegistry`.
2. **The Faucet**:
   - Tell them to go to the **Market** page.
   - Ask them to click the **Claim 1,000 mUSDC** Faucet banner.
   - *Explain*: This gives them the mock stablecoin needed to buy the RWA token.
3. **The Purchase**:
   - Tell them to buy `SPA` (Solar Plant Alpha) tokens using their `mUSDC`.
   - *Explain*: Because they passed KYC, the ERC-3643 contract allows the transfer. If a student tries to send the `SPA` token to a random, non-whitelisted friend in the class, the blockchain will **revert the transaction**. (You can challenge them to try this!).

### Phase 3: The "Aha!" Moment (1-2 mins)
1. **Open the Dashboard**: Put the dashboard up on the projector.
2. **Show the Hardware Terminal**: Point to the scrolling hardware logs. Explain that this is the IoT sensor on the physical solar panel cryptographically signing its energy output.
3. **Show the Activity Feed**: The class should see their own purchases popping up on the live activity feed!
4. **Conclusion**: You've built a closed-loop system where physical reality dictates financial outcomes, fully compliant with security laws.

---

## 🚀 Future Production Improvements

If you decide to scale this into an actual startup or thesis project, here is what needs to be upgraded:

### 1. Smart Contract Upgrades
- **Real Oracle Integration:** Currently, we are mocking Chainlink. You would need to write a real Chainlink Functions script (`source.js`) that fetches data from an AWS IoT Core backend and pushes it on-chain to trigger the yield distributions.
- **Remove AutoKYC:** Replace the demo `AutoKYC.sol` with a real integration via a KYC provider (e.g., SumSub webhook -> your backend -> `IdentityRegistry`).

### 2. Backend & Security (FastAPI)
- **Database Authentication:** Lock down the Supabase/FastAPI backend. Currently, the dashboard might be reading unauthenticated data. You need JWT-based Row Level Security (RLS) so users only see their own portfolio balances.
- **Hardware Attestation:** The backend needs a route to verify the physical TPM (Trusted Platform Module) certificates of the IoT devices to ensure the sensors haven't been spoofed.

### 3. Frontend & UX
- **Real Wallet State:** Ensure the Dashboard reads the user's actual token balances directly from the blockchain (using `wagmi` `useBalance`) rather than hardcoded mock states.
- **Admin Panel:** Build an admin view for yourself to authorize new assets, pause trading, and manage the `TrustedIssuersRegistry`.
