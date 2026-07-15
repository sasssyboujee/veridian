// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract YieldDistributor {
    using SafeERC20 for IERC20;

    IERC20 public stablecoin;
    address public keystoneForwarder;
    
    event YieldDistributed(uint256 totalAmount, uint256 timestamp);
    
    modifier onlyForwarder() {
        require(msg.sender == keystoneForwarder, "Only authorized forwarder can call");
        _;
    }

    constructor(address _stablecoin, address _keystoneForwarder) {
        stablecoin = IERC20(_stablecoin);
        keystoneForwarder = _keystoneForwarder;
    }

    function setKeystoneForwarder(address _keystoneForwarder) external {
        // In production this should be restricted to owner
        keystoneForwarder = _keystoneForwarder;
    }

    function onReport(bytes calldata report) external onlyForwarder {
        // Assume report is abi-encoded: (uint256 totalYield, address[] memory holders, uint256[] memory amounts)
        (uint256 totalYield, address[] memory holders, uint256[] memory amounts) = abi.decode(report, (uint256, address[], uint256[]));
        
        require(holders.length == amounts.length, "Mismatched arrays");
        
        // Contract must have enough stablecoin
        require(stablecoin.balanceOf(address(this)) >= totalYield, "Insufficient yield balance");
        
        for (uint256 i = 0; i < holders.length; i++) {
            if (amounts[i] > 0) {
                stablecoin.safeTransfer(holders[i], amounts[i]);
            }
        }
        
        emit YieldDistributed(totalYield, block.timestamp);
    }
}
