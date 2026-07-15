// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "openzeppelin-contracts/contracts/utils/Nonces.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import "../compliance/IdentityRegistry.sol";

contract RWAToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    IdentityRegistry public identityRegistry;
    
    mapping(address => bool) private _agents;
    mapping(address => bool) private _frozenAddresses;

    event AgentAdded(address indexed agent);
    event AgentRemoved(address indexed agent);
    event AddressFrozen(address indexed user, bool status);
    event ForcedTransfer(address indexed from, address indexed to, uint256 amount);

    modifier onlyAgent() {
        require(_agents[msg.sender] || msg.sender == owner(), "Not an agent");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address _identityRegistry
    ) ERC20(name_, symbol_) ERC20Permit(name_) Ownable(msg.sender) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    function addAgent(address agent) external onlyOwner {
        _agents[agent] = true;
        emit AgentAdded(agent);
    }

    function removeAgent(address agent) external onlyOwner {
        _agents[agent] = false;
        emit AgentRemoved(agent);
    }

    function setAddressFrozen(address user, bool status) external onlyAgent {
        _frozenAddresses[user] = status;
        emit AddressFrozen(user, status);
    }

    function mint(address to, uint256 amount) external onlyAgent {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyAgent {
        _burn(from, amount);
    }

    function forcedTransfer(address from, address to, uint256 amount) external onlyAgent {
        _transfer(from, to, amount);
        emit ForcedTransfer(from, to, amount);
    }

    // Required overrides by OpenZeppelin 5.0
    function _update(address from, address to, uint256 value) internal virtual override(ERC20, ERC20Votes) {
        // Compliance checks for non-mint/non-burn
        if (from != address(0)) {
            require(identityRegistry.isVerified(from), "Sender identity not verified");
            require(!_frozenAddresses[from], "Sender is frozen");
        }
        if (to != address(0)) {
            require(identityRegistry.isVerified(to), "Receiver identity not verified");
            require(!_frozenAddresses[to], "Receiver is frozen");
        }
        super._update(from, to, value);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
