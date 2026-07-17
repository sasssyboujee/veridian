// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RWAVault
 * @notice A time-locked staking vault for RWAToken. 
 * Allows users to lock their tokens for 1 to 10 years to earn a higher yield multiplier.
 */
contract RWAVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable rwaToken;

    struct LockInfo {
        uint256 amount;
        uint256 unlockTime;
        uint256 lockDuration; // in seconds
    }

    // Mapping from user to their lock info
    mapping(address => LockInfo) public locks;

    uint256 public constant MIN_LOCK_DURATION = 365 days;
    uint256 public constant MAX_LOCK_DURATION = 3650 days; // 10 years

    event TokensLocked(address indexed user, uint256 amount, uint256 duration, uint256 unlockTime);
    event TokensUnlocked(address indexed user, uint256 amount);
    event LockExtended(address indexed user, uint256 newDuration, uint256 newUnlockTime);

    constructor(address _rwaToken) {
        require(_rwaToken != address(0), "Invalid token address");
        rwaToken = IERC20(_rwaToken);
    }

    /**
     * @notice Locks RWATokens for a specific duration.
     * @param amount The amount to lock.
     * @param duration The duration to lock for (in seconds).
     */
    function lock(uint256 amount, uint256 duration) external {
        require(amount > 0, "Cannot lock 0 tokens");
        require(duration >= MIN_LOCK_DURATION, "Lock duration too short");
        require(duration <= MAX_LOCK_DURATION, "Lock duration too long");
        
        LockInfo storage userLock = locks[msg.sender];
        require(userLock.amount == 0, "Tokens already locked. Use extendLock or withdraw first.");

        rwaToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 unlockTime = block.timestamp + duration;
        locks[msg.sender] = LockInfo({
            amount: amount,
            unlockTime: unlockTime,
            lockDuration: duration
        });

        emit TokensLocked(msg.sender, amount, duration, unlockTime);
    }

    /**
     * @notice Withdraws unlocked tokens.
     */
    function withdraw() external {
        LockInfo storage userLock = locks[msg.sender];
        require(userLock.amount > 0, "No tokens locked");
        require(block.timestamp >= userLock.unlockTime, "Tokens are still locked");

        uint256 amount = userLock.amount;
        
        // Reset lock state
        userLock.amount = 0;
        userLock.unlockTime = 0;
        userLock.lockDuration = 0;

        rwaToken.safeTransfer(msg.sender, amount);

        emit TokensUnlocked(msg.sender, amount);
    }

    /**
     * @notice Extends the duration of an existing lock.
     * @param additionalDuration The additional time to add to the current duration.
     */
    function extendLock(uint256 additionalDuration) external {
        LockInfo storage userLock = locks[msg.sender];
        require(userLock.amount > 0, "No tokens locked");

        uint256 newDuration = userLock.lockDuration + additionalDuration;
        require(newDuration <= MAX_LOCK_DURATION, "Total lock duration exceeds maximum");

        userLock.lockDuration = newDuration;
        
        // If the lock has already expired, calculate the new unlock time from now.
        // Otherwise, add the additional duration to the existing unlock time.
        if (block.timestamp > userLock.unlockTime) {
             userLock.unlockTime = block.timestamp + additionalDuration;
        } else {
             userLock.unlockTime += additionalDuration;
        }

        emit LockExtended(msg.sender, newDuration, userLock.unlockTime);
    }
}
