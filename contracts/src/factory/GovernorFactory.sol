// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../governance/RWAGovernor.sol";

contract GovernorFactory {
    function createGovernor(IVotes token) external returns (address) {
        return address(new RWAGovernor(token));
    }
}
