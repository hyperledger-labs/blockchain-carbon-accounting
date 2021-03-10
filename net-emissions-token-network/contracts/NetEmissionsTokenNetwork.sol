pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

contract NetEmissionsTokenNetwork is Initializable, ERC1155Upgradeable, AccessControlUpgradeable {

    using SafeMathUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

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

    /**
     * @dev Structure of all tokens issued in this contract
     * tokenId - Auto-increments whenever new tokens are issued
     * tokenTypeId - Corresponds to the three token types:
     *   1 => Renewable Energy Certificate
     *   2 => Carbon Emissions Offset
     *   3 => Audited Emissions
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
    }

    mapping(uint256 => CarbonTokenDetails) private _tokenDetails;
    mapping(uint256 => mapping(address => uint256)) private _retiredBalances;

    // Counts number of unique token IDs (auto-incrementing)
    CountersUpgradeable.Counter private _numOfUniqueTokens;

    string[] private _TOKEN_TYPES;

    // events
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

    // Replaces constructor in OpenZeppelin Upgrades
    function initialize(address admin) public initializer {

        __ERC1155_init("");

        _TOKEN_TYPES = [
            "Renewable Energy Certificate",
            "Carbon Emissions Offset",
            "Audited Emissions"
        ];

        // Allow dealers to register consumers
        _setRoleAdmin(REGISTERED_CONSUMER, REGISTERED_DEALER);

        // Set-up admin
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(REGISTERED_DEALER, admin);
        _setupRole(REGISTERED_REC_DEALER, admin);
        _setupRole(REGISTERED_OFFSET_DEALER, admin);
        _setupRole(REGISTERED_EMISSIONS_AUDITOR, admin);
    }

    modifier consumerOrDealer() {
        bool isConsumer = hasRole(REGISTERED_CONSUMER, msg.sender);
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, msg.sender);
        bool isCeoDealer = hasRole(REGISTERED_OFFSET_DEALER, msg.sender);
        bool isAeDealer = hasRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender);

        require(
            isConsumer || isRecDealer || isCeoDealer || isAeDealer,
            "You must be either a consumer or a dealer"
        );

        _;
    }

    modifier onlyDealer() {
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, msg.sender);
        bool isCeoDealer = hasRole(REGISTERED_OFFSET_DEALER, msg.sender);
        bool isAeDealer = hasRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender);

        require(
            isRecDealer || isCeoDealer || isAeDealer,
            "You are not a dealer"
        );
        _;
    }

    modifier onlyOwner() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "You are not the owner"
        );
        _;
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
    function tokenTypeIdIsValid(uint8 tokenTypeId) private view returns (bool) {
        if ((tokenTypeId > 0) && (tokenTypeId <= _TOKEN_TYPES.length)) {
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

    /**
     * @dev External function to mint an amount of a token
     * Only authorized dealer of associated token type can call this function
     * @param quantity of the token to mint For ex: if one needs 100 full tokens, the caller
     * should set the amount as (100 * 10^4) = 1,000,000 (assuming the token's decimals is set to 4)
     */

    function issue(
        address account,
        uint8 tokenTypeId,
        uint256 quantity,
        uint256 fromDate,
        uint256 thruDate,
        uint256 automaticRetireDate,
        string memory metadata,
        string memory manifest,
        string memory description
    ) public onlyDealer {
        _numOfUniqueTokens.increment();
        CarbonTokenDetails storage tokenInfo = _tokenDetails[_numOfUniqueTokens.current()];
        require(
            tokenTypeIdIsValid(tokenTypeId),
            "Failed to issue: tokenTypeId is invalid"
        );

        if (tokenTypeId == 1) {
            require(
                hasRole(REGISTERED_REC_DEALER, msg.sender),
                "You are not a Renewable Energy Certificate dealer"
            );
        } else if (tokenTypeId == 2) {
            require(
                hasRole(REGISTERED_OFFSET_DEALER, msg.sender),
                "You are not a Carbon Emissions Offset dealer"
            );
        } else {
            require(
                hasRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender),
                "You are not an Audited Emissions dealer"
            );
        }

        bytes memory callData;

        tokenInfo.tokenId = _numOfUniqueTokens.current();
        tokenInfo.tokenTypeId = tokenTypeId;
        tokenInfo.issuer = msg.sender;
        tokenInfo.issuee = account;
        tokenInfo.fromDate = fromDate;
        tokenInfo.thruDate = thruDate;
        tokenInfo.automaticRetireDate = automaticRetireDate;
        tokenInfo.dateCreated = block.timestamp;
        tokenInfo.metadata = metadata;
        tokenInfo.manifest = manifest;
        tokenInfo.description = description;

        super._mint(account, _numOfUniqueTokens.current(), quantity, callData);

        // retire audited emissions on mint
        if (tokenTypeId == 3) {
            super._burn(tokenInfo.issuee, tokenInfo.tokenId, quantity);
            _retiredBalances[tokenInfo.tokenId][tokenInfo.issuee] = _retiredBalances[tokenInfo.tokenId][tokenInfo.issuee].add(quantity);
        }

        // emit event with all token details and balances
        emit TokenCreated(
            quantity,
            _retiredBalances[tokenInfo.tokenId][tokenInfo.issuee],
            tokenInfo.tokenId,
            tokenInfo.tokenTypeId,
            tokenInfo.issuer,
            tokenInfo.issuee,
            tokenInfo.fromDate,
            tokenInfo.thruDate,
            tokenInfo.automaticRetireDate,
            tokenInfo.dateCreated,
            tokenInfo.metadata,
            tokenInfo.manifest,
            tokenInfo.description
        );
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
        require(tokenExists(tokenId), "tokenId does not exist");
        string memory tokenType =
            _TOKEN_TYPES[(_tokenDetails[tokenId].tokenTypeId - 1)];
        return tokenType;
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
        require(tokenExists(tokenId), "tokenId does not exist");
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
    ) external consumerOrDealer {
        require(tokenExists(tokenId), "tokenId does not exist");
        require( (amount <= super.balanceOf(msg.sender, tokenId)), "Not enough available balance to retire" );

        super._burn(msg.sender, tokenId, amount);
        _retiredBalances[tokenId][msg.sender] = _retiredBalances[tokenId][msg.sender].add(amount);
        emit TokenRetired(
            msg.sender,
            tokenId,
            amount
        );
    }

    /**
     * @dev returns true if Dealer's account is registered
     * @param account address of the dealer
     */
    function isDealerRegistered(address account) public view returns (bool) {
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, account);
        bool isCeoDealer = hasRole(REGISTERED_OFFSET_DEALER, account);
        bool isAeDealer = hasRole(REGISTERED_EMISSIONS_AUDITOR, account);
        if (isRecDealer || isCeoDealer || isAeDealer) return true;
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
    function isDealerOrConsumer(address account) private view returns (bool) {
        return (isDealerRegistered(account) || isConsumerRegistered(account));
    }

    /**
     * @dev Helper function for returning tuple of bools of role membership
     * @param account address to check roles
     */
    function getRoles(address account) external view returns (bool, bool, bool, bool, bool) {
        bool isOwner = hasRole(DEFAULT_ADMIN_ROLE, account);
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, account);
        bool isCeoDealer = hasRole(REGISTERED_OFFSET_DEALER, account);
        bool isAeDealer = hasRole(REGISTERED_EMISSIONS_AUDITOR, account);
        bool isConsumer = hasRole(REGISTERED_CONSUMER, account);
        return (isOwner, isRecDealer, isCeoDealer, isAeDealer, isConsumer);
    }

    /**
     * @dev Only contract owner can register Dealers
     * @param account address of the dealer to register
     * Only registered Dealers can transfer tokens
     */
    function registerDealer(address account, uint8 tokenTypeId)
        external
        onlyOwner
    {
        require(tokenTypeIdIsValid(tokenTypeId), "Token type does not exist");
        if (tokenTypeId == 1) {
            grantRole(REGISTERED_REC_DEALER, account);
        } else if (tokenTypeId == 2) {
            grantRole(REGISTERED_OFFSET_DEALER, account);
        } else {
            grantRole(REGISTERED_EMISSIONS_AUDITOR, account);
        }
        // Also grant generic dealer role for registering/unregistering consumers
        grantRole(REGISTERED_DEALER, account);
        emit RegisteredDealer(account);
    }

    /**
     * @dev returns true if Consumer's account is registered for the given token
     * @param account address of the consumer
     */
    function registerConsumer(address account) external onlyDealer {
        grantRole(REGISTERED_CONSUMER, account);
        emit RegisteredConsumer(account);
    }

    /**
     * @dev Only contract owner can unregister Dealers
     * @param account address to be unregistered
     */
    function unregisterDealer(address account, uint8 tokenTypeId)
        external
        onlyOwner
    {
        require(tokenTypeIdIsValid(tokenTypeId), "Token type does not exist");
        if (tokenTypeId == 1) {
            super.revokeRole(REGISTERED_REC_DEALER, account);
        } else if (tokenTypeId == 2) {
            super.revokeRole(REGISTERED_OFFSET_DEALER, account);
        } else {
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
     * @param account address to be unregistered
     */
    function unregisterConsumer(address account) external onlyDealer {
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
     */
    function transfer(
        address to,
        uint256 tokenId,
        uint256 value
    ) external consumerOrDealer {
        require(tokenExists(tokenId), "tokenId does not exist");
        require(
            isDealerOrConsumer(to),
            "Recipient must be consumer or dealer"
        );
        require((msg.sender != to), "Sender and receiver cannot be the same");
        super.safeTransferFrom(msg.sender, to, tokenId, value, "0x00");
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
     * @param tokenId token to check
     */
    function getIssuer(uint256 tokenId)
        external
        view
        returns (address)
    {
        require(tokenExists(tokenId), "tokenId does not exist");
        return _tokenDetails[tokenId].issuer;
    }

    /**
     * @dev returns the entire details of a given tokenId
     * @param tokenId token to check
     */
    function getTokenDetails(uint256 tokenId)
        external
        view
        returns (CarbonTokenDetails memory)
    {
        require(tokenExists(tokenId), "tokenId does not exist");
        return _tokenDetails[tokenId];
    }
}
