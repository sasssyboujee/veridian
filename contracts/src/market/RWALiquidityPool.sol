// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RWALiquidityPool
 * @dev Fixed-price liquidity pool for demo purposes (1 RWA = 100 USDC).
 */
contract RWALiquidityPool is ReentrancyGuard {
    IERC20 public immutable rwaToken;
    IERC20 public immutable usdc;

    uint256 public reserveRWA;
    uint256 public reserveUSDC;

    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    event AddLiquidity(address indexed provider, uint256 amountRWA, uint256 amountUSDC);

    constructor(address _rwaToken, address _usdc) {
        rwaToken = IERC20(_rwaToken);
        usdc = IERC20(_usdc);
    }

    function getSwapAmountOut(address tokenIn, uint256 amountIn) public view returns (uint256) {
        if (tokenIn == address(usdc)) {
            return amountIn / 100;
        } else if (tokenIn == address(rwaToken)) {
            return amountIn * 100;
        }
        revert("Invalid token");
    }

    function swap(address tokenIn, uint256 amountIn) external nonReentrant {
        require(tokenIn == address(usdc) || tokenIn == address(rwaToken), "Invalid token");
        uint256 amountOut = getSwapAmountOut(tokenIn, amountIn);

        if (tokenIn == address(usdc)) {
            require(reserveRWA >= amountOut, "Insufficient RWA liquidity");
            usdc.transferFrom(msg.sender, address(this), amountIn);
            rwaToken.transfer(msg.sender, amountOut);
            reserveUSDC += amountIn;
            reserveRWA -= amountOut;
        } else {
            require(reserveUSDC >= amountOut, "Insufficient USDC liquidity");
            rwaToken.transferFrom(msg.sender, address(this), amountIn);
            usdc.transfer(msg.sender, amountOut);
            reserveRWA += amountIn;
            reserveUSDC -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }

    function addLiquidity(uint256 amountRWA, uint256 amountUSDC) external {
        rwaToken.transferFrom(msg.sender, address(this), amountRWA);
        usdc.transferFrom(msg.sender, address(this), amountUSDC);
        reserveRWA += amountRWA;
        reserveUSDC += amountUSDC;
        emit AddLiquidity(msg.sender, amountRWA, amountUSDC);
    }
}
