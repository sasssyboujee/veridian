// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";

contract AutoKYC {
    IdentityRegistry public identityRegistry;

    constructor(address _identityRegistry) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    // This function allows anyone to verify themselves for the sake of the live demo.
    // In a production environment, this would ONLY be callable by an authorized backend
    // after a user passes a real KYC/AML check.
    function verifyMe() external {
        // Register a dummy ONCHAINID identity address for the user (just using their own address as mock)
        if (identityRegistry.identityOf(msg.sender) == address(0)) {
            identityRegistry.registerIdentity(msg.sender, msg.sender);
        }
        
        // Mark them as verified
        if (!identityRegistry.isVerified(msg.sender)) {
            identityRegistry.verifyIdentity(msg.sender);
        }
    }

    function verifyAddress(address user) external {
        if (identityRegistry.identityOf(user) == address(0)) {
            identityRegistry.registerIdentity(user, user);
        }
        
        if (!identityRegistry.isVerified(user)) {
            identityRegistry.verifyIdentity(user);
        }
    }
}
