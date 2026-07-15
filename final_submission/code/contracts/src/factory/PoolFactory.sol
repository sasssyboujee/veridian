// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../market/RWALiquidityPool.sol";

contract PoolFactory {
    function createPool(address rwaToken, address usdc) external returns (address) {
        return address(new RWALiquidityPool(rwaToken, usdc));
    }
}
