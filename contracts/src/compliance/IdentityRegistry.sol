// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import "./ClaimTopicsRegistry.sol";
import "./TrustedIssuersRegistry.sol";

contract IdentityRegistry is Ownable {
    ClaimTopicsRegistry public topicsRegistry;
    TrustedIssuersRegistry public issuersRegistry;

    // identity address => ONCHAINID (represented as address for simplicity)
    mapping(address => address) private _identities;
    
    // For simplicity in this demo, we assume the registry keeps track of verification status
    // In a full implementation, this queries an Identity contract's claims directly
    mapping(address => bool) private _verified;

    event IdentityRegistered(address indexed userAddress, address indexed identity);
    event IdentityVerified(address indexed userAddress);
    event IdentityRevoked(address indexed userAddress);

    constructor(address _topicsRegistry, address _issuersRegistry) Ownable(msg.sender) {
        topicsRegistry = ClaimTopicsRegistry(_topicsRegistry);
        issuersRegistry = TrustedIssuersRegistry(_issuersRegistry);
    }

    function registerIdentity(address userAddress, address identity) external onlyOwner {
        require(userAddress != address(0), "Invalid user address");
        require(identity != address(0), "Invalid identity address");
        require(_identities[userAddress] == address(0), "Identity already registered");
        _identities[userAddress] = identity;
        emit IdentityRegistered(userAddress, identity);
    }

    function verifyIdentity(address userAddress) external onlyOwner {
        require(userAddress != address(0), "Invalid user address");
        require(_identities[userAddress] != address(0), "Identity not registered");
        _verified[userAddress] = true;
        emit IdentityVerified(userAddress);
    }

    function revokeIdentity(address userAddress) external onlyOwner {
        require(userAddress != address(0), "Invalid user address");
        _verified[userAddress] = false;
        emit IdentityRevoked(userAddress);
    }

    function isVerified(address userAddress) external view returns (bool) {
        return _verified[userAddress];
    }

    function identityOf(address userAddress) external view returns (address) {
        return _identities[userAddress];
    }
}
