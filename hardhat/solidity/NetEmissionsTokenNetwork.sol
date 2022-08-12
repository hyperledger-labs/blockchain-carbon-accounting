// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./CarbonTracker.sol";

contract NetEmissionsTokenNetwork is ERC1155, AccessControl {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using ECDSA for address;

    bool public limitedMode; // disables some features like arbitrary token transfers and issuing without proposals
    address private timelock; // DAO contract that executes proposals to issue tokens after a successful vote

    // Generic dealer role for registering/unregistering consumers
    bytes32 public constant REGISTERED_DEALER = keccak256("REGISTERED_DEALER");
    // Token type specific roles
    bytes32 public constant REGISTERED_REC_DEALER =
        keccak256("REGISTERED_REC_DEALER");
    bytes32 public constant REGISTERED_OFFSET_DEALER =
        keccak256("REGISTERED_OFFSET_DEALER");
    bytes32 public constant REGISTERED_EMISSIONS_AUDITOR =
        keccak256("REGISTERED_EMISSIONS_AUDITOR");
    // Consumer role
    bytes32 public constant REGISTERED_CONSUMER =
        keccak256("REGISTERED_CONSUMER");
    // Industry role (admin/dealer assigned)
    bytes32 public constant REGISTERED_INDUSTRY =
        keccak256("REGISTERED_INDUSTRY");

    /**
     * @dev Structure of all tokens issued in this contract
     * tokenId - Auto-increments whenever new tokens are issued
     * tokenTypeId - Corresponds to the three token types:
     *   1 => Renewable Energy Certificate
     *   2 => Carbon Emissions Offset
     *   3 => Audited Emissions
     *   4 => Carbon Tracker tokens (traceable emission tokens)
     * issuedBy - Address of transaction runner
     * issuedFrom - Address of dealer issuing this token
     * issuee - Address of original issued recipient this token
     * fromDate - Unix timestamp
     * thruDate - Unix timestamp
     * dateCreated - Unix timestamp
     */
    struct CarbonTokenDetails {
        uint256 tokenId;
        uint8 tokenTypeId;
        address issuedBy;
        uint160 issuedFrom;
        address issuedTo;
        uint256 fromDate;
        uint256 thruDate;
        uint256 dateCreated;
        string metadata;
        string manifest;
        string description;
        uint256 totalIssued;
        uint256 totalRetired;
    }

    // Counts number of unique token IDs (auto-incrementing)
    Counters.Counter private _numOfUniqueTokens;

    // Token metadata and retired balances
    mapping(uint256 => CarbonTokenDetails) private _tokenDetails;
    mapping(uint256 => mapping(address => uint256)) private _retiredBalances;

    // Nonce for tokeTypeId 4 transfer from => to account
    mapping(address => mapping(address => uint32)) private carbonTransferNonce;

    // Events
    event TokenCreated(
        uint256 availableBalance,
        uint256 retiredBalance,
        uint256 tokenId,
        uint8 tokenTypeId,
        address indexed issuedBy,
        uint160 indexed issuedFrom,
        address indexed issuedTo,
        uint256 fromDate,
        uint256 thruDate,
        uint256 dateCreated,
        string metadata,
        string manifest,
        string description
    );
    event TokenRetired(
        address indexed account,
        uint256 tokenId,
        uint256 amount
    );
    event RegisteredConsumer(address indexed account);
    event UnregisteredConsumer(address indexed account);
    event RegisteredDealer(address indexed account);
    event UnregisteredDealer(address indexed account);
    event RegisteredIndustry(address indexed account);
    event UnregisteredIndustry(address indexed account);

    constructor(address _admin) ERC1155("") {
        // Allow dealers to register consumers
        _setRoleAdmin(REGISTERED_CONSUMER, REGISTERED_DEALER);

        // Set-up admin
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(REGISTERED_DEALER, _admin);
        _setupRole(REGISTERED_REC_DEALER, _admin);
        _setupRole(REGISTERED_OFFSET_DEALER, _admin);
        _setupRole(REGISTERED_EMISSIONS_AUDITOR, _admin);
        //_setupRole(REGISTERED_INDUSTRY, _admin);

        // initialize
        timelock = address(0);

        limitedMode = false;
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CLM8::onlyAdmin: msg.sender not the admin"
        );
        _;
    }

    modifier consumerOrDealer(address from, address to) {
        if (from != address(0)) {
            // if not minting require sender to be consumerOrDealer
            require(
                _consumerOrDealer(from),
                "CLM8::consumerOrDealer: sender not a consumer or a dealer"
            );
        }
        if (to != address(0)) {
            // if not burning require receiver is consumerOrDealer
            require(
                _consumerOrDealer(to),
                "CLM8::consumerOrDealer: recipient must be consumer, dealer or industry"
            );
        }
        _;
    }

    modifier onlyDealer() {
        _onlyDealer();
        _;
    }

    /**
     * @dev Returns `true` if hasRole of dealer
     */
    function _onlyDealer() internal view {
        /*
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, msg.sender);
        bool isCeoDealer = hasRole(REGISTERED_OFFSET_DEALER, msg.sender);
        bool isAeDealer = hasRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender);
        */
        require(
            //hasRole(REGISTERED_REC_DEALER, msg.sender) ||
            //hasRole(REGISTERED_OFFSET_DEALER, msg.sender) ||
            //hasRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender) ||
            // the below will achieve the same as the above
            hasRole(REGISTERED_DEALER, msg.sender),
            "CLM8::onlyDealer: msg.sender not a dealer"
        );
    }

    /**
     * @dev Returns `true` if hasRole of dealer, industry or consumer
     */
    function _consumerOrDealer(address entity) public view returns (bool) {
        // check for one role and return if true if true
        // before checking the next to minimize gas
        if (
            hasRole(REGISTERED_DEALER, entity) ||
            hasRole(REGISTERED_CONSUMER, entity) ||
            hasRole(REGISTERED_INDUSTRY, entity)
        ) return true;
        return false;
    }

    /**
     * @dev Returns `true` if transfer has been approved by to address
     * reconstruct transferHash and check that it matches the signature
     */
    function verifySignature(
        bytes32 msgHash,
        bytes memory signature,
        address signer
    ) public pure returns (bool) {
        bytes32 ethSignedMessageHash = msgHash.toEthSignedMessageHash();
        return ethSignedMessageHash.recover(signature) == signer;
    }

    /**
     * @dev Returns keccak256 hash of transaction request
     * including next available nonce for transfer from -> to addresses
     */
    function getTransferHash(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _from,
                    _to,
                    _ids,
                    _amounts,
                    carbonTransferNonce[_from][_to] + 1
                )
            );
    }

    /**
     * @dev returns true if the tokenId exists
     */
    function tokenExists(uint256 tokenId) private view returns (bool) {
        if (_numOfUniqueTokens.current() >= tokenId) return true;
        return false; // no matching tokenId
    }

    /**
     * @dev returns true if the tokenTypeId is valid
     */
    function tokenTypeIdIsValid(uint8 tokenTypeId) private pure returns (bool) {
        if ((tokenTypeId > 0) && (tokenTypeId <= 4)) {
            return true;
        }
        return false; // no matching tokenId
    }

    /**
     * @dev returns number of unique tokens
     */
    function getNumOfUniqueTokens() public view returns (uint256) {
        return _numOfUniqueTokens.current();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev hook to prevent transfers from non-admin account if limitedMode is on
     * @param data signature of getTransferHash() for transfer of carbon token type (id=4)
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override consumerOrDealer(from, to) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        // TO-DO this could be set as a modifier ...
        require(
            (from != to),
            "CLM8::_beforeTokenTransfer: sender and receiver cannot be the same"
        );
        bool approveCarbon; // bool if we need to approve the transfer of carbon tokens
        for (uint256 i = 0; i < ids.length; i++) {
            CarbonTokenDetails storage token = _tokenDetails[ids[i]];
            // disable most transfers if limitedMode is on
            if (limitedMode) {
                // allow retiring/burning one's tokens
                if (to == address(0)) {
                    continue;
                }

                // for tokenType 1 and 2, only the timelock and DAO can transfer/issue
                // for tokenType 3, only emissions auditors can transfer/issue
                // (and they are automatically retired right after)
                if (token.tokenTypeId == 1 || token.tokenTypeId == 2) {
                    require(
                        operator == timelock ||
                            hasRole(DEFAULT_ADMIN_ROLE, operator),
                        "CLM8::_beforeTokenTransfer(limited): only admin and DAO can transfer tokens"
                    );
                } else if (token.tokenTypeId == 3) {
                    require(
                        hasRole(REGISTERED_EMISSIONS_AUDITOR, operator),
                        "CLM8::_beforeTokenTransfer(limited): only emissions auditors can issue audited emissions"
                    );
                }
            }
            // for tokenType 4, any authorized operator can
            // issue (from == address(0)) or
            // burn/retire (to == address(0))
            // otherwise require receiver (to address) to have approved (signed) the transferHash
            /*if(token.tokenTypeId == 4 && to != address(0) && from != address(0)) {
                approveCarbon = false;//true;
                // TO-DO: drop internal approval of carbon transfers?
                // voluntary carbon tracker token can be sent to anyone to use in the C-NFT
                // they can be sent without approval inviting the receiver to track them to their NFT
            }*/
        }
        if (approveCarbon) {
            bytes32 messageHash = getTransferHash(from, to, ids, amounts);
            require(
                verifySignature(messageHash, data, to),
                "CLM8::_beforeTokenTransfer: receiver's approval signature is not valid"
            );
            //increment the nonce once transaction has been confirmed
            carbonTransferNonce[from][to]++;
        }
    }

    /**
     * @dev External function to mint an amount of a token
     * Only authorized dealer of associated token type can call this function
     * @param quantity of the token to mint For ex: if one needs 100 full tokens, the caller
     * should set the amount as (100 * 10^4) = 1,000,000 (assuming the token's decimals is set to 4)
     */
    function issue(
        uint160 issuedFrom,
        address issuedTo,
        uint8 tokenTypeId,
        uint256 quantity,
        uint256 fromDate,
        uint256 thruDate,
        string memory metadata,
        string memory manifest,
        string memory description
    ) public onlyDealer {
        return
            _issue(
                msg.sender, // issuedBy
                issuedFrom,
                issuedTo,
                tokenTypeId,
                quantity,
                fromDate,
                thruDate,
                metadata,
                manifest,
                description
            );
    }

    /**
     * @dev Issue function for DAO (on limited mode) or admin to manually pass issuer
     * Must be called from Timelock contract through a successful proposal
     * or by admin if limited mode is set to false
     */
    function issueOnBehalf(
        address issuedBy,
        uint160 issuedFrom,
        address issuedTo,
        uint8 tokenTypeId,
        uint256 quantity,
        uint256 fromDate,
        uint256 thruDate,
        string memory metadata,
        string memory manifest,
        string memory description
    ) public {
        require(
            (msg.sender == timelock) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CLM8::issueOnBehalf: call must come from DAO or admin"
        );

        return
            _issue(
                issuedBy,
                issuedFrom,
                issuedTo,
                tokenTypeId,
                quantity,
                fromDate,
                thruDate,
                metadata,
                manifest,
                description
            );
    }

    function issueAndTrack(
        uint160 issuedFrom,
        address issuedTo,
        address trackerAddress,
        uint256 trackerId,
        //string memory trackerDescription,
        uint8 tokenTypeId,
        uint256 quantity,
        uint256 fromDate,
        uint256 thruDate,
        string memory metadata,
        string memory manifest,
        string memory description
    ) public onlyDealer {
        CarbonTracker ct = CarbonTracker(trackerAddress);
        require(
            ct.netAddress() == address(this),
            "CLM8::issueAndTrack: trackerAddress does not belong to address(this)"
        );
        require(
            ct._numOfUniqueTrackers() >= trackerId,
            "CLM8::issueAndTrack: trackerId does not exist"
        );
        require(
            (
                (
                    hasRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender)
                    //&& isVerifierApproved[msg.sender][trackerData.trackee]
                )
            ),
            "CLM8::issueAndTrack: msg.sender is not an approved auditor"
        );
        uint256[] memory tokenIds = new uint256[](1);
        uint256[] memory tokenAmounts = new uint256[](1);

        _issue(
            msg.sender, // issuedBy
            issuedFrom,
            trackerAddress,
            tokenTypeId,
            quantity,
            fromDate,
            thruDate,
            metadata,
            manifest,
            description
        );
        string memory trackerDescription = "";
        tokenIds[0] = _numOfUniqueTokens.current();
        tokenAmounts[0] = quantity;
        if (trackerId == 0) {
            trackerId = ct.track(
                issuedTo,
                tokenIds,
                tokenAmounts,
                fromDate,
                thruDate,
                trackerDescription
            );
        } else {
            ct.trackUpdate(
                trackerId,
                tokenIds,
                tokenAmounts,
                fromDate,
                thruDate,
                trackerDescription
            );
        }
    }

    function _issue(
        address _issuedBy,
        uint160 _issuedFrom,
        address _issuedTo,
        uint8 _tokenTypeId,
        uint256 _quantity,
        uint256 _fromDate,
        uint256 _thruDate,
        string memory _metadata,
        string memory _manifest,
        string memory _description
    ) internal {
        require(
            tokenTypeIdIsValid(_tokenTypeId),
            "CLM8::_issue: tokenTypeId is invalid"
        );

        if (limitedMode) {
            if (_tokenTypeId == 1 || _tokenTypeId == 2) {
                require(
                    msg.sender == timelock,
                    "CLM8::_issue(limited): msg.sender not timelock"
                );
                require(
                    hasRole(DEFAULT_ADMIN_ROLE, _issuedTo),
                    "CLM8::_issue(limited): issuee not admin"
                );
                require(
                    hasRole(REGISTERED_REC_DEALER, _issuedBy) ||
                        hasRole(REGISTERED_OFFSET_DEALER, _issuedBy),
                    "CLM8::_issue(limited): proposer not a registered dealer"
                );
            } else if (_tokenTypeId == 3 || _tokenTypeId == 4) {
                require(
                    hasRole(REGISTERED_EMISSIONS_AUDITOR, _issuedBy),
                    "CLM8::_issue(limited): issuer not a registered emissions auditor"
                );
            }
        } else {
            if (_tokenTypeId == 1) {
                require(
                    hasRole(REGISTERED_REC_DEALER, _issuedBy),
                    "CLM8::_issue: issuer not a registered REC dealer"
                );
            } else if (_tokenTypeId == 2) {
                require(
                    hasRole(REGISTERED_OFFSET_DEALER, _issuedBy),
                    "CLM8::_issue: issuer not a registered offset dealer"
                );
            } else if (_tokenTypeId == 3 || _tokenTypeId == 4) {
                require(
                    hasRole(REGISTERED_EMISSIONS_AUDITOR, _issuedBy),
                    "CLM8::_issue: issuer not a registered emissions auditor"
                );
                // require(
                //     hasRole(REGISTERED_EMISSIONS_AUDITOR, _issuer),
                //     "CLM8::_issue: issuer not a registered emissions auditor"
                // );
            }
        }

        // increment token identifier
        _numOfUniqueTokens.increment();

        // create token details
        CarbonTokenDetails storage tokenInfo = _tokenDetails[
            _numOfUniqueTokens.current()
        ];

        tokenInfo.tokenId = _numOfUniqueTokens.current();
        tokenInfo.tokenTypeId = _tokenTypeId;
        tokenInfo.issuedBy = _issuedBy;
        tokenInfo.issuedFrom = _issuedFrom;
        tokenInfo.issuedTo = _issuedTo;
        tokenInfo.fromDate = _fromDate;
        tokenInfo.thruDate = _thruDate;
        tokenInfo.dateCreated = block.timestamp;
        tokenInfo.metadata = _metadata;
        tokenInfo.manifest = _manifest;
        tokenInfo.description = _description;
        tokenInfo.totalIssued = _quantity;
        tokenInfo.totalRetired = uint256(0);

        super._mint(_issuedTo, _numOfUniqueTokens.current(), _quantity, "");

        // retire audited emissions on mint
        if (_tokenTypeId == 3) {
            _retire(tokenInfo.issuedTo, tokenInfo.tokenId, _quantity);
        }

        // emit event with all token details and balances
        emit TokenCreated(
            _quantity,
            _retiredBalances[tokenInfo.tokenId][tokenInfo.issuedTo],
            tokenInfo.tokenId,
            tokenInfo.tokenTypeId,
            tokenInfo.issuedBy,
            tokenInfo.issuedFrom,
            tokenInfo.issuedTo,
            tokenInfo.fromDate,
            tokenInfo.thruDate,
            tokenInfo.dateCreated,
            tokenInfo.metadata,
            tokenInfo.manifest,
            tokenInfo.description
        );
    }

    /**
     * @dev mints more of an existing token
     * @param to reciepient of token
     * @param tokenId token to mint more of
     * @param quantity amount to mint
     */
    // To DO - this will increase _balances of to account
    // but will not update the totalIssued ?
    function mint(
        address to,
        uint256 tokenId,
        uint256 quantity
    ) external onlyAdmin {
        require(tokenExists(tokenId), "CLM8::mint: tokenId does not exist");
        require(
            !limitedMode,
            "CLM8::mint: cannot mint new tokens in limited mode"
        );
        super._mint(to, tokenId, quantity, "");
    }

    /**
     * @dev returns the token name for the given token as a string value
     * @param tokenId token to check
     */
    function getTokenType(uint256 tokenId)
        external
        view
        returns (string memory)
    {
        require(
            tokenExists(tokenId),
            "CLM8::getTokenType: tokenId does not exist"
        );
        CarbonTokenDetails storage token = _tokenDetails[tokenId];

        if (token.tokenTypeId == 1) {
            return "Renewable Energy Certificate";
        } else if (token.tokenTypeId == 2) {
            return "Carbon Emissions Offset";
        } else if (token.tokenTypeId == 3) {
            return "Audited Emissions";
        } else if (token.tokenTypeId == 4) {
            return "Carbon Tracker";
        } else {
            return "Token does not exist";
        }
    }

    function getTokenTypeId(uint256 tokenId) external view returns (uint8) {
        return _tokenDetails[tokenId].tokenTypeId;
    }

    function getRetiredBalances(uint256 tokenId, address account)
        external
        view
        returns (uint256)
    {
        return _retiredBalances[tokenId][account];
    }

    /**
     * @dev returns the retired amount on a token
     * @param tokenId token to check
     */
    function getTokenRetiredAmount(address account, uint256 tokenId)
        public
        view
        returns (uint256)
    {
        require(
            tokenExists(tokenId),
            "CLM8::getTokenRetiredAmount: tokenId does not exist"
        );
        uint256 amount = _retiredBalances[tokenId][account];
        return amount;
    }

    /**
     * @dev sets the token to the retire state to disable transfers, mints and burns
     * @param tokenId token to set in pause state
     *   Only contract owner can pause or resume tokens
     */
    function retire(uint256 tokenId, uint256 amount)
        external
        consumerOrDealer(msg.sender, address(0))
    {
        require(tokenExists(tokenId), "CLM8::retire: tokenId does not exist");
        // TO-DO do we need this require statement? super._burn sub() will require this ...
        require(
            (amount <= super.balanceOf(msg.sender, tokenId)),
            "CLM8::retire: not enough available balance to retire"
        );

        _retire(msg.sender, tokenId, amount);
        emit TokenRetired(msg.sender, tokenId, amount);
    }

    function _retire(
        address _address,
        uint256 tokenId,
        uint256 _quantity
    ) internal {
        super._burn(_address, tokenId, _quantity);
        _tokenDetails[tokenId].totalRetired = _tokenDetails[tokenId]
            .totalRetired
            .add(_quantity);
        _retiredBalances[tokenId][_address] = _retiredBalances[tokenId][
            _address
        ].add(_quantity);
    }

    /**
     * @dev returns true if Dealer's account is registered
     * @param account address of the dealer
     */
    function isDealerRegistered(address account) public view returns (bool) {
        if (
            hasRole(REGISTERED_REC_DEALER, account) ||
            hasRole(REGISTERED_OFFSET_DEALER, account) ||
            hasRole(REGISTERED_EMISSIONS_AUDITOR, account)
        ) return true;
        return false;
    }

    /**
     * @dev returns true if Consumers's account is registered
     * @param account address of the dealer
     */
    function isConsumerRegistered(address account) public view returns (bool) {
        return hasRole(REGISTERED_CONSUMER, account);
    }

    /**
     * @dev returns true if Consumers's or Dealer's account is registered
     * @param account address of the consumer/dealer
     */
    function isRegisteredDealerOrConsumer(address account)
        private
        view
        returns (bool)
    {
        return (isDealerRegistered(account) || isConsumerRegistered(account));
    }

    struct RolesInfo {
        bool isAdmin;
        bool isConsumer;
        bool isRecDealer;
        bool isCeoDealer;
        bool isAeDealer;
        bool isIndustry;
    }

    /**
     * @dev Helper function for returning tuple of bools of role membership
     * @param account address to check roles
     */
    function getRoles(address account)
        external
        view
        returns (RolesInfo memory)
    {
        RolesInfo memory roles;
        roles.isAdmin = hasRole(DEFAULT_ADMIN_ROLE, account);
        roles.isRecDealer = hasRole(REGISTERED_REC_DEALER, account);
        roles.isCeoDealer = hasRole(REGISTERED_OFFSET_DEALER, account);
        roles.isAeDealer = hasRole(REGISTERED_EMISSIONS_AUDITOR, account);
        roles.isIndustry = hasRole(REGISTERED_INDUSTRY, account);
        roles.isConsumer = hasRole(REGISTERED_CONSUMER, account);
        return roles;
    }

    /**
     * @dev Only contract owner can register Dealers
     * @param account address of the dealer to register
     */
    function registerDealer(address account, uint8 tokenTypeId)
        public
        onlyAdmin
    {
        require(
            tokenTypeIdIsValid(tokenTypeId),
            "CLM8::registerDealer: tokenTypeId does not exist"
        );
        if (tokenTypeId == 1) {
            grantRole(REGISTERED_REC_DEALER, account);
        } else if (tokenTypeId == 2) {
            grantRole(REGISTERED_OFFSET_DEALER, account);
        } else if (tokenTypeId == 3) {
            grantRole(REGISTERED_EMISSIONS_AUDITOR, account);
        }
        // Also grant generic dealer role for registering/unregistering dealer
        grantRole(REGISTERED_DEALER, account);
        emit RegisteredDealer(account);
    }

    /**
     * @dev msg.sender can volunteer themselves as registered industry
     * or other registered dealer can register Industry
     */
    function registerIndustry(address account) external {
        if (limitedMode) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "CLM8::registerIndustry(limited): only admin can register industries"
            );
        } else {
            _onlyDealer();
        }
        _setupRole(REGISTERED_INDUSTRY, account);
        emit RegisteredIndustry(account);
    }

    /**
     * @dev msg.sender can unvolunteer themselves as registered industry
     * or other registered dealer can unregister Industry
     */
    function unregisterIndustry(address account) external {
        if (msg.sender != account) {
            // only dealer can register industry
            _onlyDealer();
        }
        if (limitedMode) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "CLM8::unregisterIndustry(limited): only admin can unregister industries"
            );
        }
        revokeRole(REGISTERED_INDUSTRY, account);
        emit UnregisteredIndustry(account);
    }

    /**
     * @dev returns true if Consumer's account is registered for the given token
     * @param account address of the consumer
     */
    function registerConsumer(address account) external onlyDealer {
        if (limitedMode) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "CLM8::registerConsumer(limited): only admin can register consumers"
            );
        }
        grantRole(REGISTERED_CONSUMER, account);
        emit RegisteredConsumer(account);
    }

    /**
     * @dev Only contract owner can unregister Dealers
     * @param account address to be unregistered
     */
    function unregisterDealer(address account, uint8 tokenTypeId)
        external
        onlyAdmin
    {
        require(
            tokenTypeIdIsValid(tokenTypeId),
            "CLM8::unregisterDealer: tokenTypeId does not exist"
        );
        if (tokenTypeId == 1) {
            super.revokeRole(REGISTERED_REC_DEALER, account);
        } else if (tokenTypeId == 2) {
            super.revokeRole(REGISTERED_OFFSET_DEALER, account);
        } else if (tokenTypeId == 3) {
            super.revokeRole(REGISTERED_EMISSIONS_AUDITOR, account);
        }
        // If no longer a dealer of any token type, remove generic dealer role
        if (!isDealerRegistered(account)) {
            revokeRole(REGISTERED_DEALER, account);
        }

        emit UnregisteredDealer(account);
    }

    /**
     * @dev Only contract owner can unregister Consumers
     * TO-DO clarify the above - function allows any Dealer to unregister consumers.
     * Why would we need to unregister consumers?
     * @param account address to be unregistered
     */
    function unregisterConsumer(address account) external onlyDealer {
        if (limitedMode) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "CLM8::unregisterConsumer(limited): only admin can unregister consumers"
            );
        }
        super.revokeRole(REGISTERED_CONSUMER, account);
        emit UnregisteredConsumer(account);
    }

    /**
     * @dev transfers the value to the 'to' account for tokenId
     * @param to recipient address
     * @param tokenId tokenId for the transfer
     * @param value amount of transfer
     * Transfer can start only when both parties are registered and the token is not paused
     * Note: Token holders can arbitrarily call safeTransferFrom() without these checks
     * The requires commented out below have been moved to _beforeTokenTransfer hook
     * so that they are always applied to safeTransferFrom (or safeBatch...)
     */
    function transfer(
        address to,
        uint256 tokenId,
        uint256 value
    ) external {
        require(tokenExists(tokenId), "CLM8::transfer: tokenId does not exist");

        /*
        require((msg.sender != to), "CLM8::transfer: sender and receiver cannot be the same");
        receiver must be Consumer or Dealer or Industry
        require(
            hasRole(REGISTERED_CONSUMER, to) || 
            hasRole(REGISTERED_DEALER, to) || 
            hasRole(REGISTERED_INDUSTRY, to),
            "CLM8::transfer: Recipient must be consumer, industry, or dealer"
        ); */
        super.safeTransferFrom(msg.sender, to, tokenId, value, "0x00");
    }

    function setTimelock(address _timelock) external onlyAdmin {
        timelock = _timelock;
    }

    function getAvailableAndRetired(address account, uint256 tokenId)
        external
        view
        returns (uint256, uint256)
    {
        uint256 available = super.balanceOf(account, tokenId);
        uint256 retired = this.getTokenRetiredAmount(account, tokenId);
        return (available, retired);
    }

    /**
     * @dev returns issuer of a given tokenId
     */
    function getIssuedBy(uint256 tokenId) external view returns (address) {
        return _tokenDetails[tokenId].issuedBy;
    }

    /**
     * @dev returns issuer of a given tokenId
     */
    function getIssuedFrom(uint256 tokenId) external view returns (uint160) {
        return _tokenDetails[tokenId].issuedFrom;
    }

    /**
     * @dev returns the details of a given tokenId, omitting holders
     * @param tokenId token to check
     */
    function getTokenDetails(uint256 tokenId)
        external
        view
        returns (CarbonTokenDetails memory)
    {
        return _tokenDetails[tokenId];
    }

    /**
     * @dev turns off or on limited mode
     * @param _limitedMode boolean value
     */
    function setLimitedMode(bool _limitedMode) external onlyAdmin {
        limitedMode = _limitedMode;
    }

    function isAuditor(address auditor) external view returns (bool) {
        return hasRole(REGISTERED_EMISSIONS_AUDITOR, auditor);
    }

    function isIndustry(address industry) external view returns (bool) {
        return hasRole(REGISTERED_INDUSTRY, industry);
    }
}
