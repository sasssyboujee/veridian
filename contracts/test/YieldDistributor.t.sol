// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/yield/YieldDistributor.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockUSD is ERC20 {
    constructor() ERC20("Mock USD", "USDC") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract YieldDistributorTest is Test {
    YieldDistributor public distributor;
    MockUSD public usdc;
    
    address forwarder = address(0x999);
    address holder1 = address(0x1);
    address holder2 = address(0x2);
    
    function setUp() public {
        usdc = new MockUSD();
        distributor = new YieldDistributor(address(usdc), forwarder);
        
        // Fund distributor
        usdc.mint(address(distributor), 1000 * 10**18);
    }
    
    function testOnReport() public {
        address[] memory holders = new address[](2);
        holders[0] = holder1;
        holders[1] = holder2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 600 * 10**18;
        amounts[1] = 400 * 10**18;
        
        uint256 totalYield = 1000 * 10**18;
        
        bytes memory report = abi.encode(totalYield, holders, amounts);
        
        vm.prank(forwarder);
        distributor.onReport(report);
        
        assertEq(usdc.balanceOf(holder1), 600 * 10**18);
        assertEq(usdc.balanceOf(holder2), 400 * 10**18);
        assertEq(usdc.balanceOf(address(distributor)), 0);
    }
    
    function testOnReportUnauthorizedFails() public {
        bytes memory report = abi.encode(1000 * 10**18, new address[](0), new uint256[](0));
        
        vm.expectRevert("Only authorized forwarder can call");
        distributor.onReport(report);
    }
}
