# Presentation Guide: Live RWA Tokenization Demo on UZHETH

This document outlines the architecture and execution strategy for conducting a live, interactive presentation of the Real-World Asset (RWA) Escrow Platform. During the presentation, students will be able to connect to the private **UZHETH** network and purchase fractionalized RWAs in real-time.

---

## 🎓 The Interactive Experience

Instead of just showing screenshots, the platform is designed to be fully interactive for the audience. 

### What Students Will Do:
1. **Connect to UZHETH:** Students open their MetaMask wallets and connect to the UZHETH network (or the platform will prompt them to add the network automatically).
2. **Claim Mock Funds:** They will visit the platform's **Faucet** page to mint `1,000 mUSDC` (Mock USDC) for free. This simulates having fiat-backed purchasing power.
3. **Instant KYC Onboarding:** To comply with the ERC-3643 standard, they must pass KYC. During the demo, clicking "Verify Identity" on the Onboarding page will trigger an **On-Chain Auto-KYC** smart contract, instantly whitelisting their wallet in the `IdentityRegistry`.
4. **Buy Physical Assets:** On the **Exchange** page, they can use their `mUSDC` to purchase tokens representing fractional ownership of *Solar Plant Alpha* or *Farmstead Harvester Beta*.
5. **Watch Live Activity:** The dashboard will feature a live "Network Activity Feed" showing their purchases and KYC verifications updating in real-time on the projector screen!

---

## 🏗️ Technical Setup for the Demo

### 1. The UZHETH Network Configuration
The frontend application uses `wagmi` to connect to Ethereum nodes. We will configure the UZHETH chain parameters in `src/lib/wagmi.ts` so the application inherently supports the private university network.

### 2. Smart Contract Deployments
Prior to the presentation, the following auxiliary contracts will be deployed to UZHETH:
*   **`MockUSDC.sol`**: An ERC-20 token simulating a fiat stablecoin, with a public `faucet()` function allowing anyone to mint `1,000` tokens.
*   **`AutoKYC.sol`**: A simplified Claim Issuer contract that bypasses manual KYC verification for the sake of the demo, directly injecting an approved Identity Claim into the ERC-3643 `IdentityRegistry` for the caller.

### 3. Scalability & Production Readiness
This architecture is deliberately designed to mimic a production environment:
*   **Stablecoin Integration:** Real RWA protocols (like Ondo or Matrixdock) use stablecoins (USDC/USDT) rather than volatile native gas tokens (ETH) to price assets. By using `mUSDC`, the codebase remains identical to production—we merely swap the contract address from `mUSDC` to Circle's official `USDC` when going live.
*   **ERC-3643 Integrity:** We do not disable the ERC-3643 transfer restrictions for the demo. The tokens remain heavily regulated. The `AutoKYC.sol` script acts as a proxy for what would normally be a backend service connected to a KYC provider like Sumsub. 

### 4. Core Concepts to Explain (SPVs & Multi-Sig Escrow)
During the presentation, ensure the audience understands two foundational concepts that make this platform viable:
*   **Special Purpose Vehicles (SPVs):** Physical assets cannot easily be placed on a blockchain. Instead, an SPV (a legal subsidiary, like an LLC) is created in the real world to legally purchase the physical asset. Our platform tokenizes the *shares of that SPV*. When users purchase on the Exchange, they are buying cryptographic representation of ownership in the SPV that holds the asset.
*   **Multi-Signature Escrow:** To eliminate counterparty risk and avoid a single point of failure, funds are held in a decentralized smart contract rather than a centralized bank. A minimum threshold of designated signers (e.g., 3 out of 5 nodes in our Governance council) must cryptographically verify that the real-world conditions of a transfer have been met before the USDC is released to the seller.

---

## 🎨 Upgraded Visuals for the Presentation

To make the platform look stunning and data-rich on a large projector, the dashboard will include:
*   **Interactive Yield History Charts:** Utilizing `recharts` to render beautiful bar charts showing projected stablecoin yields over the last 6 months.
    - Notice our settlement layer uses **USDC** rather than an experimental stablecoin for immediate liquidity and reduced counterparty risk.
*   **Live TPM Heartbeat:** A visual "terminal" component that streams simulated cryptographic hashes (TPM signatures) to give the feel of live hardware telemetry being validated by the FastAPI backend.
    - In the background, our **Python backend** validates the IIoT signatures, calculating the revenue generated off-chain, and converting it to the USDC equivalent.
*   **Geographical Badges:** Location tags indicating where the physical hardware is hypothetically stationed (e.g., *Solar Plant Alpha [Nevada, US]*).
*   **Global Activity Feed:** A scrolling list of network events (e.g., "0x123... just purchased 50 SPA tokens", "Yield distributed to 45 holders").
