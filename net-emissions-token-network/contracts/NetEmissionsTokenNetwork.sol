pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2; // causes high gas usage, so only use for view functions

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract NetEmissionsTokenNetwork is ERC1155, AccessControl {
    
    using SafeMath for uint256;

    bytes32 public constant REGISTERED_REC_DEALER =
        keccak256("REGISTERED_REC_DEALER");
    bytes32 public constant REGISTERED_OFFSET_DEALER =
        keccak256("REGISTERED_OFFSET_DEALER");
    bytes32 public constant REGISTERED_EMISSIONS_AUDITOR =
        keccak256("REGISTERED_EMISSIONS_AUDITOR");
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
     * uom - Unit of measurement
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
        string uom;
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

    uint256 private _numOfUniqueTokens = 0; // Counts number of unique token IDs (auto-incrementing)
    string[] private _TOKEN_TYPES = [
        "Renewable Energy Certificate",
        "Carbon Emissions Offset",
        "Audited Emissions"
    ];

    event TokenCreated(uint256);
    event RegisteredDealer(address indexed account);
    event UnregisteredDealer(address indexed account);

    constructor() ERC1155("localhost") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(REGISTERED_REC_DEALER, msg.sender);
        _setupRole(REGISTERED_OFFSET_DEALER, msg.sender);
        _setupRole(REGISTERED_EMISSIONS_AUDITOR, msg.sender);
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
        if (_numOfUniqueTokens >= tokenId) return true;
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
        return _numOfUniqueTokens;
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
        string memory uom,
        uint256 fromDate,
        uint256 thruDate,
        uint256 automaticRetireDate,
        string memory metadata,
        string memory manifest,
        string memory description
    ) public onlyDealer {
        _numOfUniqueTokens += 1;
        CarbonTokenDetails storage tokenInfo = _tokenDetails[_numOfUniqueTokens];
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
                "You are not an Audited Emissions Amount dealer"
            );
        }

        bytes memory callData;


        tokenInfo.tokenId = _numOfUniqueTokens;
        tokenInfo.tokenTypeId = tokenTypeId;
        tokenInfo.issuer = msg.sender;
        tokenInfo.issuee = account;
        tokenInfo.uom = uom;
        tokenInfo.fromDate = fromDate;
        tokenInfo.thruDate = thruDate;
        tokenInfo.metadata = metadata;
        tokenInfo.manifest = manifest;
        tokenInfo.dateCreated = block.timestamp;
        tokenInfo.automaticRetireDate = automaticRetireDate;
        tokenInfo.description = description;

        super._mint(account, _numOfUniqueTokens, quantity, callData);
        TokenCreated(_numOfUniqueTokens);
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
        grantRole(DEFAULT_ADMIN_ROLE, account); // @TODO: Remove me
        emit RegisteredDealer(account);
    }

    /**
     * @dev returns true if Consumer's account is registered for the given token
     * @param account address of the consumer
     */
    function registerConsumer(address account) external onlyDealer {
        grantRole(REGISTERED_CONSUMER, account);
        emit RegisteredDealer(account);
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
        emit UnregisteredDealer(account);
    }

    /**
     * @dev Only contract owner can unregister Consumers
     * @param account address to be unregistered
     */
    function unregisterConsumer(address account) external onlyDealer {
        super.revokeRole(REGISTERED_CONSUMER, account);
        emit UnregisteredDealer(account);
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
