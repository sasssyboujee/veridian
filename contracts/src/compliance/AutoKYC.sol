// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";

contract AutoKYC {
    IdentityRegistry public identityRegistry;

    constructor(address _identityRegistry) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    // In a production environment, this is ONLY callable by an authorized backend
    // after a user passes a real KYC/AML check.
    function verifyAddress(address user) external {
        // TODO: add onlyOwner modifier when integrated with real auth backend
        if (identityRegistry.identityOf(user) == address(0)) {
            identityRegistry.registerIdentity(user, user);
        }
        
        if (!identityRegistry.isVerified(user)) {
            identityRegistry.verifyIdentity(user);
        }
    }
}
