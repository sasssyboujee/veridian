// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract TrustedIssuersRegistry is Ownable {
    // issuer address => topic => authorized
    mapping(address => mapping(uint256 => bool)) private _trustedIssuers;
    
    event TrustedIssuerAdded(address indexed issuer, uint256[] claimTopics);
    event TrustedIssuerRemoved(address indexed issuer);
    event ClaimTopicsUpdated(address indexed issuer, uint256[] claimTopics);

    constructor() Ownable(msg.sender) {}

    function addTrustedIssuer(address issuer, uint256[] calldata claimTopics) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        for (uint256 i = 0; i < claimTopics.length; i++) {
            _trustedIssuers[issuer][claimTopics[i]] = true;
        }
        emit TrustedIssuerAdded(issuer, claimTopics);
    }

    function removeTrustedIssuer(address issuer, uint256[] calldata claimTopics) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        for (uint256 i = 0; i < claimTopics.length; i++) {
            _trustedIssuers[issuer][claimTopics[i]] = false;
        }
        emit TrustedIssuerRemoved(issuer);
    }

    function isTrustedIssuer(address issuer, uint256 topic) external view returns (bool) {
        return _trustedIssuers[issuer][topic];
    }
}
