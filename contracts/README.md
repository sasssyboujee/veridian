# Veridian - Smart Contracts Layer (Foundry)

This directory contains the core Ethereum smart contracts for the Veridian Real-World Asset (RWA) platform. It is built using **Foundry**, a blazing fast, portable, and modular toolkit for Ethereum application development written in Rust.

## 🏛️ Core Contract Architecture

1. **Compliance Layer (ERC-3643)**
   - We utilize the ERC-3643 standard (T-REX) for permissioned tokens. This ensures that RWAs can only be held, traded, and transferred by verified identities.
   - Core contracts include the `IdentityRegistry`, `TrustedIssuers`, and `ClaimTopicsRegistry` which validate Midnight zk-KYC claims before permitting a transfer.
2. **Escrow Layer (`MultiSigEscrow.sol`)**
   - A threshold Multi-Signature escrow that locks incoming USDC investments. Capital is only released to the SPV (Special Purpose Vehicle) operator when physical title and hardware installation have been successfully validated.
3. **Yield Distribution Layer (`YieldDistributor.sol`)**
   - Receives deterministic payload data pushed by Chainlink Functions (acting as an Oracle connected to our FastAPI backend).
   - Distributes the actual USDC yield to token holders and the various protocol treasuries according to the 75/8/7/5/5 waterfall calculation.

## 🚀 Usage

### Build
Compile the smart contracts:
```shell
forge build
```

### Test
Run the comprehensive test suite to verify compliance, minting, and escrow locks:
```shell
forge test
```

### Local Deployment (Anvil)
1. Start a local anvil node in a separate terminal:
```shell
anvil
```
2. Deploy the core infrastructure (Identity Registry, Tokens, Escrow) to the local node:
```shell
# Deploy using anvil's default account #0
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

## 📖 Further Documentation

For detailed information on the ERC-3643 standard, visit the [ERC-3643 Association](https://erc3643.org/).
For more information on Foundry, visit the [Foundry Book](https://book.getfoundry.sh/).
