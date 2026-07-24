// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AutoKYC is Ownable {
    IdentityRegistry public identityRegistry;
    address public relayer;

    constructor(address _identityRegistry) Ownable(msg.sender) {
        require(_identityRegistry != address(0), "IdentityRegistry cannot be zero address");
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer || msg.sender == owner(), "Caller is not authorized relayer");
        _;
    }

    function setRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "Relayer cannot be zero address");
        relayer = _relayer;
    }

    // In a production environment, this is ONLY callable by an authorized backend relayer
    // after a user passes a real KYC/AML check.
    // The contract owner should be transferred to a Gnosis Safe multi-sig.
    function verifyAddress(address user) external onlyRelayer {
        require(user != address(0), "Cannot verify zero address");
        
        if (identityRegistry.identityOf(user) == address(0)) {
            identityRegistry.registerIdentity(user, user);
        }
        
        if (!identityRegistry.isVerified(user)) {
            identityRegistry.verifyIdentity(user);
        }
    }
}
