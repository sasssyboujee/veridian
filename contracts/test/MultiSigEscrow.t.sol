// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/escrow/MultiSigEscrow.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockUSD is ERC20 {
    constructor() ERC20("Mock USD", "USDC") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MultiSigEscrowTest is Test {
    MultiSigEscrow public escrow;
    MockUSD public usdc;
    
    address s1 = address(0x1);
    address s2 = address(0x2);
    address s3 = address(0x3);
    address s4 = address(0x4);
    address s5 = address(0x5);
    
    address[] signers;
    
    address seller = address(0x99);
    address buyer = address(0x100);
    
    function setUp() public {
        signers.push(s1);
        signers.push(s2);
        signers.push(s3);
        signers.push(s4);
        signers.push(s5);
        
        usdc = new MockUSD();
        escrow = new MultiSigEscrow(address(usdc), signers);
        
        usdc.mint(buyer, 100000 * 10**18);
        
        vm.startPrank(buyer);
        usdc.approve(address(escrow), 100000 * 10**18);
        escrow.deposit(100000 * 10**18);
        vm.stopPrank();
    }
    
    function testProposeRelease() public {
        vm.prank(s1);
        escrow.proposeRelease(seller, 50000 * 10**18);
        
        (address _seller, uint256 amount, bool executed, uint256 confirmations) = escrow.proposals(0);
        assertEq(_seller, seller);
        assertEq(amount, 50000 * 10**18);
        assertFalse(executed);
        assertEq(confirmations, 1); // s1 auto confirms
    }
    
    function testConfirmReleaseExecutesAtThreshold() public {
        vm.prank(s1);
        escrow.proposeRelease(seller, 50000 * 10**18);
        
        vm.prank(s2);
        escrow.confirmRelease(0);
        
        (, , bool executedBefore, uint256 confirmationsBefore) = escrow.proposals(0);
        assertFalse(executedBefore);
        assertEq(confirmationsBefore, 2);
        assertEq(usdc.balanceOf(seller), 0);
        
        vm.prank(s3);
        escrow.confirmRelease(0);
        
        (, , bool executedAfter, uint256 confirmationsAfter) = escrow.proposals(0);
        assertTrue(executedAfter);
        assertEq(confirmationsAfter, 3);
        assertEq(usdc.balanceOf(seller), 50000 * 10**18);
    }
}
