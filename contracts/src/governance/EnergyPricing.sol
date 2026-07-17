// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAggregatorV3
 * @dev Simplified Chainlink AggregatorV3Interface for retrieving oracle feeds.
 */
interface IAggregatorV3 {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title EnergyPricing
 * @notice Manages energy billing rates with an Oracle-Based Dynamic Cap guardrail.
 * @dev Ensures that the price set by the DAO remains at least 10% cheaper than the utility grid rate.
 */
contract EnergyPricing {
    address public governor;
    address public gridPriceFeed;
    uint256 public energyPrice; // Represented in the same decimals as the oracle feed (typically 8 decimals)

    event PriceUpdated(uint256 newPrice, uint256 gridPrice, uint256 timestamp);
    event GridPriceFeedUpdated(address indexed oldFeed, address indexed newFeed);
    event GovernorUpdated(address indexed oldGovernor, address indexed newGovernor);

    modifier onlyGovernor() {
        require(msg.sender == governor, "EnergyPricing: caller is not the governor");
        _;
    }

    constructor(
        address _governor,
        address _gridPriceFeed,
        uint256 _initialPrice
    ) {
        require(_governor != address(0), "EnergyPricing: governor cannot be zero address");
        require(_gridPriceFeed != address(0), "EnergyPricing: price feed cannot be zero address");
        governor = _governor;
        gridPriceFeed = _gridPriceFeed;
        energyPrice = _initialPrice;
    }

    /**
     * @notice Updates the Chainlink Oracle price feed address.
     * @param _newFeed The new aggregator address.
     */
    function setGridPriceFeed(address _newFeed) external onlyGovernor {
        require(_newFeed != address(0), "EnergyPricing: price feed cannot be zero address");
        emit GridPriceFeedUpdated(gridPriceFeed, _newFeed);
        gridPriceFeed = _newFeed;
    }

    /**
     * @notice Sets the new energy price, subject to the 90% grid price cap constraint.
     * @param _newPrice The proposed energy rate (using the same decimals as the oracle).
     */
    function setEnergyPrice(uint256 _newPrice) external onlyGovernor {
        uint256 currentGridPrice = getGridPrice();
        
        // Dynamic Cap: proposed price must be <= 90% of grid price
        uint256 maxAllowedPrice = (currentGridPrice * 90) / 100;
        require(_newPrice <= maxAllowedPrice, "EnergyPricing: price exceeds 90% of grid rate");
        
        energyPrice = _newPrice;
        emit PriceUpdated(_newPrice, currentGridPrice, block.timestamp);
    }

    /**
     * @notice Updates the DAO governor address.
     * @param _newGovernor The new governor address.
     */
    function setGovernor(address _newGovernor) external onlyGovernor {
        require(_newGovernor != address(0), "EnergyPricing: governor cannot be zero address");
        emit GovernorUpdated(governor, _newGovernor);
        governor = _newGovernor;
    }

    /**
     * @notice Fetches the latest grid price from the Chainlink price feed.
     * @dev Enforces freshness and validity checks on the oracle data.
     */
    function getGridPrice() public view returns (uint256) {
        (, int256 answer, , uint256 updatedAt, ) = IAggregatorV3(gridPriceFeed).latestRoundData();
        require(answer > 0, "EnergyPricing: invalid grid price from oracle");
        
        // Oracle freshness check: ensure the price was updated in the last 24 hours
        require(block.timestamp - updatedAt < 1 days, "EnergyPricing: stale oracle price feed");
        
        return uint256(answer);
    }
}
