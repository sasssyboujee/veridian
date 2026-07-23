# Veridian - Frontend Applications

This directory contains the Next.js (React) frontend for the Veridian Real-World Asset (RWA) Escrow Platform.

It is a unified monorepo housing four distinct portals for different stakeholders in the EaaS (Equipment-as-a-Service) lifecycle.

## 🌟 Portals

*   **Command Center (`/map`)**: A cinematic, 3D global visualization of physical assets connecting to the network and routing yield. Used to demonstrate the high-level concept.
*   **Investor Hub (`/investor`)**: A Web3 interface for retail and institutional investors. Integrates with MetaMask via `wagmi` to allow users to swap USDC for ERC-3643 compliant RWA tokens, and stake them in the `veRWA` vault for yield boosts.
*   **Operations Admin (`/admin`)**: The internal portal for SunFix Logistics to monitor TPM 2.0 telemetry signatures, simulate hardware faults (bond slashing), and view the 75/8/7/5/5 Yield Waterfall breakdown based on real oracle data.
*   **Home Portal (`/lessee`)**: The interface for the physical lessee (e.g., a homeowner with a leased solar panel) to view their power generation, grid savings, and pay their monthly utility bill.

## 🛠️ Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Vanilla CSS (`globals.css`) + Tailwind (for specific utility classes)
*   **Web3 Integration**: `wagmi` + `viem` for robust wallet connection, contract reads/writes, and transaction waiting.
*   **Charts & Visuals**: `react-simple-maps` for the global command center, custom SVG animations for yield particles.

## 🚀 Getting Started

1. Ensure the root `contracts` have been deployed to your local anvil node, and the `backend` FastAPI server is running.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🔗 Architecture Link

For a complete sequence diagram of how this frontend interacts with the smart contracts and the backend oracle, refer to the root `README.md` and `docs/technical/ARCHITECTURE_MAPS.md`.
