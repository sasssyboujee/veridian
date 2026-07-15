// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/token/RWAToken.sol";
import "../src/compliance/IdentityRegistry.sol";
import "../src/compliance/ClaimTopicsRegistry.sol";
import "../src/compliance/TrustedIssuersRegistry.sol";

contract RWATokenTest is Test {
    RWAToken public token;
    IdentityRegistry public identityRegistry;
    ClaimTopicsRegistry public topicsRegistry;
    TrustedIssuersRegistry public issuersRegistry;
    
    address owner = address(0x1);
    address agent = address(0x2);
    address user1 = address(0x3);
    address user2 = address(0x4);
    address id1 = address(0x11);
    address id2 = address(0x12);
    
    function setUp() public {
        vm.startPrank(owner);
        
        topicsRegistry = new ClaimTopicsRegistry();
        issuersRegistry = new TrustedIssuersRegistry();
        identityRegistry = new IdentityRegistry(address(topicsRegistry), address(issuersRegistry));
        
        token = new RWAToken("RWA Equipment", "RWAE", address(identityRegistry));
        token.addAgent(agent);
        
        // Register identities
        identityRegistry.registerIdentity(user1, id1);
        identityRegistry.registerIdentity(user2, id2);
        
        vm.stopPrank();
    }
    
    function testMintToVerified() public {
        vm.prank(owner);
        identityRegistry.verifyIdentity(user1);
        
        vm.prank(agent);
        token.mint(user1, 1000 * 10**18);
        
        assertEq(token.balanceOf(user1), 1000 * 10**18);
    }
    
    function testMintToUnverifiedFails() public {
        vm.prank(agent);
        vm.expectRevert("Receiver identity not verified");
        token.mint(user1, 1000 * 10**18);
    }
    
    function testTransferBetweenVerified() public {
        vm.startPrank(owner);
        identityRegistry.verifyIdentity(user1);
        identityRegistry.verifyIdentity(user2);
        vm.stopPrank();
        
        vm.prank(agent);
        token.mint(user1, 1000 * 10**18);
        
        vm.prank(user1);
        token.transfer(user2, 500 * 10**18);
        
        assertEq(token.balanceOf(user1), 500 * 10**18);
        assertEq(token.balanceOf(user2), 500 * 10**18);
    }
    
    function testTransferToUnverifiedFails() public {
        vm.prank(owner);
        identityRegistry.verifyIdentity(user1);
        
        vm.prank(agent);
        token.mint(user1, 1000 * 10**18);
        
        vm.prank(user1);
        vm.expectRevert("Receiver identity not verified");
        token.transfer(user2, 500 * 10**18);
    }
    
    function testForcedTransfer() public {
        vm.startPrank(owner);
        identityRegistry.verifyIdentity(user1);
        identityRegistry.verifyIdentity(user2);
        vm.stopPrank();
        
        vm.prank(agent);
        token.mint(user1, 1000 * 10**18);
        
        vm.prank(agent);
        token.forcedTransfer(user1, user2, 1000 * 10**18);
        
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.balanceOf(user2), 1000 * 10**18);
    }
}
