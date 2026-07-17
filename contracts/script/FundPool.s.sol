// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/token/RWAToken.sol";
import "../src/token/MockUSDC.sol";
import "../src/token/RWAFactory.sol";
import "../src/market/RWALiquidityPool.sol";

contract FundPoolScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        RWAFactory factory = RWAFactory(0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1);
        RWAFactory.AssetData[] memory assets = factory.getAllAssetsData();
        
        if(assets.length > 0) {
            address poolAddr = assets[0].poolAddress;
            address tokenAddr = assets[0].tokenAddress;
            address usdcAddr = factory.usdc();

            // Fund pool with 50,000 SPA and 500,000 USDC to provide liquidity
            // 1 SPA = 10 USDC (arbitrary initial liquidity)
            RWAToken spa = RWAToken(tokenAddr);
            MockUSDC usdc = MockUSDC(payable(usdcAddr));
            
            spa.transfer(poolAddr, 50_000 * 10**18);
            usdc.mint(poolAddr, 500_000 * 10**18);
            
            console.log("Funded pool at", poolAddr);
        }

        vm.stopBroadcast();
    }
}
