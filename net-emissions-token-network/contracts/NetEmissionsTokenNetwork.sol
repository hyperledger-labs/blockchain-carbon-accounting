// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
contract NetEmissionsTokenNetwork is Initializable, ERC1155Upgradeable, AccessControlUpgradeable {

    using SafeMathUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using ECDSAUpgradeable for bytes32;
    using ECDSAUpgradeable for address;

    bool public limitedMode;  // disables some features like arbitrary token transfers and issuing without proposals
    address public admin;     // address that has permission to register dealers, transfer in limitedMode, etc.
    address private timelock; // DAO contract that executes proposals to issue tokens after a successful vote

    // Generic dealer role for registering/unregistering consumers
    bytes32 public constant REGISTERED_DEALER =
        keccak256("REGISTERED_DEALER");
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
    // Industry role (voluntary/nominate)
    bytes32 public constant REGISTERED_INDUSTRY =
        keccak256("REGISTERED_INDUSTRY");
    // Registered Industry Dealer (admin assignment)
    bytes32 public constant REGISTERED_INDUSTRY_DEALER =
        keccak256("REGISTERED_INDUSTRY_DEALER");

    /**
     * @dev Structure of all tokens issued in this contract
     * tokenId - Auto-increments whenever new tokens are issued
     * tokenTypeId - Corresponds to the three token types:
     *   1 => Renewable Energy Certificate
     *   2 => Carbon Emissions Offset
     *   3 => Audited Emissions
     *   4 => Carbon Tracker tokens (traded, burnt or stored fuel/feed stock)
     *   TO-DO define carbon tracker storage transactions (i.e. captured CO2 management) 
     * issuer - Address of dealer issuing this token
     * issuee - Address of original issued recipient this token
     * fromDate - Unix timestamp
     * thruDate - Unix timestamp
     * dateCreated - Unix timestamp
     * automaticRetireDate - Unix timestamp
     */
    struct CarbonTokenDetails {
        uint256 tokenId;
        uint8 tokenTypeId;
        address issuer;
        address issuee;
        uint256 fromDate;
        uint256 thruDate;
        uint256 dateCreated;
        uint256 automaticRetireDate;
        string metadata;
        string manifest;
        string description;
        uint256 totalIssued;
        uint256 totalRetired;
    }


    // Counts number of unique token IDs (auto-incrementing)
    CountersUpgradeable.Counter private _numOfUniqueTokens;

    // Token metadata and retired balances
    mapping(uint256 => CarbonTokenDetails) private _tokenDetails;
    mapping(uint256 => mapping(address => uint256)) private _retiredBalances;
    mapping(uint256 => mapping(address => uint256)) private _transferredBalances;

    // Nonce for tokeTypeId 4 transfer from => to account
    mapping(address => mapping(address => uint32)) private carbonTransferNonce;

    // Events
    event TokenCreated(
        uint256 availableBalance,
        uint256 retiredBalance,
        uint256 tokenId,
        uint8 tokenTypeId,
        address indexed issuer,
        address indexed issuee,
        uint256 fromDate,
        uint256 thruDate,
        uint256 dateCreated,
        uint256 automaticRetireDate,
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

    // Replaces constructor in OpenZeppelin Upgrades
    function initialize(address _admin) public initializer {

        __ERC1155_init("");

        // Allow dealers to register consumers
        _setRoleAdmin(REGISTERED_CONSUMER, REGISTERED_DEALER);

        // Set-up admin
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(REGISTERED_DEALER, _admin);
        _setupRole(REGISTERED_REC_DEALER, _admin);
        _setupRole(REGISTERED_OFFSET_DEALER, _admin);
        _setupRole(REGISTERED_EMISSIONS_AUDITOR, _admin);
        _setupRole(REGISTERED_INDUSTRY_DEALER, _admin);
        _setupRole(REGISTERED_INDUSTRY, _admin);
        admin = _admin;

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

    modifier consumerOrDealer(address from,address to) {
        if(from!=address(0)){
            // if not minting require sender to be consumerOrDealer 
            require(_consumerOrDealer(from),
                "CLM8::consumerOrDealer: sender not a consumer or a dealer");
        }
        if(to!=address(0)){
            // if not burning require receiver is consumerOrDealer 
            require(_consumerOrDealer(to),
                "CLM8::consumerOrDealer: recipient must be consumer, dealer or industry"); 
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
        bool isInDealer = hasRole(REGISTERED_INDUSTRY_DEALER, msg.sender);
        */
        require(
            //hasRole(REGISTERED_REC_DEALER, msg.sender) ||
            //hasRole(REGISTERED_OFFSET_DEALER, msg.sender) ||
            //hasRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender) ||
            //hasRole(REGISTERED_INDUSTRY_DEALER, msg.sender) ||
            // the below will achieve the same as the above
            hasRole(REGISTERED_DEALER,msg.sender) || 
            // REGISTERED_INDSUTRY are considered dealers of carbon tokens
            // but have not be assigned REGISTERED_DEALER role by admin
            hasRole(REGISTERED_INDUSTRY,msg.sender),
            "CLM8::onlyDealer: msg.sender not a dealer"
        );
    }

    /**
     * @dev Returns `true` if hasRole of dealer, industry or consumer
     */
    function _consumerOrDealer(address entity) public view returns (bool) {
        // check for one role and return if true if true
        // before checking the next to minimize gas
        if(hasRole(REGISTERED_DEALER, entity) ||
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
    ) public pure returns (bool){   
        bytes32 ethSignedMessageHash = msgHash.toEthSignedMessageHash();
        return ethSignedMessageHash.recover(signature)==signer;
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
        return keccak256(abi.encodePacked(_from, _to, _ids, _amounts, carbonTransferNonce[_from][_to]+1));
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
    function tokenTypeIdIsValid(uint8 tokenTypeId) pure private returns (bool) {
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

    function supportsInterface(bytes4 interfaceId) public view virtual 
        override(ERC1155Upgradeable,AccessControlUpgradeable) returns (bool) {
        return interfaceId == type(IAccessControlUpgradeable).interfaceId || super.supportsInterface(interfaceId);
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
    )
        internal
        virtual
        override
        consumerOrDealer(from,to)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        // TO-DO this could be set as a modifier ...
        require((from != to), "CLM8::_beforeTokenTransfer: sender and receiver cannot be the same");
        bool approveCarbon; // bool if we need to approve the transfer of carbon tokens
        for (uint i = 0; i < ids.length; i++) {

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
                if (token.tokenTypeId == 1 || token.tokenTypeId == 2 ) {
                    require(
                        operator == timelock || hasRole(DEFAULT_ADMIN_ROLE, operator),
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
            if(token.tokenTypeId == 4 && to != address(0) && from != address(0)) {
                approveCarbon = false;//true;
                // TO-DO: drop internal approval of carbon transfers?
                // voluntary carbon tracker token can be sent to anyone to use in the C-NFT
                // they can be sent without approval inviting the receiver to track them to their NFT
                // accumulate total transferred balances (not minted or burnt)
                _transferredBalances[token.tokenId][from] =
                    _transferredBalances[token.tokenId][from].add(amounts[i]);
            }

        }
        if(approveCarbon){
            bytes32 messageHash = getTransferHash(from,to,ids,amounts);
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
        address issuee,
        uint8 tokenTypeId,
        uint256 quantity,
        uint256 fromDate,
        uint256 thruDate,
        uint256 automaticRetireDate,
        string memory metadata,
        string memory manifest,
        string memory description
    ) public onlyDealer {
        return _issue(
            issuee,
            msg.sender,
            tokenTypeId,
            quantity,
            fromDate,
            thruDate,
            automaticRetireDate,
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
        address issuee,
        address issuer,
        uint8 tokenTypeId,
        uint256 quantity,
        uint256 fromDate,
        uint256 thruDate,
        uint256 automaticRetireDate,
        string memory metadata,
        string memory manifest,
        string memory description
    ) public {

        require(
            (msg.sender == timelock) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CLM8::issueOnBehalf: call must come from DAO or admin"
        );

        return _issue(
            issuee,
            issuer,
            tokenTypeId,
            quantity,
            fromDate,
            thruDate,
            automaticRetireDate,
            metadata,
            manifest,
            description
        );
    }

    function _issue(
        address _issuee,
        address _issuer,
        uint8 _tokenTypeId,
        uint256 _quantity,
        uint256 _fromDate,
        uint256 _thruDate,
        uint256 _automaticRetireDate,
        string memory _metadata,
        string memory _manifest,
        string memory _description
    ) internal {

        require(
            tokenTypeIdIsValid(_tokenTypeId),
            "CLM8::_issue: tokenTypeId is invalid"
        );

        if (limitedMode) {
            if (_tokenTypeId == 1 || _tokenTypeId == 2 ) {
                require(
                    msg.sender == timelock,
                    "CLM8::_issue(limited): msg.sender not timelock"
                );
                require(
                    hasRole(DEFAULT_ADMIN_ROLE, _issuee),
                    "CLM8::_issue(limited): issuee not admin"
                );
                require(
                    hasRole(REGISTERED_REC_DEALER, _issuer) || hasRole(REGISTERED_OFFSET_DEALER, _issuer),
                    "CLM8::_issue(limited): proposer not a registered dealer"
                );
            } else if (_tokenTypeId == 3) {
                require(
                    hasRole(REGISTERED_EMISSIONS_AUDITOR, _issuer),
                    "CLM8::_issue(limited): issuer not a registered emissions auditor"
                );
            }
        } else {
            if (_tokenTypeId == 1) {
                require(
                    hasRole(REGISTERED_REC_DEALER, _issuer),
                    "CLM8::_issue: issuer not a registered REC dealer"
                );
            } else if (_tokenTypeId == 2) {
                require(
                    hasRole(REGISTERED_OFFSET_DEALER, _issuer),
                    "CLM8::_issue: issuer not a registered offset dealer"
                );
            } else if (_tokenTypeId == 3) {
                require(
                    hasRole(REGISTERED_EMISSIONS_AUDITOR, _issuer),
                    "CLM8::_issue: issuer not a registered emissions auditor"
                );
            }
        }
        // TO-DO: Define limited mode for tokenTypeId 4?
        if (_tokenTypeId == 4) {
            require(
                hasRole(REGISTERED_INDUSTRY, _issuer),
                "CLM8::_issue: issuer not a registered industry"
            );
            require(
                msg.sender == _issuee,
                "CLM8::_issue: registered industry can only issue carbon to itself"
            );
        } 

        // increment token identifier
        _numOfUniqueTokens.increment();

        // create token details
        CarbonTokenDetails storage tokenInfo = _tokenDetails[_numOfUniqueTokens.current()];

        tokenInfo.tokenId = _numOfUniqueTokens.current();
        tokenInfo.tokenTypeId = _tokenTypeId;
        tokenInfo.issuee = _issuee;
        tokenInfo.issuer = _issuer;
        tokenInfo.fromDate = _fromDate;
        tokenInfo.thruDate = _thruDate;
        tokenInfo.automaticRetireDate = _automaticRetireDate;
        tokenInfo.dateCreated = block.timestamp;
        tokenInfo.metadata = _metadata;
        tokenInfo.manifest = _manifest;
        tokenInfo.description = _description;
        tokenInfo.totalIssued = _quantity;
        tokenInfo.totalRetired = uint256(0);

        super._mint(_issuee, _numOfUniqueTokens.current(), _quantity, "");

        // retire audited emissions on mint
        if (_tokenTypeId == 3) {
            _retire(tokenInfo.issuee, tokenInfo.tokenId, _quantity);
        }

        // emit event with all token details and balances
        emit TokenCreated(
            _quantity,
            _retiredBalances[tokenInfo.tokenId][tokenInfo.issuee],
            tokenInfo.tokenId,
            tokenInfo.tokenTypeId,
            tokenInfo.issuer,
            tokenInfo.issuee,
            tokenInfo.fromDate,
            tokenInfo.thruDate,
            tokenInfo.dateCreated,
            tokenInfo.automaticRetireDate,
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
    function mint(address to, uint256 tokenId, uint256 quantity)
        external
        onlyAdmin
    {
        require(tokenExists(tokenId), "CLM8::mint: tokenId does not exist");
        require(!limitedMode, "CLM8::mint: cannot mint new tokens in limited mode");
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
        require(tokenExists(tokenId), "CLM8::getTokenType: tokenId does not exist");
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
    function getTokenTypeId(uint tokenId) external view returns(uint8){
        return _tokenDetails[tokenId].tokenTypeId;
    }
    function getRetiredBalances(uint tokenId, address account) 
        external view returns(uint){
        return _retiredBalances[tokenId][account];
    }
    function getTransferredBalances(uint tokenId, address account) 
        external view returns(uint){
        return _transferredBalances[tokenId][account];
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
        require(tokenExists(tokenId), "CLM8::getTokenRetiredAmount: tokenId does not exist");
        uint256 amount = _retiredBalances[tokenId][account];
        return amount;
    }

    /**
     * @dev sets the token to the retire state to disable transfers, mints and burns
     * @param tokenId token to set in pause state
     *   Only contract owner can pause or resume tokens
     */
    function retire(
        uint256 tokenId,
        uint256 amount
    ) external consumerOrDealer(msg.sender,address(0)) {
        require(tokenExists(tokenId), "CLM8::retire: tokenId does not exist");
        // TO-DO do we need this require statement? super._burn sub() will require this ...
        require( (amount <= super.balanceOf(msg.sender, tokenId)), "CLM8::retire: not enough available balance to retire" );

        _retire(msg.sender, tokenId, amount);
        emit TokenRetired(
            msg.sender,
            tokenId,
            amount
        );
    }

    function _retire(
        address _address,
        uint256 tokenId,
        uint256 _quantity
    ) internal {
        super._burn(_address, tokenId, _quantity);
        _tokenDetails[tokenId].totalRetired = _tokenDetails[tokenId].totalRetired.add(_quantity);
        _retiredBalances[tokenId][_address] = _retiredBalances[tokenId][_address].add(_quantity);
    }


    /**
     * @dev returns true if Dealer's account is registered
     * @param account address of the dealer
     */
    function isDealerRegistered(address account) public view returns (bool) {
        if (hasRole(REGISTERED_REC_DEALER, account) ||
            hasRole(REGISTERED_OFFSET_DEALER, account) ||
            hasRole(REGISTERED_EMISSIONS_AUDITOR, account) ||
            hasRole(REGISTERED_INDUSTRY_DEALER, account) 
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
    function isRegisteredDealerOrConsumer(address account) private view returns (bool) {
        return (isDealerRegistered(account) || isConsumerRegistered(account));
    }

    /**
     * @dev Helper function for returning tuple of bools of role membership
     * @param account address to check roles
     */
    function getRoles(address account) external view returns (bool, bool, bool, bool, bool, bool) {
        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, account);
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, account);
        bool isCeoDealer = hasRole(REGISTERED_OFFSET_DEALER, account);
        bool isAeDealer = hasRole(REGISTERED_EMISSIONS_AUDITOR, account);
        bool isIndustry = hasRole(REGISTERED_INDUSTRY, account);
        bool isConsumer = hasRole(REGISTERED_CONSUMER, account);
        return (isAdmin, isRecDealer, isCeoDealer, isAeDealer, isIndustry, isConsumer);
    }

    /**
     * @dev Only contract owner can register Dealers
     * @param account address of the dealer to register
     */
    function registerDealer(address account, uint8 tokenTypeId)
        public
        onlyAdmin
    {
        require(tokenTypeIdIsValid(tokenTypeId), "CLM8::registerDealer: tokenTypeId does not exist");
        if (tokenTypeId == 1) {
            grantRole(REGISTERED_REC_DEALER, account);
        } else if (tokenTypeId == 2) {
            grantRole(REGISTERED_OFFSET_DEALER, account);
        } else if (tokenTypeId == 3){
            grantRole(REGISTERED_EMISSIONS_AUDITOR, account);
        } else if (tokenTypeId == 4) {
            grantRole(REGISTERED_INDUSTRY, account);
            grantRole(REGISTERED_INDUSTRY_DEALER, account);
        }
        // Also grant generic dealer role for registering/unregistering dealer
        grantRole(REGISTERED_DEALER, account);
        emit RegisteredDealer(account);
    }

    /**
     * @dev msg.sender can volunteer themselves as registered industry
     * or other registered dealer can register Industry
     */
    function registerIndustry(address account) external
    {
        if(msg.sender != account){
            // only dealer can register industry
            _onlyDealer();
        }
        if (limitedMode) {
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "CLM8::registerIndustry(limited): only admin can register industries");
        }
        _setupRole(REGISTERED_INDUSTRY, account);
        emit RegisteredIndustry(account);
    }

    /**
     * @dev returns true if Consumer's account is registered for the given token
     * @param account address of the consumer
     */
    function registerConsumer(address account) external onlyDealer {
        if (limitedMode) {
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "CLM8::registerConsumer(limited): only admin can register consumers");
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
        require(tokenTypeIdIsValid(tokenTypeId), "CLM8::unregisterDealer: tokenTypeId does not exist");
        if (tokenTypeId == 1) {
            super.revokeRole(REGISTERED_REC_DEALER, account);
        } else if (tokenTypeId == 2) {
            super.revokeRole(REGISTERED_OFFSET_DEALER, account);
        } else if (tokenTypeId == 3) {
            super.revokeRole(REGISTERED_EMISSIONS_AUDITOR, account);
        } else if (tokenTypeId == 4) {
            super.revokeRole(REGISTERED_INDUSTRY_DEALER, account);
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
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "CLM8::unregisterConsumer(limited): only admin can unregister consumers");
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
        super.safeTransferFrom(msg.sender, to, tokenId, value, '0x00');
    }

    function setTimelock(
        address _timelock
    ) external onlyAdmin {
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
    function getAvailableRetiredAndTransferred(address account, uint256 tokenId)
        external
        view
        returns (uint256, uint256, uint256)
    {
        uint256 available;
        uint256 retired;
        (available,retired) = this.getAvailableAndRetired(account, tokenId);
        uint256 transferred = _transferredBalances[tokenId][account];
        return (available, retired, transferred);
    }

    /**
     * @dev returns issuer of a given tokenId
     */
    function getIssuer(uint256 tokenId)
        external
        view
        returns (address)
    {
        return _tokenDetails[tokenId].issuer;
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
    function setLimitedMode(bool _limitedMode)
        external
        onlyAdmin
    {
        limitedMode = _limitedMode;
    }

    function isAuditor(address auditor) view external returns (bool) {
        return hasRole(REGISTERED_EMISSIONS_AUDITOR, auditor);
    }

}
