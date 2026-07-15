// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RWAToken.sol";
import "../compliance/IdentityRegistry.sol";
import "../factory/GovernorFactory.sol";
import "../factory/PoolFactory.sol";
import {IVotes} from "openzeppelin-contracts/contracts/governance/utils/IVotes.sol";

contract RWAFactory {
    IdentityRegistry public identityRegistry;
    address public usdc;
    GovernorFactory public governorFactory;
    PoolFactory public poolFactory;

    struct AssetData {
        address tokenAddress;
        string name;
        string symbol;
        address governorAddress;
        address poolAddress;
    }

    AssetData[] public deployedAssetsData;

    event AssetCreated(address indexed assetAddress, address governorAddress, address poolAddress, string name, string symbol, address indexed creator);

    constructor(
        address _identityRegistry, 
        address _usdc,
        address _governorFactory,
        address _poolFactory
    ) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        usdc = _usdc;
        governorFactory = GovernorFactory(_governorFactory);
        poolFactory = PoolFactory(_poolFactory);
    }

    function createAsset(string memory name, string memory symbol, uint256 initialSupply) external returns (address) {
        require(identityRegistry.isVerified(msg.sender), "Creator identity not verified");

        // Deploy new token
        RWAToken newToken = new RWAToken(name, symbol, address(identityRegistry));
        
        // Grant the creator agent status
        newToken.addAgent(msg.sender);
        newToken.addAgent(address(this));
        
        if (initialSupply > 0) {
            newToken.mint(msg.sender, initialSupply);
        }
        newToken.removeAgent(address(this));
        newToken.transferOwnership(msg.sender);

        // Deploy Governor using external factory to save bytecode size
        address newGovernor = governorFactory.createGovernor(IVotes(address(newToken)));

        // Deploy Liquidity Pool using external factory
        address newPool = poolFactory.createPool(address(newToken), usdc);

        // Save to factory array
        deployedAssetsData.push(AssetData({
            tokenAddress: address(newToken),
            name: name,
            symbol: symbol,
            governorAddress: newGovernor,
            poolAddress: newPool
        }));

        emit AssetCreated(address(newToken), newGovernor, newPool, name, symbol, msg.sender);

        return address(newToken);
    }

    function getAllAssetsData() external view returns (AssetData[] memory) {
        return deployedAssetsData;
    }
}
