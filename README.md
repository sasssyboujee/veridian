# RWA Escrow & Yield Distribution Platform

An end-to-end decentralized financial infrastructure for **Tokenized Real-World Assets (RWAs)** operating under the **Equipment-as-a-Service (EaaS)** model. 

This platform bridges physical machinery (e.g., solar generators, agricultural equipment) and EVM blockchains by validating physical hardware telemetry before programmatically distributing yields to KYC-compliant investors.

---

## 💰 Economics & Yield Split

```mermaid
flowchart TD
    Asset[Real World Asset - Solar Panels] -->|Lease Agreement, EaaS Payment| Lessee[Household / Lessee]
    Asset -->|Legal Liability, Maintenance| SPV[SunFix Logistics / Operations]
    Asset -->|Capital Investment, Hardware Cost| Investors[Token Holders]

    Revenue[Usage Revenue] -->|75% Net Yield| Investors
    Revenue -->|8% Operations & Maintenance| SPV
    Revenue -->|7% Insurance & Reserve| Insurance[Reserve Fund]
    Revenue -->|5% Expansion Fund| Expansion[New Solar Projects]
    Revenue -->|5% Platform Fee| Platform[Veridian Protocol]

    Investors -->|Time-Locked Staking Vault| veRWA[Staking Vault]
    veRWA -.->|Yield Bracket Boost: 60% -> 75%| Investors
```

---

## 🏗️ System Architecture

*For a detailed execution flow and protocol lifecycle across all four portals, hardware, and smart contracts, see the full **[Architecture Maps](docs/technical/ARCHITECTURE_MAPS.md)**.*

```mermaid
sequenceDiagram
    autonumber
    
    actor Lessee as Household
    actor Admin as SunFix (Admin)
    actor Investor as Retail Investor
    
    participant LP as Household Portal (/lessee)
    participant AP as Operations Portal (/admin)
    participant IP as Investor Hub (/investor)
    participant MP as Command Center (/map)
    
    participant TPM as TPM 2.0 Hardware
    participant Backend as FastAPI Oracle
    participant SC as Smart Contracts (Optimism Sepolia)

    Note over Lessee,SC: 1. Asset Provisioning & Issuance
    Lessee->>LP: Request solar installation
    Admin->>TPM: Install physical array & TPM 2.0 sensor
    TPM-->>Backend: Hardware Root-of-Trust Handshake
    Admin->>AP: Issue Asset (deploys ERC-3643 on-chain)
    AP->>SC: Mint tokens representing Solar SPV

    Note over Investor,SC: 2. Compliant Onboarding & Staking
    Investor->>IP: Connect Wallet & request KYC
    IP->>SC: Submit Midnight zk-KYC Proof (Selective Disclosure)
    Investor->>IP: Swap USDC for Veridian Tokens
    Investor->>IP: Stake in Vault (boosts yield bracket to 75%)

    Note over TPM,SC: 3. Telemetry Ingestion & Yield Distribution
    TPM->>Backend: Stream Generation Telemetry (signed ECDSA payload)
    Backend->>MP: Render real-time telemetry nodes on Global Map
    Lessee->>LP: Pay monthly bill based on consumption
    Backend->>SC: Trigger automated contract yield distribution
    SC->>SC: Execute Waterfall (75% Staked Investors, 8% O&M, 7% Ins., 5% Exp., 5% Plat.)
```

---

## 📂 Repository Guide (Where to find everything)

Our project is a full-stack monorepo. Here is exactly where you can find all the core components for our DDiB26 submission:

*   **[`/contracts`](file:///Users/sasi/escrow/contracts)**: The Blockchain Layer (Foundry/Solidity)
    *   Contains our ERC-3643 compliant tokens, Auto-KYC Identity Registry, AMM Exchange logic, and Multi-Signature Escrow.
*   **[`/backend`](file:///Users/sasi/escrow/backend)**: The Oracle & Yield Engine (Python FastAPI)
    *   Contains our off-chain service that ingests physical hardware telemetry, calculates off-chain yield, and serves it to our smart contracts.
*   **[`/frontend`](file:///Users/sasi/escrow/frontend)**: The User Interface (Next.js & React)
    *   Contains the highly polished Web3 dApp where users can connect MetaMask, pass KYC, and buy RWA tokens using Mock USDC.
*   **[`/docs`](file:///Users/sasi/escrow/docs)**: Documentation & Visuals
    *   **[`academic/`](file:///Users/sasi/escrow/docs/academic)**: LaTeX analysis (`DDIB.tex`), project analysis (`project_analysis.md`), and submission checklist.
    *   **[`presentation/`](file:///Users/sasi/escrow/docs/presentation)**: Slide deck structure and pitch script.
    *   **[`technical/`](docs/technical)**: Comprehensive execution flow ([`ARCHITECTURE_MAPS.md`](docs/technical/ARCHITECTURE_MAPS.md)), UI/UX design language, and MCP specifications.
*   **[`/final_submission`](final_submission)**: The final compiled artifacts required for grading.

---

## 🔌 Tech Stack & Layers

### 1. Smart Contracts (Foundry & Solidity)
Located in `contracts/`.
- **Compliance (`RWAToken.sol` / ERC-3643)**: Gatekeeps token transfers via an `IdentityRegistry` bound to ONCHAINID. Only KYC-cleared investors can hold or trade asset tokens.
- **Multisig Escrow (`MultiSigEscrow.sol`)**: A 3-of-5 threshold multisig that locks stablecoin investment capital until legal and physical title transfers are validated off-chain.
- **Yield Distributor (`YieldDistributor.sol`)**: Consumes ABI-encoded payload reports submitted by authorized Chainlink Forwarders to distribute stablecoin yields directly to holders' wallets.

### 2. Off-Chain Backend (FastAPI & SQLAlchemy)
Located in `backend/`.
- **IIoT Telemetry Ingestion (`/telemetry`)**: Accepts real-time utilization logs from physical assets.
- **TPM Signature Verification (`app/services/tpm_verify.py`)**: Uses cryptographic ECDSA verification to validate that the telemetry was signed by the asset's built-in Hardware Root of Trust (TPM 2.0 / Secure Enclave) and has not been tampered with.
- **Async Yield Fee Engine (`app/services/yield_engine.py`)**: Gathers verified telemetry logs and calculates gross revenue (`units_consumed * usage_rate`). Deducts fees based on a **Dynamic Time-Locked Split** derived from the investor's lock duration in the `RWAVault`:
  - **Liquid/Short-Term Holders**: 60% Net Yield (25% Depreciation Reserve, 15% SPV Fee).
  - **Locked/Long-Term Holders**: 75% Net Yield (15% Depreciation Reserve, 10% SPV Fee).
- **Oracle Endpoint (`/yields/oracle/{asset_id}`)**: Delivers a secure, deterministic, JSON payload compiled for Chainlink Functions containing the scaled yield amount in `wei` (18-decimal precision).

### 3. Database Layer (Supabase PostgreSQL)
Schema defined in `backend/migrations/001_initial_schema.sql`.
- **`assets`**: Tracks token address, spv status, jurisdiction, and token supply.
- **`billing_cycles`**: Revenue calculation periods.
- **`telemetry_logs`**: Verified physical utilization history.
- **`yield_calculations`**: Gross/net yield calculations and fee breakdown history.

### 4. Frontend Client (Next.js 16, Wagmi & Tailwind)
Located in `frontend/`.
- **Stripi-Inspired Design System**: Built with modern typography (`Inter`), deep navy colors, electric indigo interactive states, tabular figures (`tnum`) for finances, and custom gradient mesh backdrops.
- **Web3 Wallet Autologin**: Configured via Wagmi and React Query to automatically reconnect the user's MetaMask wallet on mount (`useReconnect`).
- **KYC Onboarding**: Automates identity verification input by pre-filling the investor's connected Web3 wallet address.
- **Dashboard**: High-fidelity dark layout showing live telemetry updates, historical calculations, and user holdings.
- **Secondary Market**: A compliant peer-to-peer token swap interface enforcing ERC-3643 compliance check rules.

---

## 🚀 Setup & Execution Guide

### Prerequisite 1: Start local EVM node (Anvil)
Run this command from the project root:
```bash
# This starts a local anvil instance simulating the blockchain
# The MCP server is configured to connect to port 8545
anvil
```

### Prerequisite 2: Deploy Smart Contracts
From the `contracts/` directory:
```bash
# Deploy ClaimTopics, TrustedIssuers, IdentityRegistry, RWAToken, MultiSigEscrow, and YieldDistributor
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

### Prerequisite 3: Configure Backend & Database
1. Make sure your active Supabase project's Row Level Security (RLS) is enabled and migrations are run.
2. Edit `backend/.env` with your project's credentials:
```ini
DATABASE_URL=postgresql+asyncpg://postgres.[YOUR_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DATABASE_URL_SYNC=postgresql://postgres.[YOUR_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
ORACLE_API_KEY=dev-oracle-key-123
```
*Note: We connect through port `6543` using the transaction pooler. To prevent pgBouncer/Supavisor prepared statement conflicts, `connect_args={"statement_cache_size": 0}` is set on our SQLAlchemy async engine.*

3. Start the FastAPI server:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

---

## 🧪 Simulation Testing

To test the entire off-chain flow (Asset Creation → Activation → Billing Cycles → Telemetry Ingestion with ECDSA Signing → Yield Engine calculations → Oracle Payload compilation), run the simulation script:

```bash
cd backend
source venv/bin/activate
python simulate_flow.py
```

Expected Output:
```text
🚀 Starting End-to-End Simulation
Asset Creation: 201
✅ Created Asset: 2b844062-6ca0-4455-a5ff-ef3bc1e1261f
Asset Activation: 200
✅ Activated Asset
Billing Cycle Creation: 201
✅ Created Billing Cycle: ea8c0ff4-3c48-4c2d-ab03-d834dbfa9282
Telemetry Ingestion: 201
✅ Ingested Telemetry Data
Yield Calculation: 200
✅ Calculated Yield: {
  "gross_yield": "34223.750000",
  "champions_fee": "342.237500",
  "core_fee": "684.475000",
  "opportunity_fee": "1540.068750",
  "total_fee": "2566.781250",
  "net_yield": "31656.968750",
  "distributed": false
}
Oracle Yield Fetch: 200
✅ Oracle Payload Ready: {
  "net_yield_wei": "31656968750000000000000",
  "token_snapshot": {}
}
🎉 End-to-End API Flow Simulation Successful!
```

---

## 🔒 Security Recommendations

- **Row Level Security (RLS)**: Enforce RLS on all Supabase tables using:
  ```sql
  ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.yield_calculations ENABLE ROW LEVEL SECURITY;
  ```
- **TPM Bypass**: In `tpm_verify.py`, the `_dev_mode_verify` function permits mock keys during local development. In production, this must be switched off to only accept public keys signed by verified TPM root certificates.
- **Oracle Endpoint Auth**: Secure the `/yields/oracle` endpoint with a rotation-based authorization header linked to the Chainlink Functions decentralized oracle network subscription secrets.
