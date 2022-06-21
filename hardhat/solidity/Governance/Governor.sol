pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: BSD-3-Clause

/* Copyright 2021 Compound Labs, Inc.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors
may be used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

// Original work from Compound: https://github.com/compound-finance/compound-protocol/blob/master/contracts/Governance/GovernorAlpha.sol
// Modified to work in the NetEmissionsTokenNetwork system
import "hardhat/console.sol";

contract Governor {
    /// @notice The name of this contract
    string public constant name = "CLM8 DAO Governor";

    uint256 private quorum = 632e9; // sqrt(4% of supply) dCLM8
    uint256 private thresholdToStakeProposal = 100000e18; // 100,000 = 1% of Dclm8

    /// @notice The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
    function quorumVotes() public view returns (uint256) {
        return quorum;
    }

    /// @notice The number of votes required in order for a voter to become a proposer
    function proposalThreshold() public view returns (uint256) {
        return thresholdToStakeProposal;
    }

    /// @notice The maximum number of actions that can be included in a proposal
    function proposalMaxOperations() public pure returns (uint256) {
        return 10;
    } // 10 actions

    /// @notice The delay before voting on a proposal may take place, once proposed
    function votingDelay() public pure returns (uint256) {
        return 1;
    } // 1 block

    /// @notice The duration of voting on a proposal, in blocks
    function votingPeriod() public pure returns (uint256) {
        return 5760;
    } // ~3 days in blocks (assuming 5s blocks)

    /// @notice The duration of the votes cancel period, in blocks
    function votesCancelPeriod() public pure returns (uint256) {
        return 320;
    } // 4 hours

    /// @notice The address of the timelock
    TimelockInterface public timelock;

    /// @notice The address of the DAO token
    Dclm8Interface public dclm8;

    /// @notice The address of the Governor Guardian
    address public guardian;

    /// @notice The total number of proposals
    uint256 public proposalCount;

    /// @notice The duration of the proposal cancel period, in blocks
    function proposalCancelPeriod() public pure returns (uint256) {
        return 320;
    } // 4 hours

    struct Proposal {
        // @notice Unique id for looking up a proposal
        uint256 id;
        // @notice Creator of the proposal
        address proposer;
        // @notice The timestamp that the proposal will be available for execution, set once the vote succeeds
        uint256 eta;
        // @notice the ordered list of target addresses for calls to be made
        address[] targets;
        // @notice The ordered list of values (i.e. msg.value) to be passed to the calls to be made
        uint256[] values;
        // @notice The ordered list of function signatures to be called
        string[] signatures;
        // @notice The ordered list of calldata to be passed to each call
        bytes[] calldatas;
        // @notice The block at which voting begins: holders must delegate their votes prior to this block
        uint256 startBlock;
        // @notice The block at which voting ends: votes must be cast prior to this block
        uint256 endBlock;
        // @notice Current number of votes in favor of this proposal
        uint256 forVotes;
        // @notice Current number of votes in opposition to this proposal
        uint256 againstVotes;
        // @notice Current staked number of CLM8 signifying a for vote to burn or return after voting period
        uint256 rawForVotes;
        // @notice Current staked number of CLM8 signifying a against vote to burn or return after voting period
        uint256 rawAgainstVotes;
        // @notice Flag marking whether the proposal has been canceled
        bool canceled;
        // @notice Flag marking whether the proposal has been executed
        bool executed;
        // @notes Description of the proposal
        string description;
        // @notice id for parent proposal (if a child multi-attribute proposal)
        uint256 parentProposalId;
        // @notice ids for child proposals (if a parent multi-attribute proposal)
        uint256[] childProposalIds;
        // @notice Receipts of ballots for the entire set of voters
        mapping(address => Receipt) receipts;
        // @notice The block at which proposal cancel period ends
        uint256 endProposalCancelPeriodBlock;
    }

    /// @notice Ballot receipt record for a voter
    struct Receipt {
        // @notice Whether or not a vote has been cast
        bool hasVoted;
        // @notice Whether or not the voter supports the proposal
        bool support;
        // @notice The number of votes from the sqrt of CLM8 sent
        uint96 votes;
        // @notice The number of CLM8 burned for votes
        uint96 rawVotes;
        // @notice Whether or not a user has refunded their votes tokens if eligible
        bool hasVotesRefunded;
        // @notice The block at which votes cancel period ends
        uint256 endVotesCancelPeriodBlock;
    }

    /// @notice Possible states that a proposal may be in
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        QuorumFailed,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    /// @notice The official record of all proposals ever proposed
    mapping(uint256 => Proposal) public proposals;

    /// @notice The latest proposal for each proposer
    mapping(address => uint256) public latestProposalIds;

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,uint256 chainId,address verifyingContract)"
        );

    /// @notice The EIP-712 typehash for the ballot struct used by the contract
    bytes32 public constant BALLOT_TYPEHASH =
        keccak256("Ballot(uint256 proposalId,bool support)");

    /// @notice An event emitted when a new proposal is created
    event ProposalCreated(
        uint256 id,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );

    /// @notice An event emitted when a vote has been cast on a proposal
    event VoteCast(
        address voter,
        uint256 proposalId,
        bool support,
        uint256 votes
    );

    /// @notice An event emitted when a proposal has been canceled
    event ProposalCanceled(uint256 id);

    /// @notice An event emitted when a proposal has been queued in the Timelock
    event ProposalQueued(uint256 id, uint256 eta);

    /// @notice An event emitted when a proposal has been executed in the Timelock
    event ProposalExecuted(uint256 id);

    constructor(
        address timelock_,
        address dclm8_,
        address guardian_
    ) {
        timelock = TimelockInterface(timelock_);
        dclm8 = Dclm8Interface(dclm8_);
        guardian = guardian_;
    }

    function setProposalThreshold(uint256 _proposalThreshold) external {
        require(
            msg.sender == guardian,
            "Governor::setProposalThreshold: must be guardian"
        );
        thresholdToStakeProposal = _proposalThreshold;
    }

    function setQuorum(uint256 _quorum) external {
        require(
            msg.sender == guardian,
            "Governor::setQuorum: must be guardian"
        );
        quorum = _quorum;
    }

    function _setChildProposalIds(uint256[] memory ids) internal {
        Proposal storage p = proposals[ids[0]];
        for (uint256 i = 1; i < ids.length; i++) {
            // skip 1 because 0 is the parent proposal
            p.childProposalIds.push(ids[i]);
        }
    }

    function proposeMultiAttribute(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string[] memory descriptions
    ) public returns (uint256) {
        // targets[0] => master proposal, targets[1] => child proposal #1, targets[2] => child proposal #2...
        // unlike propose(), we require only 1 function call per proposal in a multi-attribute proposal
        // so each array value in the arguments can be assumed to be a unique proposal
        require(
            targets.length == descriptions.length,
            "Governor::propose: proposal function information arity mismatch"
        );

        // iterate through targets.length and call propose() for each proposal
        // 0 is parent, 1..n are children
        uint256[] memory ids = new uint256[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            // wrap arguments in arrays
            address[] memory target = new address[](1);
            uint256[] memory value = new uint256[](1);
            string[] memory signature = new string[](1);
            bytes[] memory data = new bytes[](1);
            target[0] = targets[i];
            value[0] = values[i];
            signature[0] = signatures[i];
            data[0] = calldatas[i];

            // make proposal
            uint256 id = _createProposal(
                target,
                value,
                signature,
                data,
                descriptions[i]
            );

            ids[i] = id;

            // set parent references in child proposals
            if (i > 0) {
                Proposal storage p = proposals[id];
                p.parentProposalId = ids[0];
            }
        }

        // set children on parent proposal
        _setChildProposalIds(ids);
        // also vote for the proposal
        _castVoteInternal(
            msg.sender,
            ids[0],
            true,
            uint96(proposalThreshold())
        );

        return ids[0];
    }

    function _createProposal(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) internal returns (uint256 proposalId) {
        require(
            targets.length == values.length &&
                targets.length == signatures.length &&
                targets.length == calldatas.length,
            "Governor::propose: proposal function information arity mismatch"
        );
        require(targets.length != 0, "Governor::propose: must provide actions");
        require(
            targets.length <= proposalMaxOperations(),
            "Governor::propose: too many actions"
        );

        // lock proposal threshold (the refund function handles the logic for eligible amount to withdraw)
        require(
            dclm8.balanceOf(msg.sender) >= proposalThreshold(),
            "Governor::propose: not enough balance to lock dCLM8 with proposal"
        );

        uint256 startBlock = add256(block.number, votingDelay());
        uint256 endBlock = add256(startBlock, votingPeriod());
        uint256 endProposalCancelPeriodBlock = add256(
            startBlock,
            proposalCancelPeriod()
        );
        proposalCount++;

        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.eta = 0;
        p.targets = targets;
        p.values = values;
        p.signatures = signatures;
        p.calldatas = calldatas;
        p.startBlock = startBlock;
        p.endBlock = endBlock;
        p.forVotes = 0;
        p.againstVotes = 0;
        p.rawForVotes = 0;
        p.rawAgainstVotes = 0;
        p.canceled = false;
        p.executed = false;
        p.description = description;
        p.endProposalCancelPeriodBlock = endProposalCancelPeriodBlock;

        latestProposalIds[p.proposer] = p.id;

        emit ProposalCreated(
            p.id,
            msg.sender,
            targets,
            values,
            signatures,
            calldatas,
            startBlock,
            endBlock,
            description
        );
        return p.id;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        require(
            dclm8.getPriorVotes(msg.sender, sub256(block.number, 1)) >=
                proposalThreshold(),
            "Governor::propose: proposer votes below proposal threshold"
        );
        uint256 pid = _createProposal(
            targets,
            values,
            signatures,
            calldatas,
            description
        );
        // also vote for the proposal
        _castVoteInternal(msg.sender, pid, true, uint96(proposalThreshold()));
        return pid;
    }

    function queue(uint256 proposalId) public {
        require(
            state(proposalId) == ProposalState.Succeeded,
            "Governor::queue: proposal can only be queued if it is succeeded"
        );
        Proposal storage proposal = proposals[proposalId];

        // burn all dCLM8 associated with this proposal (minus proposalThreshold for reward)
        dclm8._burn(
            address(this),
            uint96(
                sub256(
                    add256(proposal.rawForVotes, proposal.rawAgainstVotes),
                    proposalThreshold()
                )
            )
        );

        uint256 eta = add256(block.timestamp, timelock.delay());
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            _queueOrRevert(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta
            );
        }
        proposal.eta = eta;
        emit ProposalQueued(proposalId, eta);
    }

    function _queueOrRevert(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) internal {
        require(
            !timelock.queuedTransactions(
                keccak256(abi.encode(target, value, signature, data, eta))
            ),
            "Governor::_queueOrRevert: proposal action already queued at eta"
        );
        timelock.queueTransaction(target, value, signature, data, eta);
    }

    function execute(uint256 proposalId) public payable {
        require(
            state(proposalId) == ProposalState.Queued,
            "Governor::execute: proposal can only be executed if it is queued"
        );
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            timelock.executeTransaction{value: proposal.values[i]}(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
        }
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) public {
        ProposalState currentState = state(proposalId);
        require(
            currentState == ProposalState.Active,
            "Governor::cancel: proposal should be active"
        );

        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == guardian || msg.sender == proposal.proposer,
            "Governor::cancel: you cannot cancel proposal"
        );

        require(
            block.number <= proposal.endProposalCancelPeriodBlock,
            "Governor::cancel: you cannot cancel proposal, cancel period is ended"
        );
        require(
            proposal.rawForVotes <= proposalThreshold() &&
                proposal.rawAgainstVotes <= proposalThreshold(),
            "Governor::cancel: you cannot cancel proposal with someone voted"
        );

        proposal.canceled = true;
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            timelock.cancelTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
        }

        emit ProposalCanceled(proposalId);
    }

    function getActions(uint256 proposalId)
        public
        view
        returns (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas
        )
    {
        Proposal storage p = proposals[proposalId];
        return (p.targets, p.values, p.signatures, p.calldatas);
    }

    function getReceipt(uint256 proposalId, address voter)
        public
        view
        returns (Receipt memory)
    {
        return proposals[proposalId].receipts[voter];
    }

    function getDescription(uint256 proposalId)
        public
        view
        returns (string memory)
    {
        return proposals[proposalId].description;
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        require(
            proposalCount >= proposalId && proposalId > 0,
            "Governor::state: invalid proposal id"
        );
        Proposal storage proposal = proposals[proposalId];

        // check if parent/child proposal
        bool isChildProposal = false;
        bool isParentProposal = false;
        if (proposal.parentProposalId > 0) {
            isChildProposal = true;
        } else if (proposal.childProposalIds.length > 0) {
            isParentProposal = true;
        }

        // calculate votes and quorum
        // for parent proposals, add up all the votes for and against of all child proposals for quorum
        // all sub-proposals must pass for parent to pass; if any fails, parent fails
        // TODO: optimize more for gas savings by returning early when possible and test edge cases
        uint256 forVotes = proposal.forVotes;
        uint256 againstVotes = proposal.againstVotes;
        if (isParentProposal) {
            for (uint256 i = 0; i < proposal.childProposalIds.length; i++) {
                Proposal storage child = proposals[
                    proposal.childProposalIds[i]
                ];

                // return defeated state early if non-active proposal and more against votes than for votes
                if (
                    block.number > proposal.endBlock &&
                    child.forVotes <= child.againstVotes
                ) {
                    return ProposalState.Defeated;
                }
            }
        }

        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (
            !isChildProposal && forVotes + againstVotes < quorumVotes()
        ) {
            return ProposalState.QuorumFailed;
        } else if (forVotes <= againstVotes) {
            return ProposalState.Defeated;
        } else if (proposal.eta == 0) {
            return ProposalState.Succeeded;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (
            block.timestamp >= add256(proposal.eta, timelock.GRACE_PERIOD())
        ) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Queued;
        }
    }

    function castVote(
        uint256 proposalId,
        bool support,
        uint96 votes
    ) public {
        return _castVote(msg.sender, proposalId, support, votes);
    }

    function castVoteBySig(
        uint256 proposalId,
        bool support,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint96 votes
    ) public {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                getChainId(),
                address(this)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(BALLOT_TYPEHASH, proposalId, support)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        address signatory = ecrecover(digest, v, r, s);
        require(
            signatory != address(0),
            "Governor::castVoteBySig: invalid signature"
        );
        return _castVote(signatory, proposalId, support, votes);
    }

    function _castVote(
        address voter,
        uint256 proposalId,
        bool support,
        uint96 votes
    ) internal {
        require(
            state(proposalId) == ProposalState.Active,
            "Governor::_castVote: voting is closed"
        );
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];

        // do not allow topping off vote
        require(
            msg.sender != proposal.proposer,
            "Governor::_castVote: proposer cannot top off vote"
        );
        require(
            receipt.hasVoted == false,
            "Governor::_castVote: cannot top off same vote without refunding"
        );

        uint96 eligibleVotes = dclm8.getPriorVotes(voter, proposal.startBlock) -
            receipt.votes;
        require(
            votes <= eligibleVotes,
            "Governor::_castVote: votes exceeds eligible amount"
        );

        _castVoteInternal(voter, proposalId, support, votes);
    }

    function _accountVotes(
        address voter,
        uint256 proposalId,
        bool support,
        uint96 votes,
        bool lockTokens
    ) internal {
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        // because topping off vote is allowed we need to account for prior vote amount
        uint96 quadraticVoteDiff = uint96(
            sqrt(votes + receipt.rawVotes) - sqrt(receipt.rawVotes)
        );

        if (support) {
            proposal.forVotes = add256(proposal.forVotes, quadraticVoteDiff);
            proposal.rawForVotes = add256(proposal.rawForVotes, votes);
        } else {
            proposal.againstVotes = add256(
                proposal.againstVotes,
                quadraticVoteDiff
            );
            proposal.rawAgainstVotes = add256(proposal.rawAgainstVotes, votes);
        }

        if (lockTokens) {
            // lock dCLM8 tokens
            dclm8._lockTokens(voter, votes);
        }

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.rawVotes = uint96(add256(receipt.rawVotes, votes));
        receipt.votes = uint96(sqrt(receipt.rawVotes));
        receipt.hasVotesRefunded = false;
        receipt.endVotesCancelPeriodBlock = add256(
            block.number,
            votesCancelPeriod()
        );

        if (lockTokens) {
            emit VoteCast(voter, proposal.id, support, quadraticVoteDiff);
        }
    }

    function _castVoteInternal(
        address voter,
        uint256 proposalId,
        bool support,
        uint96 votes
    ) internal {
        Proposal storage proposal = proposals[proposalId];

        // if parent proposal, split vote equally between child proposals and return early
        uint256 numChildProposals = proposal.childProposalIds.length;
        if (numChildProposals > 0) {
            uint96 splitVotes = uint96(div256(votes, numChildProposals)); // TODO: check math
            for (uint256 i = 0; i < numChildProposals; i++) {
                _castVoteInternal(
                    msg.sender,
                    proposal.childProposalIds[i],
                    support,
                    splitVotes
                );
            }
            return;
        }

        // if voting for a child proposal also account the votes on the parent for Quorum purposes
        if (proposal.parentProposalId > 0) {
            _accountVotes(
                voter,
                proposal.parentProposalId,
                support,
                votes,
                false
            );
        }

        _accountVotes(voter, proposalId, support, votes, true);
    }

    function refund(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];

        require(
            receipt.hasVotesRefunded == false,
            "Governor::refund: already refunded this proposal"
        );

        // check if parent proposal
        if (proposal.childProposalIds.length > 0) {
            uint256 numChildProposals = proposal.childProposalIds.length;
            if (numChildProposals > 0) {
                for (uint256 i = 0; i < numChildProposals; i++) {
                    _refund(proposal.childProposalIds[i], true);
                }
                return;
            }
        }
        // else
        _refund(proposalId, false);
    }

    function _refund(uint256 proposalId, bool skipAlreadyRefunded) internal {
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];

        if (skipAlreadyRefunded && receipt.hasVotesRefunded == true) {
            return;
        }

        require(
            receipt.hasVotesRefunded == false,
            "Governor::refund: already refunded this proposal"
        );

        ProposalState pState = state(proposalId);

        // check if child proposal
        // if it is a child proposal, consider the state of the parent proposal
        bool isChildProposal = false;
        ProposalState parentState = pState;
        if (proposal.parentProposalId > 0) {
            isChildProposal = true;
            parentState = state(proposal.parentProposalId);
            // if the parent Quorum Failed, consider the child to also be Quorum Failed
            // if the parent is Defeated (which it is if any of the child is Defeated), consider this child to also be Defeated
            if (
                parentState == ProposalState.QuorumFailed ||
                parentState == ProposalState.Defeated
            ) {
                pState = parentState;
            }
        }

        // should not allow cancel user votes after proposal cancel period ended
        if (pState == ProposalState.Active) {
            require(
                block.number <= receipt.endVotesCancelPeriodBlock,
                "Governor::refund: not eligible for refund, votes cancel period is ended"
            );
        }

        uint256 amount;
        // on active proposal this is the amount of votes to change
        uint256 votesAmount = 0;
        bool isProposer = (msg.sender == proposal.proposer);
        bool isActive = pState == ProposalState.Active;

        // if msg.sender is proposer and the vote is defeated because there were many votes against, the proposer does not get any tokens back.
        require(
            !(isProposer && pState == ProposalState.Defeated),
            "Governor::refund: not eligible for refund"
        );
        // if msg.sender is proposer and failed quorum, set amount to 3/4 of proposal threshold plus votes
        // if msg.sender is proposer and succeeded, set to 150% proposal threshold plus votes
        // otherwise, set to user's raw vote count (in dCLM8)
        bool proposalPassedAndIsProposer = isProposer &&
            (pState == ProposalState.Succeeded ||
                pState == ProposalState.Queued ||
                pState == ProposalState.Executed ||
                pState == ProposalState.Defeated ||
                pState == ProposalState.QuorumFailed ||
                pState == ProposalState.Canceled);
        if (proposalPassedAndIsProposer) {
            // you get your 150% back if the proposal succeeded/queued/executed
            if (
                pState == ProposalState.Succeeded ||
                pState == ProposalState.Queued ||
                pState == ProposalState.Executed
            ) {
                amount = ((receipt.rawVotes) * 3) / 2;
            } else {
                if (pState == ProposalState.QuorumFailed) {
                    // proposer loose 75% of votes
                    uint256 quarterOfStake = div256(receipt.rawVotes, 4);
                    dclm8._burn(address(this), uint96(quarterOfStake));
                    amount = uint96(quarterOfStake * 3);
                } else {
                    // otherwise proposer lose 5% of votes
                    uint256 tokensToRefund = receipt.rawVotes;
                    uint256 tokensToLose = div256(tokensToRefund, 20);
                    amount = uint96(sub256(tokensToRefund, tokensToLose));
                    // lost tokens are burned
                    dclm8._burn(address(this), uint96(tokensToLose));
                }
            }
        } else {
            // If someone tries to cancel their vote (i.e. proposal state is active) they lose 5% of their tokens.
            // the proposer cannot vote less
            if (isActive) {
                require(
                    !isProposer,
                    "Governor::refund: proposer may not change his vote amount"
                );
                uint256 tokensToRefund = receipt.rawVotes;
                votesAmount = receipt.rawVotes;
                uint256 tokensToLose = div256(tokensToRefund, 20);
                amount = uint96(sub256(tokensToRefund, tokensToLose));
                // lost tokens are burned
                dclm8._burn(address(this), uint96(tokensToLose));
            } else {
                amount = receipt.rawVotes;
            }
        }
        require(amount > 0, "Governor::refund: nothing to refund");

        bool isQuorumFailed = pState == ProposalState.QuorumFailed;
        require(
            isActive || isQuorumFailed || proposalPassedAndIsProposer,
            "Governor::refund: not eligible for refund"
        );

        // refund dCLM8 from this contract
        console.log("Governor::_refund amount", proposalId, amount);
        dclm8.transfer(msg.sender, amount);

        // if an active proposal, subtract amount from votes and locked dCLM8 amounts
        if (isActive) {
            if (receipt.support) {
                proposal.forVotes = sub256(proposal.forVotes, receipt.votes);
                proposal.rawForVotes = sub256(
                    proposal.rawForVotes,
                    votesAmount
                );
            } else {
                proposal.againstVotes = sub256(
                    proposal.againstVotes,
                    receipt.votes
                );
                proposal.rawAgainstVotes = sub256(
                    proposal.rawAgainstVotes,
                    votesAmount
                );
            }
        }

        // update receipt
        uint96 rawVoteAmount = receipt.rawVotes;
        receipt.votes = 0;
        receipt.rawVotes = 0;
        receipt.hasVoted = false;
        receipt.hasVotesRefunded = true;

        // if refunding a child proposal also account the parent receipt
        if (proposal.parentProposalId > 0) {
            _accountRefundOnParent(
                msg.sender,
                proposal.parentProposalId,
                rawVoteAmount
            );
        }
    }

    function _accountRefundOnParent(
        address voter,
        uint256 proposalId,
        uint96 rawVoteAmount
    ) internal {
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        receipt.rawVotes = uint96(sub256(receipt.rawVotes, rawVoteAmount));
        receipt.votes = uint96(sqrt(receipt.rawVotes));
        receipt.hasVoted = receipt.votes > 0;
        receipt.hasVotesRefunded = receipt.votes == 0;
        console.log(
            "Governor::_accountRefundOnParent",
            proposalId,
            rawVoteAmount
        );
        console.log(
            "Governor::_accountRefundOnParent receipt votes:",
            receipt.votes,
            receipt.rawVotes
        );
        console.log(
            "Governor::_accountRefundOnParent fully refunded?:",
            receipt.hasVotesRefunded
        );
    }

    function __acceptAdmin() public {
        require(
            msg.sender == guardian,
            "Governor::__acceptAdmin: sender must be gov guardian"
        );
        timelock.acceptAdmin();
    }

    function __abdicate() public {
        require(
            msg.sender == guardian,
            "Governor::__abdicate: sender must be gov guardian"
        );
        guardian = address(0);
    }

    function __queueSetTimelockPendingAdmin(
        address newPendingAdmin,
        uint256 eta
    ) public {
        require(
            msg.sender == guardian,
            "Governor::__queueSetTimelockPendingAdmin: sender must be gov guardian"
        );
        timelock.queueTransaction(
            address(timelock),
            0,
            "setPendingAdmin(address)",
            abi.encode(newPendingAdmin),
            eta
        );
    }

    function __executeSetTimelockPendingAdmin(
        address newPendingAdmin,
        uint256 eta
    ) public {
        require(
            msg.sender == guardian,
            "Governor::__executeSetTimelockPendingAdmin: sender must be gov guardian"
        );
        timelock.executeTransaction(
            address(timelock),
            0,
            "setPendingAdmin(address)",
            abi.encode(newPendingAdmin),
            eta
        );
    }

    function add256(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "addition overflow");
        return c;
    }

    function sub256(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "subtraction underflow");
        return a - b;
    }

    function div256(uint256 a, uint256 b) internal pure returns (uint256) {
        return _div(a, b, "division by zero");
    }

    function _div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        return c;
    }

    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function getChainId() internal view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }
}

interface TimelockInterface {
    function delay() external view returns (uint256);

    function GRACE_PERIOD() external view returns (uint256);

    function acceptAdmin() external;

    function queuedTransactions(bytes32 hash) external view returns (bool);

    function queueTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external returns (bytes32);

    function cancelTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external;

    function executeTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external payable returns (bytes memory);
}

interface Dclm8Interface {
    function getPriorVotes(address account, uint256 blockNumber)
        external
        view
        returns (uint96);

    function getTotalSupply() external pure returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function getInitialHolder() external pure returns (address);

    function _lockTokens(address src, uint96 amount) external;

    function _burn(address account, uint96 amount) external;

    function transfer(address dst, uint256 rawAmount) external returns (bool);
}
