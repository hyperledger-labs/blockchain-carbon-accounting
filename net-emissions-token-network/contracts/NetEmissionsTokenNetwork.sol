pragma solidity ^0.6.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract NetEmissionsTokenNetwork is ERC1155, AccessControl {
    
    bytes32 public constant REGISTERED_REC_DEALER = keccak256("REGISTERED_REC_DEALER");
    bytes32 public constant REGISTERED_CEO_DEALER = keccak256("REGISTERED_CEO_DEALER");
    bytes32 public constant REGISTERED_AE_DEALER = keccak256("REGISTERED_AE_DEALER");

    bytes32 public constant REGISTERED_CONSUMER = keccak256("REGISTERED_CONSUMER");

    struct CarbonTokenDetails {
        uint256 tokenId;              // Auto-increments whenever new tokens are issued
        uint8 tokenTypeId;            // 1 => Renewable Energy Certificate
                                      // 2 => Carbon Emissions Offset 
                                      // 3 => Audited Emissions
        address issuer;               // Address of dealer issuing this token
        address issuee;               // Address of original consumer being issued this token 
        string uom;                   // Unit of measurement
        uint256 fromDate;             // Unix time
        uint256 thruDate;             // Unix time
        uint256 dateCreated;          // Unix time
        uint256 automaticRetireDate;  // Unix time
        string metadata;
        string manifest;
        string description;
        bool retired;
        uint256 retiredAmount;
    }

    mapping (uint256 => CarbonTokenDetails) private _tokenDetails;

    uint256 private _numOfUniqueTokens = 0; // Counts number of unique token IDs (auto-incrementing)
    string[] private TOKEN_TYPES = [
        "Renewable Energy Certificate",     // Corresponds to tokenTypeId of 1
        "Carbon Emissions Offset",          // Corresponds to tokenTypeId of 2
        "Audited Emissions"                 // Corresponds to tokenTypeId of 3
    ];

    // Track all available balances to save gas instead of iterating
    uint256 private totalRenewableEnergyCertificateAmount = 0;
    uint256 private totalCarbonEmissionsOffsetAmount = 0;
    uint256 private totalAuditedEmissionsAmount = 0;

    // Track all retired balances to save gas instead of iterating
    uint256 private totalRetiredRenewableEnergyCertificateAmount = 0;
    uint256 private totalRetiredCarbonEmissionsOffsetAmount = 0;
    uint256 private totalRetiredAuditedEmissionsAmount = 0;
    
    event TokenCreated(uint256);
    event RegisteredDealer(address indexed account );
    event UnregisteredDealer(address indexed account );

    constructor() ERC1155("localhost") public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(REGISTERED_REC_DEALER, msg.sender);
        _setupRole(REGISTERED_CEO_DEALER, msg.sender);
        _setupRole(REGISTERED_AE_DEALER, msg.sender);
    }
    
    modifier consumerOrDealer () {
        bool isConsumer = hasRole(REGISTERED_CONSUMER, msg.sender);
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, msg.sender);
        bool isCeoDealer = hasRole(REGISTERED_CEO_DEALER, msg.sender);
        bool isAeDealer = hasRole(REGISTERED_AE_DEALER, msg.sender);

        require(isConsumer || isRecDealer || isCeoDealer || isAeDealer, "You must be either a consumer or a dealer.");

        _;
    }
    
    modifier onlyDealer() {
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, msg.sender);
        bool isCeoDealer = hasRole(REGISTERED_CEO_DEALER, msg.sender);
        bool isAeDealer = hasRole(REGISTERED_AE_DEALER, msg.sender);

        require(isRecDealer || isCeoDealer || isAeDealer, "You are not a dealer.");
        _;
    }

    modifier onlyOwner() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "You are not the owner.");
        _;
    }


    /**
     * @dev returns true if the tokenId exists
     */
    function tokenExists( uint256 tokenId ) private view returns( bool ) {
        if( _numOfUniqueTokens >= tokenId )
            return true;
        return false; // no matching tokenId
    }
    
    /**
     * @dev returns true if the tokenTypeId is valid
     */
    function tokenTypeIdIsValid( uint8 tokenTypeId ) private view returns( bool ) {
        if ( (tokenTypeId > 0) && (tokenTypeId <= TOKEN_TYPES.length) ) {
            return true;
        }
        return false; // no matching tokenId
    }

    /**
    * @dev returns number of unique tokens
    */
    function getNumOfUniqueTokens( ) public view returns ( uint256 ) {
        return _numOfUniqueTokens;
    }

    function isDealerOrConsumer( address account ) private view returns( bool ) {
        bool isConsumer = hasRole(REGISTERED_CONSUMER, account);
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, msg.sender);
        bool isCeoDealer = hasRole(REGISTERED_CEO_DEALER, msg.sender);
        bool isAeDealer = hasRole(REGISTERED_AE_DEALER, msg.sender);
        if( isConsumer || isRecDealer || isCeoDealer || isAeDealer )
            return true;
        return false;
    }


    /**
     * @dev External function to mint an amount of a token
     * Only contract owner can call this function
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
        require( tokenTypeIdIsValid ( tokenTypeId ), "Failed to mint: tokenTypeId is invalid.");

        if (tokenTypeId == 1) {
            require(hasRole(REGISTERED_REC_DEALER, msg.sender), "You are not a Renewable Energy Certificate dealer.");
            totalRenewableEnergyCertificateAmount += quantity;
        } else if (tokenTypeId == 2) {
            require(hasRole(REGISTERED_CEO_DEALER, msg.sender), "You are not a Carbon Emissions Offset dealer.");
            totalCarbonEmissionsOffsetAmount += quantity;
        } else {
            require(hasRole(REGISTERED_AE_DEALER, msg.sender), "You are not an Audited Emissions Amount dealer.");
            totalAuditedEmissionsAmount += quantity;
        }

        bytes memory callData;

        _numOfUniqueTokens += 1;
        
        CarbonTokenDetails storage tokenInfo = _tokenDetails[ _numOfUniqueTokens ];
        tokenInfo.tokenId = _numOfUniqueTokens;
        tokenInfo.tokenTypeId = tokenTypeId;
        tokenInfo.issuer = msg.sender;
        tokenInfo.issuee = account;
        tokenInfo.uom = uom;
        tokenInfo.fromDate = fromDate;
        tokenInfo.thruDate = thruDate;
        tokenInfo.metadata = metadata;
        tokenInfo.manifest = manifest;
        tokenInfo.dateCreated = now;
        tokenInfo.retired = false;
        tokenInfo.automaticRetireDate = automaticRetireDate;
        tokenInfo.description = description;

        
        super._mint( account, _numOfUniqueTokens, quantity, callData);
        TokenCreated(_numOfUniqueTokens);
    }

   /** 
    * @dev returns if the caller is the owner
    */
    function isOwner( ) external view returns( bool ) {
        return(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
    }

    /** 
    * @dev returns the token name for the given token as a string value
    * @param tokenId token to check 
    */
    function getTokenType( uint256 tokenId ) external view returns( string memory ) {
        require( tokenExists( tokenId ), "tokenId does not exist");
        string memory tokenType = TOKEN_TYPES[(_tokenDetails[tokenId].tokenTypeId - 1)];
        return tokenType;
    }

   /** 
    * @dev checks if the token is in retired state 
    * @param tokenId token to check 
    */
    function isRetired( uint256 tokenId ) public view returns( bool ) {
        require( tokenExists( tokenId ), "tokenId does not exist");
        return( _tokenDetails[tokenId].retired );
    }

    /** 
    * @dev returns the retired amount on a token
    * @param tokenId token to check 
    */
    function getTokenRetiredAmount( uint256 tokenId ) external view returns( uint256 ) {
        require( tokenExists( tokenId ), "tokenId does not exist");
        uint256 amount = _tokenDetails[tokenId].retiredAmount;
        return amount;
    }

   /** 
    * @dev sets the token to the retire state to disable transfers, mints and burns
    * @param tokenId token to set in pause state
    *   Only contract owner can pause or resume tokens
    */
    function retire( address account, uint256 tokenId, uint256 amount) external onlyDealer {
        require( tokenExists( tokenId ), "tokenId does not exist");
        require( (_tokenDetails[tokenId].retired == false), "token is already retired");
        _tokenDetails[tokenId].retired = true;
        _tokenDetails[tokenId].retiredAmount += amount;

        if (_tokenDetails[tokenId].tokenTypeId == 1) {
            totalRetiredCarbonEmissionsOffsetAmount += amount;
            totalRenewableEnergyCertificateAmount -= amount;
        } else if (_tokenDetails[tokenId].tokenTypeId == 2) {
            totalRetiredCarbonEmissionsOffsetAmount += amount;
            totalCarbonEmissionsOffsetAmount -= amount;
        } else {
            totalRetiredAuditedEmissionsAmount += amount;
            totalAuditedEmissionsAmount -= amount;
        }

        super._burn( account, tokenId, amount );
    }

   /** 
    * @dev returns true if Dealer's account is registered
    * @param account address of the dealer 
    */
    function isDealerRegistered( address account ) external view returns( bool ) {
        bool isRecDealer = hasRole(REGISTERED_REC_DEALER, account);
        bool isCeoDealer = hasRole(REGISTERED_CEO_DEALER, account);
        bool isAeDealer = hasRole(REGISTERED_AE_DEALER, account);
        if( isRecDealer || isCeoDealer || isAeDealer )
            return true;
        return false;
    }

   /** 
    * @dev returns true if Consumers's account is registered
    * @param account address of the dealer 
    */
    function isConsumerRegistered( address account ) external view returns( bool ) {
        return hasRole(REGISTERED_CONSUMER, account);
    }

   /** 
    * @dev Only CB (Owner or address(0)) can register Dealers
    * @param account address of the dealer to register
    * Only registered Dealers can transfer tokens 
    */
   function registerDealer( address account, uint8 tokenTypeId) external onlyOwner {
        if (tokenTypeId == 1) {
            grantRole(REGISTERED_REC_DEALER, account);
        } else if (tokenTypeId == 2) {
            grantRole(REGISTERED_CEO_DEALER, account);
        } else {
            grantRole(REGISTERED_AE_DEALER, account);
        }
        grantRole(DEFAULT_ADMIN_ROLE, account);
        emit RegisteredDealer( account );
    }
    
   /** 
    * @dev returns true if Consumer's account is registered for the given token
    * @param account address of the consumer 
    */
     function registerConsumer( address account ) external onlyDealer {
        grantRole(REGISTERED_CONSUMER, account);
        emit RegisteredDealer( account );
    }
    
    /** 
     * @dev Only CB (Owner or address(0)) can unregister Dealers
     * @param account address to be unregistered
     */
    function unregisterDealer( address account ) external onlyOwner {
        super.revokeRole("REGISTERED_DEALER", account);
        emit UnregisteredDealer( account );
    }

    /** 
     * @dev Only CB (Owner or address(0)) can unregister Consumers
     * @param account address to be unregistered
     */
    function unregisterConsumer( address account ) external onlyDealer {
        super.revokeRole("REGISTERED_CONSUMER", account);
        emit UnregisteredDealer( account );
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
        require( tokenExists( tokenId ), "tokenId does not exist");
        require( ( isRetired( tokenId ) == false ), "Token is retired. Transfer is not permitted" );
        require( isDealerOrConsumer( to ), "Recipient must be consumer or dealer.");
        require( ( msg.sender != to), "Sender and receiver cannot be the same" );
        super.safeTransferFrom( msg.sender, to, tokenId, value, '0x00' );
    }

    /** 
     * @dev returns the balance of the account for the given token
     * @param account address for which balance to be checked
     * @param tokenId tokenId for the balance query
     * Balance will be provided only for registered account
     */
    function getBalance (address account, uint256 tokenId) external view returns( uint256 ) {
        return super.balanceOf(account, tokenId);
    }

    /**
     * @dev returns the total available amount by tokenTypeId
     * @param tokenTypeId tokenTypeId to check
     */
    function getAvailableBalanceByTokenTypeId (uint8 tokenTypeId) external view returns( uint256 ) {
        require( tokenTypeIdIsValid( tokenTypeId ), "Token type does not exist");
        if (tokenTypeId == 1) {
            return totalRenewableEnergyCertificateAmount;
        } else if (tokenTypeId == 2) {
            return totalCarbonEmissionsOffsetAmount;
        } else if (tokenTypeId == 3) {
            return totalAuditedEmissionsAmount;
        }
    }


    /**
     * @dev returns the total retired amount by tokenTypeId
     * @param tokenTypeId tokenTypeId to check
     */
    function getRetiredBalanceByTokenTypeId (uint8 tokenTypeId) external view returns( uint256 ) {
        require( tokenTypeIdIsValid( tokenTypeId ), "Token type does not exist");
        if (tokenTypeId == 1) {
            return totalRetiredCarbonEmissionsOffsetAmount;
        } else if (tokenTypeId == 2) {
            return totalRetiredCarbonEmissionsOffsetAmount;
        } else if (tokenTypeId == 3) {
            return totalRetiredAuditedEmissionsAmount;
        }
    }


    /**
     * @dev returns the total retired and available amount by tokenTypeId
     * @param tokenTypeId tokenTypeId to check
     */
    function getBothBalanceByTokenId (uint8 tokenTypeId) external view returns( uint256, uint256 ) {
        require( tokenTypeIdIsValid( tokenTypeId ), "Token type does not exist");
        if (tokenTypeId == 1) {
            return (totalRenewableEnergyCertificateAmount, totalRetiredCarbonEmissionsOffsetAmount);
        } else if (tokenTypeId == 2) {
            return (totalCarbonEmissionsOffsetAmount, totalRetiredCarbonEmissionsOffsetAmount);
        } else if (tokenTypeId == 3) {
            return (totalAuditedEmissionsAmount, totalRetiredAuditedEmissionsAmount);
        }
    }

}
