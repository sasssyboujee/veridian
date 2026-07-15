// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    // Faucet for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    // Simulating fiat onramp / swap
    function buyWithUZHETH() external payable {
        _buy(msg.sender, msg.value);
    }

    receive() external payable {
        _buy(msg.sender, msg.value);
    }

    function _buy(address to, uint256 value) internal {
        // Exchange rate: 1 UZH_ETH = 1,000,000 USDC
        // Example: 0.001 UZH_ETH (msg.value = 1e15) * 1,000,000 = 1e21 USDC (which is 1,000 USDC tokens)
        uint256 amountToMint = value * 1_000_000;
        _mint(to, amountToMint);
    }
}
