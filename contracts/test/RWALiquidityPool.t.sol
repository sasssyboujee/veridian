// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/market/RWALiquidityPool.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract RWALiquidityPoolTest is Test {
    RWALiquidityPool public pool;
    MockToken public rwaToken;
    MockToken public usdc;

    address public provider = address(0x10);
    address public investor = address(0x20);

    function setUp() public {
        rwaToken = new MockToken("RWA Token", "RWA");
        usdc = new MockToken("Mock USD", "USDC");

        pool = new RWALiquidityPool(address(rwaToken), address(usdc));

        // Setup provider liquidity
        rwaToken.mint(provider, 1000000 * 10**18);
        usdc.mint(provider, 1000000 * 10**18);

        vm.startPrank(provider);
        rwaToken.approve(address(pool), 1000000 * 10**18);
        usdc.approve(address(pool), 1000000 * 10**18);
        pool.addLiquidity(10000 * 10**18, 1000000 * 10**18); // 1 RWA = 100 USDC ratio
        vm.stopPrank();
    }

    function testUSDCSwapUpdatesRwaBalanceCorrectly() public {
        // Assert the 5,000 USDC swap updates the investor's RWA token balance correctly
        uint256 swapAmount = 5000 * 10**18;
        uint256 expectedRwaAmount = 50 * 10**18; // 5000 / 100 = 50

        // Mint USDC to investor
        usdc.mint(investor, swapAmount);

        // Pre-swap balances
        assertEq(rwaToken.balanceOf(investor), 0);
        assertEq(usdc.balanceOf(investor), swapAmount);

        // Execute Swap
        vm.startPrank(investor);
        usdc.approve(address(pool), swapAmount);
        pool.swap(address(usdc), swapAmount);
        vm.stopPrank();

        // Post-swap balances
        assertEq(usdc.balanceOf(investor), 0, "Investor USDC should be depleted");
        assertEq(rwaToken.balanceOf(investor), expectedRwaAmount, "Investor should receive exactly 50 RWA");
        
        // Assert reserves are updated correctly
        assertEq(pool.reserveUSDC(), (1000000 * 10**18) + swapAmount);
        assertEq(pool.reserveRWA(), (10000 * 10**18) - expectedRwaAmount);
    }
}
