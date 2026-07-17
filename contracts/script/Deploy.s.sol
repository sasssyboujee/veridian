// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/compliance/TrustedIssuersRegistry.sol";
import "../src/compliance/ClaimTopicsRegistry.sol";
import "../src/compliance/IdentityRegistry.sol";
import "../src/compliance/AutoKYC.sol";
import "../src/token/MockUSDC.sol";
import "../src/token/RWAToken.sol";
import "../src/token/RWAFactory.sol";
import "../src/factory/GovernorFactory.sol";
import "../src/factory/PoolFactory.sol";
import "../src/market/RWALiquidityPool.sol";
import "../src/yield/RWAVault.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Compliance Infrastructure
        TrustedIssuersRegistry trustedIssuersRegistry = new TrustedIssuersRegistry();
        ClaimTopicsRegistry claimTopicsRegistry = new ClaimTopicsRegistry();
        IdentityRegistry identityRegistry = new IdentityRegistry(
            address(trustedIssuersRegistry),
            address(claimTopicsRegistry)
        );

        // 2. Deploy Demo AutoKYC
        AutoKYC autoKYC = new AutoKYC(address(identityRegistry));
        
        // Authorize AutoKYC contract as an owner on IdentityRegistry to register users
        identityRegistry.transferOwnership(address(autoKYC));

        // 3. Deploy USDC
        MockUSDC usdc = new MockUSDC();

        // 4. Deploy Sub-Factories
        GovernorFactory govFactory = new GovernorFactory();
        PoolFactory poolFactory = new PoolFactory();

        // 5. Deploy RWA Factory
        RWAFactory rwaFactory = new RWAFactory(
            address(identityRegistry), 
            address(usdc),
            address(govFactory),
            address(poolFactory)
        );

        // The deployer itself must be verified to hold/mint tokens and create assets.
        autoKYC.verifyMe();
        
        // 6. Use Factory to deploy dummy assets for different industries
        address[] memory tokens = new address[](4);
        tokens[0] = rwaFactory.createAsset("Western Cape Solar Pool", "WCS-POOL", 100_000 * 10**18);
        tokens[1] = rwaFactory.createAsset("Gauteng Logistics Fleet", "GLF-POOL", 250_000 * 10**18);
        tokens[2] = rwaFactory.createAsset("Free State Agri-Machinery", "FSA-POOL", 50_000 * 10**18);
        tokens[3] = rwaFactory.createAsset("KZN Wind Farm Alliance", "KZN-POOL", 300_000 * 10**18);

        // 7. Verify the deployed pools and fund them for demo purposes
        RWAFactory.AssetData[] memory assets = rwaFactory.getAllAssetsData();
        
        address deployer = vm.addr(deployerPrivateKey);
        
        for (uint i = 0; i < assets.length; i++) {
            address poolAddr = assets[i].poolAddress;
            RWAToken token = RWAToken(assets[i].tokenAddress);
            
            // Verify the pool address so it can hold the tokens
            autoKYC.verifyAddress(poolAddr);
            
            // Fund the pool with liquidity (50% of supply and some USDC)
            uint256 supply = token.totalSupply();
            uint256 halfSupply = supply / 2;
            
            // Approve pool to take RWA tokens
            token.approve(poolAddr, halfSupply);
            
            // Mint USDC to deployer and approve pool
            usdc.mint(deployer, 500_000 * 10**18);
            usdc.approve(poolAddr, 500_000 * 10**18);
            
            // Add liquidity to properly update pool reserves
            RWALiquidityPool(poolAddr).addLiquidity(halfSupply, 500_000 * 10**18);
            
            // Deploy veRWA Vault for this asset
            RWAVault vault = new RWAVault(assets[i].tokenAddress);
            console.log("Vault deployed at:", address(vault));
        }

        vm.stopBroadcast();

        // Console logs to copy-paste to frontend
        console.log("--- Deployed Addresses ---");
        console.log("IdentityRegistry:", address(identityRegistry));
        console.log("AutoKYC:", address(autoKYC));
        console.log("MockUSDC:", address(usdc));
        console.log("RWAFactory:", address(rwaFactory));
        console.log("WCS Token:", tokens[0]);
        console.log("GLF Token:", tokens[1]);
        console.log("FSA Token:", tokens[2]);
        console.log("KZN Token:", tokens[3]);
    }
}
