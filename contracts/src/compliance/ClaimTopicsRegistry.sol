// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract ClaimTopicsRegistry is Ownable {
    mapping(uint256 => bool) private _claimTopics;
    uint256[] private _claimTopicsList;

    event ClaimTopicAdded(uint256 indexed claimTopic);
    event ClaimTopicRemoved(uint256 indexed claimTopic);

    constructor() Ownable(msg.sender) {}

    function addClaimTopic(uint256 claimTopic) external onlyOwner {
        require(!_claimTopics[claimTopic], "Topic already exists");
        _claimTopics[claimTopic] = true;
        _claimTopicsList.push(claimTopic);
        emit ClaimTopicAdded(claimTopic);
    }

    function removeClaimTopic(uint256 claimTopic) external onlyOwner {
        require(_claimTopics[claimTopic], "Topic does not exist");
        _claimTopics[claimTopic] = false;
        
        for (uint256 i = 0; i < _claimTopicsList.length; i++) {
            if (_claimTopicsList[i] == claimTopic) {
                _claimTopicsList[i] = _claimTopicsList[_claimTopicsList.length - 1];
                _claimTopicsList.pop();
                break;
            }
        }
        emit ClaimTopicRemoved(claimTopic);
    }

    function getClaimTopics() external view returns (uint256[] memory) {
        return _claimTopicsList;
    }
}
