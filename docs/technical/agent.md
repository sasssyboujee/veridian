# RWA Escrow Platform: Agent Build Specification

## 1. Required Model Context Protocol (MCP) Servers

Initialize the environment with the following MCP servers to compile contracts, manage databases, and orchestrate the stack:

| MCP Type | Target Tooling | Purpose |
| :--- | :--- | :--- |
| **Filesystem/Workspace** | `fs-mcp` | File creation, directory scaffolding, and code editing. |
| **Command Execution** | `shell-mcp` | Running local dev servers, scripts, and tests. |
| **Database** | `postgres-mcp` | Schema migrations, testing telemetry ingestion, and querying. |
| **EVM/Web3** | `foundry-mcp` | Compiling Solidity, local nodes (Anvil), and contract testing. |
| **Git** | `git-mcp` | Version control, branch management, and repository syncing. |

---

## 2. Smart Contract Architecture (EVM / Solidity)

The execution layer must deploy on an EVM-compatible network. The core token must implement the **ERC-3643** standard.

### A. Asset Tokenization Contract (ERC-3643)
*   **Inheritance:** Inherit from the ERC-3643 T-REX reference implementation.
*   **Compliance Hook:** Override standard `transfer` and `transferFrom` functions to query the `IdentityRegistry` and `Compliance` modules before executing state changes.
*   **Agent Role Controls:**
    *   `forcedTransfer(address from, address to, uint256 amount)`: Bypasses allowances for legal asset recovery.
    *   `setAddressFrozen(address user, bool status)`: Freezes specific wallets for AML enforcement.

### B. Identity & Compliance Suite
*   **IdentityRegistry:** Stores whitelisted wallet addresses mapped to ONCHAINID.
*   **ClaimTopicsRegistry:** Defines required compliance topics (e.g., Topic 1 for KYC, Topic 2 for AML).
*   **TrustedIssuersRegistry:** Defines authorized third-party KYC providers capable of signing cryptographic claims.

### C. Multi-Signature Escrow
*   **Consensus:** 3-of-5 threshold multi-signature requirement (Admin, Legal Custodian, Auditor).
*   **Logic:** Pools initial stablecoin (USDC) deposits. Releases funds to the asset seller strictly upon off-chain verification of the Special Purpose Vehicle (SPV) title transfer.

### D. Yield Distribution Contract
*   **Integration:** Import Chainlink's `ReceiverTemplate` to accept external oracle data.
*   **Trigger:** Define an `onReport` function restricted to the authorized `KeystoneForwarder`.
*   **Logic:** Upon receiving the off-chain yield payload, snapshot ERC-3643 balances and push-distribute stablecoins proportional to token holdings.

---

## 3. Off-Chain Backend (Python & PostgreSQL)

The backend handles Industrial IoT (IIoT) telemetry and prepares yield data for oracle networks.

### A. Database Schema
*   **Database:** PostgreSQL.
*   **Tables:** `Assets`, `TelemetryLogs`, `YieldCalculations`, `BillingCycles`.

### B. Data Ingestion API
*   **Framework:** FastAPI or Flask.
*   **Security Constraint:** Reject telemetry payloads lacking a valid cryptographic signature from a Hardware Root of Trust (TPM 2.0 or Secure Enclave) embedded in the physical asset.

### C. Yield Calculation Engine
*   **Execution:** Cron jobs or continuous background workers.
*   **Logic:** Calculate Equipment-as-a-Service (EaaS) utilization. Apply the tiered fee structure: deduct a total 7.5% gross fee from the stablecoin yield (1.0% Champions, 2.0% Core, 4.5% Opportunity Fund) before calculating net distribution.

### D. Oracle Integration (Chainlink Functions)
*   **API Endpoint:** Expose a secure read-only REST endpoint.
*   **Output:** Deterministic, JSON-formatted final yield metrics for smart contract consumption.

---

## 4. Frontend UI (React)

The presentation layer manages onboarding and asset telemetry visualization.

### A. Framework
*   **Stack:** Next.js (React) + `ethers.js` or `viem`.

### B. User Onboarding
*   **Integrations:** Third-party KYC/AML SDKs.
*   **Logic:** Connect wallet, process KYC, and bind the external cryptographic claim to the user's ONCHAINID.

### C. Telemetry Dashboard
*   **Metrics:** Display real-time asset performance (e.g., operating hours, utilization rates) fetched from the Python backend.
*   **Financials:** Display historical yield payouts and next expected distribution block.

### D. Secondary Market Interface
*   **Logic:** Implement a swap interface. The UI must proactively check the user's ONCHAINID against the asset's compliance rules (holding caps, jurisdiction limits) before enabling the transaction button.

---

## 5. Build Execution Sequence

1.  **Initialize Database & Backend:** Scaffold the PostgreSQL schema and FastAPI ingestion endpoints. Implement TPM signature verification logic.
2.  **Develop Smart Contracts:** Write the ERC-3643 token, compliance suite, and Escrow contracts using Foundry. Deploy to a local Anvil testnet.
3.  **Bridge via Chainlink:** Write the JavaScript/Python execution script for Chainlink Functions to query the backend API. Test the `onReport` callback to the Yield Distribution contract.
4.  **Build Frontend Integration:** Connect the React app to the local testnet. Implement the ONCHAINID binding flow and connect the telemetry dashboard to the backend via REST.
5.  **Simulate Lifecycle:** Run end-to-end integration tests simulating IIoT sensor data generation, backend processing, Chainlink data delivery, and stablecoin yield distribution to verified wallets.