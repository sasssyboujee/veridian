// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract MultiSigEscrow {
    using SafeERC20 for IERC20;

    IERC20 public stablecoin;
    
    uint256 public constant REQUIRED_SIGNATURES = 3;
    uint256 public constant TOTAL_SIGNERS = 5;
    
    mapping(address => bool) public isSigner;
    
    struct Proposal {
        address seller;
        uint256 amount;
        bool executed;
        uint256 confirmations;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasConfirmed;
    uint256 public proposalCount;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed seller, uint256 amount);
    event ProposalConfirmed(uint256 indexed proposalId, address indexed signer);
    event ProposalExecuted(uint256 indexed proposalId);
    event Deposit(address indexed from, uint256 amount);

    modifier onlySigner() {
        require(isSigner[msg.sender], "Not a signer");
        _;
    }

    constructor(address _stablecoin, address[] memory signers) {
        require(signers.length == TOTAL_SIGNERS, "Must provide exactly 5 signers");
        stablecoin = IERC20(_stablecoin);
        for(uint256 i = 0; i < signers.length; i++) {
            require(signers[i] != address(0), "Invalid signer address");
            require(!isSigner[signers[i]], "Duplicate signer");
            isSigner[signers[i]] = true;
        }
    }

    function deposit(uint256 amount) external {
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    function proposeRelease(address seller, uint256 amount) external onlySigner {
        uint256 pid = proposalCount++;
        proposals[pid] = Proposal({
            seller: seller,
            amount: amount,
            executed: false,
            confirmations: 0
        });
        emit ProposalCreated(pid, seller, amount);
        
        // Auto confirm for proposer
        confirmRelease(pid);
    }

    function confirmRelease(uint256 proposalId) public onlySigner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.seller != address(0), "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!hasConfirmed[proposalId][msg.sender], "Already confirmed");
        
        hasConfirmed[proposalId][msg.sender] = true;
        proposal.confirmations++;
        emit ProposalConfirmed(proposalId, msg.sender);
        
        if (proposal.confirmations >= REQUIRED_SIGNATURES) {
            executeRelease(proposalId);
        }
    }
    
    function executeRelease(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.confirmations >= REQUIRED_SIGNATURES, "Not enough confirmations");
        
        proposal.executed = true;
        stablecoin.safeTransfer(proposal.seller, proposal.amount);
        emit ProposalExecuted(proposalId);
    }
}
