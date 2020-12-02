/**
Copyright 2020 Swapshub
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
*/


pragma solidity ^0.6.2;

import "./Roles.sol"; 
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract NetEmissionsTokenNetwork is ERC1155 {
	address public owner;	  // owner of this contract (Central Bank)
	using Roles for Roles.Role; // We intend to use the Roles library

	struct TokenDetails {
		uint256 id;   // token Id   (must be unique)
		string name;   // simple name of the token (it may not be unique)
		uint8 decimals;   // number of decimals
		bool   isPaused;  // can be paused (true) and resumed (false) by owner of this contract
		string TTF_url;   // url to the TTF definition of this token
		Roles.Role   registeredDealers; // Everyone must register first to initiate token transfers
	}
	
	struct CarbonTokenDetails {
	    uint256 tokenId;   // token Id   (must be unique)
		string issuerId;   // token Id   (must be unique)
		string recipientId;   // token Id   (must be unique)
		string assetType;
		uint8 quantity;
		string uom;
		string dateStamp;
		string metadata;
		string manifest;
		bool retired;
		Roles.Role   registeredDealers; // Everyone must register first to initiate token transfers
		Roles.Role   registeredConsumers; // Everyone must register first to initiate token transfers
	}

    // mapping (uint256 => TokenDetails) private _tokenDetails;    // tokenId to tokenDefinition
    mapping (uint256 => CarbonTokenDetails) private _tokenDetails;    // tokenId to tokenDefinition
	uint256[] private _tokenIds;    // array of tokens

    event TokenDefined( uint256 tokenId, string tokenName, string ttfURL );
    event CarbonTokenDefined(uint256 tokenId);
    event RegisteredDealer(address indexed account );
    event UnregisteredDealer(address indexed account );

	constructor( ) ERC1155("localhost") public {
		owner = msg.sender;
	}

	modifier onlyOwner() {
		require(msg.sender == owner, "You are not the owner.");
		_;
	}

    /**
     * @dev returns true if the tokenId already exists (already defined by contract owner)
	 */
	function tokenExists( uint256 tokenId ) private view returns( bool ) {
		uint256 idx;
		for( idx = 0; idx < _tokenIds.length; idx++ ) {
			if( _tokenIds[idx] == tokenId )
				return true;
		}
		return false; // no matching tokenId
	}

	/**
    * @dev returns ids of all tokens
    */
	function getAllTokenIds( ) public view returns ( uint256[] memory ) {
		return _tokenIds;
	}

	function addCarbonToken( uint256 tokenId, uint8 quantity, string memory issuerId, string memory recipientId, string memory assetType, string memory uom, string memory dateStamp, string memory metadata, string memory manifest) public onlyOwner {
        require( ( tokenExists( tokenId ) == false ), "eThaler: tokenId is already defined ");
		CarbonTokenDetails storage tokenInfo = _tokenDetails[ tokenId ];
		tokenInfo.tokenId = tokenId;
		tokenInfo.quantity = quantity;
		tokenInfo.issuerId = issuerId;
		tokenInfo.recipientId = recipientId;
		tokenInfo.assetType = assetType;
		tokenInfo.uom = uom;
		tokenInfo.dateStamp = dateStamp;
		tokenInfo.metadata = metadata;
		tokenInfo.manifest = manifest;
		tokenInfo.retired = false;


		_tokenIds.push( tokenId );   // add to array of tokens
    	emit CarbonTokenDefined( tokenId);
	}

    /**
     * @dev External function to mint an amount of a token for the given tokenId
	 * Only contract owner can call this function
	 * This function can be called any number of times to add to the current total for a given tokenId
     * @param tokenId of the token to mint
     * @param amount of the token to mint For ex: if one needs 100 full tokens, the caller 
	 * should set the amount as (100 * 10^4) = 1,000,000 (assuming the token's decimals is set to 4)
     * @param callbackData if smartcontract calling this function
     */
    function mint( uint256 tokenId, uint256 amount, bytes calldata callbackData ) external onlyOwner {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
// 		require( ( isPaused( tokenId ) == false ), "eThaler: Token is paused. Minting is not permitted" );
		super._mint( msg.sender, tokenId, amount, callbackData  );
		// minter = address( msg.sender );    or minter = msg.sender;
	}

    /**
     * @dev External function to burn an amount of a token for the given tokenId
	 * Only contract owner can call this function
     * @param tokenId of the token to be burnt
     * @param amount of the token to be burnt
     */
//     function burn( uint256 tokenId, uint256 amount ) external onlyOwner {
//         require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
// 		require( ( isPaused( tokenId ) == false ), "eThaler: Token is paused. Burning is not permitted" );
// 		super._burn( msg.sender, tokenId, amount );
// 	}

   /** 
    * @dev returns if the caller is the owner
    */
	function isOwner( ) external view returns( bool ) {
		return(msg.sender == owner);
	}

   /** 
    * @dev returns the token decimals for the given token
	* @param tokenId token to check 
    */
// 	function getDecimals( uint256 tokenId ) external view returns( uint8 ) {
//         require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
// 		return( _tokenDetails[tokenId].decimals );
// 	}

   /** 
    * @dev returns the token name for the given token
	* @param tokenId token to check 
    */
	function getTokenName( uint256 tokenId ) external view returns( string memory ) {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
		string memory tokenName = _tokenDetails[tokenId].issuerId;
		return tokenName;
	}

   /** 
    * @dev returns the TTF (Token Taxonomy Framework) token specs URL for the given token
	* @param tokenId token to check 
    */
// 	function getTTF_URL( uint256 tokenId ) external view returns( string memory ) {
//         require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
// 		string memory ttfUrl = _tokenDetails[tokenId].TTF_url;
// 		return( ttfUrl );
// 	}

   /** 
    * @dev checks if the token is in retired state 
	* @param tokenId token to check 
    */
	function isRetired( uint256 tokenId ) public view returns( bool ) {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
		return( _tokenDetails[tokenId].retired );
	}

   /** 
    * @dev sets the token to the retire state to disable transfers, mints and burns
	* @param tokenId token to set in pause state
	*   Only contract owner can pause or resume tokens
    */
	function retire( uint256 tokenId ) external onlyOwner {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
        require( (_tokenDetails[tokenId].retired == false), "eThaler: token is already retired");
		_tokenDetails[tokenId].retired = true;
	}

   /** 
    * @dev removes the token from the pause state to enable transfers, mints and burns
	* @param tokenId token to remove the pause state
	*   Only contract owner can pause or resume tokens
    */
	function resume( uint256 tokenId ) external onlyOwner {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
        require( _tokenDetails[tokenId].retired, "eThaler: token is not in retired state");
		_tokenDetails[tokenId].retired = false;
	}

   /** 
    * @dev returns true if Dealer's account is registered for the given token
    * @param account address of the dealer 
	* @param tokenId token for registration check
	*   Only contract owner can check for dealer registration
    */
	function isDealerRegistered( address account, uint256 tokenId ) external onlyOwner view returns( bool ) {
		return _tokenDetails[tokenId].registeredDealers.has( account );
	}

   /** 
    * @dev Only CB (Owner or address(0)) can register Dealers
    * @param account address of the dealer to register
	* @param tokenId token for registration
    * Only registered Dealers can transfer tokens 
    */
   function registerDealer( address account, uint256 tokenId ) external onlyOwner {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
		_tokenDetails[tokenId].registeredDealers.add( account );
		this.setApprovalForAll( account, true );  // enable this contract as approved in ERC1155 contract for xacting with the owner address 
    	emit RegisteredDealer( account );
	}
	
	
	
   /** 
    * @dev returns true if Consumer's account is registered for the given token
    * @param account address of the consumer 
	* @param tokenId token for registration check
	*   Only contract owner can check for consumer registration
    */
	function isConsumerRegistered( address account, uint256 tokenId ) external onlyOwner view returns( bool ) {
		return _tokenDetails[tokenId].registeredConsumers.has( account );
	}
	
	
	   /** 
    * @dev Only CB (Owner or address(0)) can register Consumers
    * @param account address of the dealer to register
	* @param tokenId token for registration
    */
   function registerConsumer( address account, uint256 tokenId ) external onlyOwner {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
		_tokenDetails[tokenId].registeredConsumers.add( account );
		this.setApprovalForAll( account, true );  // enable this contract as approved in ERC1155 contract for xacting with the owner address 
    	emit RegisteredDealer( account );
	}

	/** 
	 * @dev returns true if all the token balances for the account are 0
     * @param account address of the account to which all token balances to be checked
	 */
	function checkAllBalancesAreZero( address account ) private view returns( bool ) {
		uint256 idx;
		for( idx = 0; idx < _tokenIds.length; idx++ ) {
			if( super.balanceOf( account, _tokenIds[idx] ) != 0 )
				return false;
		}
		return true; // all token balances are 0 
	}

	/** 
	 * @dev returns true if the token balance for the account & tolem is 0
     * @param account address of the account for which token balance to be checked
     * @param tokenId tokenId for which balance to be checked
	 */
	function checkBalance( address account, uint256 tokenId ) private view returns( bool ) {
		uint256 idx;
		for( idx = 0; idx < _tokenIds.length; idx++ ) {
			if( _tokenIds[idx] == tokenId ) {
				return ( super.balanceOf( account, _tokenIds[idx] ) == 0 );
			}
		}
		return true; // no matching token: token balance is 0 by defailt
	}

	/** 
	 * @dev Only CB (Owner or address(0)) can unregister Dealers
     * @param account address to be unregistered
     * @param tokenId tokenId for the transfer
	 *  Only accounts with 0 balance can be unregistered 
	 */
    function unregisterDealer( address account, uint256 tokenId ) external onlyOwner {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
		// before unregistering a dealer, ensure that the dealer has no balances for the token
        require( checkBalance( account, tokenId ), "eThaler: unregistration permitted only when there is no balance in the account");
		_tokenDetails[tokenId].registeredDealers.remove( account );
		this.setApprovalForAll( account, false );  // enable this contract as approved in ERC1155 contract for xacting with the owner address 
    	emit UnregisteredDealer( account );
	}

	/** 
	 * @dev transfers the value to the 'to' account for tokenId
     * @param to recipient address 
     * @param tokenId tokenId for the transfer
     * @param value amount of transfer
	 *  Transfer can start only when both parties are registered and the token is not paused
	 */
    function transfer(
        address to,
        uint256 tokenId,
        uint256 value
    ) external {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
		require( ( isRetired( tokenId ) == false ), "eThaler: Token is paused. Transfer is not permitted" );
		require( _tokenDetails[tokenId].registeredDealers.has( msg.sender ), "eThaler: sender must be registered first" );
		require( _tokenDetails[tokenId].registeredDealers.has( to ), "eThaler: receiver must be registered first" );
		require( ( msg.sender != to), "eThaler: sender and receiver cannot be the same" );
		this.safeTransferFrom( msg.sender, to, tokenId, value, '0x00' );
    }

	// /** 
	//  * @dev returns the balance of the account for the given token
    //  * @param account address for which balance to be checked
    //  * @param tokenId tokenId for the balance query
	//  * Balance will be provided only for registered account
	//  */
    // function balanceOf( address account, uint256 tokenId ) public view override onlyOwner returns (uint256) {
	// // 	require( _tokenDetails[tokenId].registeredDealers.has( account ), 
	// // 		"eThaler: dealer account must be registered first" );
    // 	return super.balanceOf( account, tokenId );
	// }

    // function balanceOf( uint256 tokenId ) external view returns (uint256) {
	// 	require( _tokenDetails[tokenId].registeredDealers.has( msg.sender ), 
	// 		"eThaler: dealer account must be registered first" );
    // 	return super.balanceOf( msg.sender, tokenId );
	// }

/*****
 * Can't implement this function as only libraries are allowed to use the 
 * mapping type in public or external functions.
	function getTokenDetails( uint256 tokenId ) public view returns( TokenDetails memory ) {
        require( tokenExists( tokenId ), "eThaler: tokenId does not exist");
		TokenDetails memory tokenInfo =  _tokenDetails[ tokenId ];
		return tokenInfo;
	}
 ****/


   /**
	struct TokenBalance {
		uint256 tokenId;
		uint256 balance;
		string name; 
	}
	**/

/**
  * to enable the following function, we have to enable the pragma:
  * new experimental ABI encoder. Use "pragma experimental ABIEncoderV2;" 
  * 
  * memory is expensive in terms of gas. However in private network gas cost is assumed 0. 
	function getTokenBalances( ) public view returns ( TokenBalance[] memory ) {
		uint256 numTokens = _tokenIds.length;
		TokenBalance[] memory tokBalA = new TokenBalance[]( numTokens );
		for( uint i= 0; i < numTokens; i++ ) {
			uint256 tokenId = _tokenIds[i];
			TokenBalance memory tokBal; // = new TokenBalance;
			tokBal.tokenId = tokenId;
			tokBal.balance = super.balanceOf( msg.sender, tokenId );
			tokBal.name = _tokenDetails[tokenId].name;
			tokBalA[i] = tokBal;
		}
		return tokBalA;
	}

	// deprecated: all allocations are now handled via transfer
    function allocate(
        address to,
        uint256 tokenId,
        uint256 value
    ) private onlyOwner {
		require( _tokenDetails[tokenId].registeredDealers.has( to ), "eThaler: receiver must be registered first" );
		require( ( to != owner), "eThaler: receiver must not be contract owner" );
		this.safeTransferFrom( msg.sender, to, tokenId, value, '0x00' );
    }

	// deprecated: all unallocations are now handled via transfer
    function unallocate (
        address from,
        uint256 tokenId,
        uint256 value
    ) private onlyOwner {
		require( _tokenDetails[tokenId].registeredDealers.has( from ), "eThaler: from dealer account must be registered first" );
		require( ( from != owner), "eThaler: sender must not be contract owner" );
		this.safeTransferFrom( from, msg.sender, tokenId, value, '0x00' );
    }

 ******/


}


