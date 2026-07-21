# Veridian System Architecture and Lifecycle Sequence

This document describes the end-to-end technical, legal, and economic architecture for **Veridian**: a tokenized solar infrastructure financing platform in South Africa.

---

## 1. High-Level Architecture Overview

Veridian integrates three primary layers:
1. **Off-Chain Hardware & Backend Services**: Solar meters with Hardware Root of Trust (TPM), FastAPI backend, and PostgreSQL database.
2. **On-Chain Smart Contracts (Optimism Sepolia)**: ERC-3643 compliant asset tokens (`RWAToken.sol`), 3-of-5 Multisig Escrow (`MultiSigEscrow.sol`), Identity & Compliance Registry (`IdentityRegistry.sol`), and Automated Distribution (`YieldDistributor.sol`).
3. **Decentralized Oracle Network (Chainlink)**: Chainlink Functions / Forwarders for verified off-chain to on-chain telemetry and yield report delivery.

---

## 2. System Architecture & Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    
    box rgb(240,244,248) Off-Chain Actors & Hardware
        actor Investor
        actor Household
        participant TPM as Solar Meter (TPM / Software Key)
        participant API as FastAPI Backend & PostgreSQL
    end
    
    box rgb(235,240,255) Blockchain (Optimism Sepolia)
        participant Identity as AutoKYC & IdentityRegistry
        participant Escrow as 3-of-5 MultiSigEscrow
        participant RWA as RWAToken (ERC-3643)
        participant Dist as YieldDistributor
    end

    box rgb(255,245,235) Decentralized Oracle Network
        participant CL as Chainlink Forwarder
    end

    %% Phase 1: Identity and Capital Formation
    Note over Investor, Escrow: Phase 1: Identity & Capital Formation
    Investor->>Identity: Submit Identity Claim (AutoKYC)
    Identity-->>Investor: Verify & Whitelist Address
    Investor->>Escrow: Deposit USDC Capital
    Note right of Escrow: 5 Signers: Platform Operator, Solar Operator,<br/>SPV Rep, Legal Rep, Independent Verifier
    Escrow-->>Escrow: 3-of-5 Threshold Confirmation Met
    Escrow-->>RWA: Release Capital for Equipment Procurement
    RWA-->>Investor: Mint Fractional ERC-3643 Asset Tokens
    
    %% Phase 2: Operations and Telemetry
    Note over Household, API: Phase 2: Operations & Telemetry Pipeline
    Household->>TPM: Consumes Solar Energy Generation
    TPM->>TPM: Produce SECP256R1 ECDSA Signature over Payload
    TPM->>API: Transmit Signed Telemetry JSON (kWh / Hours, Timestamp)
    API-->>API: Verify ECDSA Signature & Record in PostgreSQL
    
    %% Phase 3: Yield Calculation & Settlement
    Note over Household, Dist: Phase 3: Settlement & Automated Payout Waterfall
    Household->>API: Pay Monthly Service / EaaS Fee (Fiat / USDC)
    API-->>API: Yield Engine Computes Gross Yield (G = q × p)
    API->>CL: Expose Oracle-Ready Payload Endpoint
    CL->>Dist: Submit Verified Distribution Report On-Chain
    Dist-->>Dist: Enforce 75/8/7/5/5 Payout Waterfall Split
    Dist-->>Investor: Distribute 75% Net Yield to Verified Token Holders
```

---

## 3. Payout Waterfall Breakdown

| Component | Share | Description |
| :--- | :--- | :--- |
| **Investors** | **75%** | Return on capital and asset performance risk compensation. |
| **Operations & Maintenance (O&M)** | **8%** | Routine maintenance and field servicing. |
| **Reserves & Insurance** | **7%** | Equipment failure insurance, reserves, and depreciation. |
| **Pool Expansion** | **5%** | Reinvestment in future solar array deployments. |
| **Platform Operations** | **5%** | Software, compliance, administrative, and oracle maintenance. |
