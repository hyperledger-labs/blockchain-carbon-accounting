// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../NetEmissionsTokenNetwork.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract CarbonTracker is Initializable, ERC721Upgradeable, AccessControlUpgradeable, ERC1155HolderUpgradeable {

    using SafeMathUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using ECDSAUpgradeable for bytes32;
    using ECDSAUpgradeable for address;

    NetEmissionsTokenNetwork public net;
    address public netAddress;

    // Registered Tracker
    bytes32 public constant REGISTERED_TRACKER =
        keccak256("REGISTERED_TRACKER");
    /**
     * @dev tracker details
     * trackerId
     * trackee - address of the account the tracking will apply to
     * auditor -
     * numOfProducts - countable integer for the num of products assigned to tracker
    **/
    struct CarbonTrackerDetails {
        uint trackerId;
        address trackee;    
        address auditor;    
        //uint totalEmissions;
        uint totalProductAmounts;
        uint256 fromDate;
        uint256 thruDate;
        uint256 dateCreated;
        string metadata;
        string description;
    }
    /** 
     * @dev tracker mappings
     * tokenIds - array of ids of carbon tokens (direct/indirect/offsets)
     * idIndex - mapping tokenId to its index in array. 1st index is 1, 0 reserved for unindexed
     * amount - mapping tokenId to amount of emissions
     * product mapping productId to ProductQuantities
     * trackerIds - arrays of tracker ids referenced by this tracker
     * trackerIndex - mapping sourceTrackerId to index in array. 1st index is 1, 0 reserved for unindexed.
     * productsTracked - map productId to information about productsTracked 
    **/
    struct CarbonTrackerMappings {
        uint[] tokenIds;
        mapping(uint => uint) idIndex; 
        mapping(uint => uint) amount;
        uint[] productIds;
        mapping(uint => uint) productIdIndex;
        mapping(uint => ProductQuantities) product;
        uint[] trackerIds;
        mapping(uint => uint) trackerIndex;
        mapping(uint => ProductsTracked) productsTracked;
    }
    /**
     * @dev ProductQuantities
     * amount - amount of product
     * available - amount of product available
     * auditor - address that submited the unit amount
    **/
    struct ProductQuantities {
        uint256 amount;
        uint256 available;
    }
    struct ProductDetails {
        address auditor;
        // TO-DO the unit Amount and unit should be stored offline to retain product privacy.
        string name;
        uint unitAmount;
        string unit;
    }
    /**
     * @dev ProductsTracked
     * productIds - tracked
     * productIndex - of productId tracked
     * amount - of productId tracked
    **/
    struct ProductsTracked {
        uint[] productIds;
        mapping(uint => uint) productIndex;
        mapping(uint => uint) amount;
    }

    mapping(uint => CarbonTrackerDetails) internal _trackerData;
    mapping(uint => CarbonTrackerMappings) internal _trackerMappings;
    mapping(uint => ProductDetails) internal _productData;

    CountersUpgradeable.Counter public _numOfUniqueTrackers;
    CountersUpgradeable.Counter public _numOfProducts;
    mapping(uint => uint) _productTrackerId; // map productId to trackerId
    mapping(uint => uint) lockedAmount;//amount of token Id locked into the contract.
    // map productBalance from productId => trackerId and address of holder 
    mapping(uint => mapping(uint => mapping(address => uint))) public productBalance;

    // map verifier to trackee
    mapping(address => mapping (address => bool)) isVerifierApproved;

    uint public divDecimals; // decimal expansion for division

    event RegisteredTracker(address indexed account);
    event TrackerUpdated(
        uint256 indexed trackerId,
        address indexed tracker,
        uint256[] tokenIds,
        uint256[] tokenAmounts,
        uint256 fromDate,
        uint256 thruDate);
    event ProductsUpdated(
        uint256 indexed trackerId,
        uint256[] productIds,
        uint256[] productAmounts);
    event TrackeeChanged(uint indexed trackerId, address indexed trackee);
    event VerifierApproved(address indexed auditor,address indexed trackee);
    event VerifierRemoved(address indexed auditor,address indexed trackee);
    event VerifiedOutput(uint indexed tokenId,address indexed trackee,uint amount );

    function initialize(address _net, address _admin) public initializer {
        net = NetEmissionsTokenNetwork(_net);
        netAddress = _net;
        divDecimals = 1000000;
        __ERC721_init('NET Carbon Tracker', "NETT");
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(REGISTERED_TRACKER, _admin);
    }  
    modifier notAudited(uint trackerId){
        require(_trackerData[trackerId].auditor==address(0),
            "CLM8::notAudited: trackerId is already audited"
        );
        _;
    }
    modifier isAuditor(uint trackerId){
        _isAuditor(_trackerData[trackerId].trackee);
        _;
    }
    modifier isAudited(uint trackerId){
        _isAudited(trackerId);
        _;
    }
    function _isAuditor(address _trackee) view internal{
        require(
            // TO-DO enforce isVerifierApproved using && condition in require
            // i.e. require _trackee to approve verifiers (auditor)
            isVerifierApproved[msg.sender][_trackee] ||
            (net.isAuditor(msg.sender) ||
            msg.sender == netAddress)
            ,"CLM8::_isAuditor: _trackee is not and approved auditor of the trackee");
    }
    function _isAudited(uint trackerId) view internal{
        require(_trackerData[trackerId].auditor!=address(0)
            ,"CLM8::_isAudited: trackerId is not audited");
    }
    modifier trackerExists(uint256 trackeID){
        _trackerExists(trackeID);
        _;
    }
    function _trackerExists(uint256 trackeID) view internal{
        require(_numOfUniqueTrackers.current() >= trackeID
            ,"CLM8::_trackerExists: tracker token ID does not exist");
    }
    modifier registeredTracker(address trackee){
        require(hasRole(REGISTERED_TRACKER, trackee)
            ,"CLM8::registeredTracker: the address is not registered");
        _;
    }
    modifier isIndustry(address industry){
        require(net.isIndustry(industry)
            ,"CLM8::registeredIndustry: the address is not registered");
        _;
    }
    modifier onlyAdmin() {         
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
            ,"CLM8::onlyAdmin: msg.sender is not an admin");
        _;
    }
    modifier isOwner(uint trackerId){
        _isOwner(trackerId,msg.sender);
        _;
    }
    function _isOwner(uint trackerId,address owner) view internal {
        require(super.ownerOf(trackerId) == owner,
            "CLM8::_isOwner: msg.sender does own this trackerId");
    }
    /**
     * @dev require msg.sender has admin role
     */
    modifier selfOrAdmin(address _address){
        require( _address==msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CLM8::selfOrAdmin: msg.sender does not own this address or is not an admin");               
        _;
    }

    function _verifyTotalTracked(uint256 outAmount, uint256 totalTracked) public pure {
        require(outAmount >= totalTracked,
            "CLM8::_verifyTotalTracked: total amount tracked exceeds output of tokenId from trackerId"
        );
    }

    function supportsInterface(bytes4 interfaceId) public view virtual 
        override(ERC721Upgradeable,ERC1155ReceiverUpgradeable,AccessControlUpgradeable) returns (bool) {
        return interfaceId == type(IAccessControlUpgradeable).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev create a tracker Token for trackee. Note _track will check that msg.sender is either the trackee, or is an approved auditor of the trackee (see isVerifierApproved[][] mapping)
     * @param trackee - target adress to be tracked
     * @param tokenIds - array of ids of tracked carbon tokens (direct/indirect/offsets)
     * @param tokenAmounts - array of incoming token id amounts (direct/indirect/offsets) matching each carbon token
     * @param fromDate - start date of tracker
     * @param thruDate - end date of tracker
     */
    function track(
        address trackee,
        uint256[] memory tokenIds,
        uint256[] memory tokenAmounts,
        uint256 fromDate,
        uint256 thruDate,
        string memory description
        ) public returns(uint){
        CarbonTrackerDetails storage trackerData = _track(trackee);
        _trackTokens(trackerData,tokenIds,tokenAmounts,fromDate,thruDate,description);
        super._mint(trackee,trackerData.trackerId);
        return trackerData.trackerId;
    }
    /**
     * @dev update a tracker Token 
     * @param trackerId of the token
     * see tracker() function for description of other inputs
    **/ 
    function trackUpdate(
        uint trackerId,
        uint256[] memory tokenIds,
        uint256[] memory tokenAmounts,
        uint256 fromDate,
        uint256 thruDate,
        string memory description) public 
        notAudited(trackerId) trackerExists(trackerId) {
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        _trackTokens(trackerData,tokenIds,tokenAmounts,fromDate,thruDate,description);
    }
    /**
     * @dev create tracker 
     * @param trackee where products are to be sent
    **/ 
    function _track(address trackee) internal returns(CarbonTrackerDetails storage){
        // increment trackerId
        _numOfUniqueTrackers.increment();
        uint256 trackerId = _numOfUniqueTrackers.current();
        // create token details
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        trackerData.trackerId = trackerId;
        trackerData.trackee = trackee;
        trackerData.dateCreated = block.timestamp;
        return trackerData;
    }
    /**
     * @dev updated token data assinged to tracker
     * used by track() and trackerUpdate()
    **/ 
    function _trackTokens(
        CarbonTrackerDetails storage trackerData,
        uint256[] memory tokenIds,
        uint256[] memory tokenAmounts,
        uint256 fromDate,
        uint256 thruDate,
        string memory description) internal {
        _isAuditor(trackerData.trackee);
        if(fromDate>0){trackerData.fromDate = fromDate;}
        if(thruDate>0){trackerData.thruDate = thruDate;}
        //if(bytes(metadata).length>0){trackerData.metadata = metadata;}
        if(bytes(description).length>0){trackerData.description = description;}
        
        require(tokenAmounts.length == tokenIds.length, 
            "CLM8::_track: tokenAmounts and tokenIds are not the same length"); 
        // create trcker Mappings to store tokens (and product) info
        CarbonTrackerMappings storage trackerMappings = _trackerMappings[trackerData.trackerId];

        for (uint i = 0; i < tokenIds.length; i++) { 
            (uint avail, )=net.getAvailableAndRetired(address(this), tokenIds[i]);
            require(
                avail.sub(lockedAmount[tokenIds[i]])>=tokenAmounts[i]
                || msg.sender == netAddress
                ,"CLM8::_track: tokenAmounts[i] is greater than what is available to the tracker contract"
            );
            lockedAmount[tokenIds[i]]=lockedAmount[tokenIds[i]].add(tokenAmounts[i]);
            uint index = trackerMappings.idIndex[tokenIds[i]];
            uint8 tokenTypeId = net.getTokenTypeId(tokenIds[i]);
            _addTokenAmounts(trackerMappings,tokenIds[i],
                    tokenAmounts[i],index,tokenTypeId);
        }
        emit TrackerUpdated(trackerData.trackerId,msg.sender,tokenIds,tokenAmounts,fromDate,thruDate);
    } 
    /**
     * @dev track a product to and existing trackerId
     * used by track() and trackerUpdate()
    **/ 
    function trackProduct(
        uint trackerId,
        uint sourceTrackerId,
        uint productId,
        uint productAmount) public notAudited(trackerId)
        {
        _trackerExists(trackerId);
        _isOwner(trackerId,msg.sender);
        //require(productAmounts.length == productIds.length, 
        //    "CLM8::sendProducts: productAmounts and productIds are not the same length");
        require(trackerId != sourceTrackerId, 
                "CLM8::sendProducts: sourceTrackerId can not equal the trackerId");
        //for (uint i = 0; i < productIds.length; i++) { }
        require(productBalance[productId][sourceTrackerId][msg.sender] > productAmount, 
            "CLM8::trackProduct: productAmount exceeds products available form the sourceTrackerId");
        productBalance[productId][sourceTrackerId][msg.sender]=
            productBalance[productId][sourceTrackerId][msg.sender].sub(productAmount);
        _updateTrackedProducts(trackerId,sourceTrackerId,productId,productAmount);
    }
    /**
     * @dev send a product to an address
     * used by track() and trackerUpdate()
    **/ 
    function transferProduct(
        uint productId,
        uint productAmount,
        uint sourceTrackerId,
        address trackee ) public isAudited(sourceTrackerId) 
        isOwner(sourceTrackerId) isIndustry(trackee){ 
        CarbonTrackerMappings storage sourceTrackerMappings = _trackerMappings[sourceTrackerId];
        ProductQuantities storage product;
        
        //for (uint i = 0; i < productIds.length; i++) { }
        product = sourceTrackerMappings.product[productId];
        require(product.available > productAmount, 
            "CLM8::transferProduct: productAmount exceeds products available in sourceTrackerId");
        // update product availability
        product.available = product.available.sub(productAmount); 
        productBalance[productId][sourceTrackerId][trackee]=
            productBalance[productId][sourceTrackerId][trackee].add(productAmount);
    }
    /**
     * @dev send a product to a trackerId
     * used by track() and trackerUpdate()
    **/ 
    function transferProductToTracker(
        uint trackerId,
        uint sourceTrackerId,
        uint productId,
        uint productAmount) public notAudited(trackerId) {
        _trackerExists(trackerId)  ;
        _isOwner(trackerId,msg.sender);

        //require(productAmounts.length == productIds.length, 
        //    "CLM8::sendProducts: productAmounts and productIds are not the same length");
        require(trackerId != sourceTrackerId, 
                "CLM8::transferProductToTracker: sourceTrackerId can not equal the trackerId");
        CarbonTrackerMappings storage trackerMappings = _trackerMappings[trackerId];
        ProductQuantities storage product = trackerMappings.product[productId];
        
        //for (uint i = 0; i < productIds.length; i++) { }
        require(productBalance[productId][sourceTrackerId][msg.sender] > productAmount, 
            "CLM8::transferProductToTracker: productAmount exceeds products available form the sourceTrackerId");
        // update product availability
        productBalance[productId][sourceTrackerId][msg.sender] = 
            productBalance[productId][sourceTrackerId][msg.sender].sub(productAmount);
        product.amount = productAmount;
        product.available = productAmount;
        trackerMappings.productIds.push(productId);
        _trackerData[trackerId].totalProductAmounts = 
            _trackerData[trackerId].totalProductAmounts.add(productAmount);
    }
    /**
     * @dev update a tracker Token 
     * @param trackerId of the token
     * see tracker() function for description of other inputs
    **/ 
    function productsUpdate(
        uint trackerId,
        uint[] memory productIds,
        uint[] memory productAmounts,
        string[] memory productNames,
        string[] memory productUnits,
        uint[] memory productUnitAmounts
        ) public notAudited(trackerId) trackerExists(trackerId) isAuditor(trackerId){
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        CarbonTrackerMappings storage  trackerMappings = _trackerMappings[trackerId];
        require(productAmounts.length == productIds.length, 
            "CLM8::productsUpdate: productAmounts and productIds are not the same length");
        // TO-DO the followoing input paramters should not be sent to the contract to presever producer privacy.
        // see ProductDetails _productData mapping
        require(productNames.length == productIds.length, 
            "CLM8::productsUpdate: productNames and productIds are not the same length");
        require(productUnitAmounts.length == productIds.length, 
            "CLM8::productsUpdate: productUnitAmounts and productIds are not the same length");
        require(productUnits.length == productIds.length, 
            "CLM8::productsUpdate: productUnitAmounts and productIds are not the same length");

        uint productId;
        ProductQuantities storage product;
        for (uint i = 0; i < productIds.length; i++) {

            if(productIds[i]>0){
                productId = productIds[i];
                require(_productTrackerId[productId] == trackerId, 
                    "CLM8::productsUpdate: productIds[i] does not belong to trackerId");
                 
                trackerData.totalProductAmounts = 
                    trackerData.totalProductAmounts.sub(productAmounts[i]);
                require(_productData[productId].auditor==msg.sender,
                    "CLM8::productsUpdate: msg.sender is not the auditor of this product");
            }else{
                _numOfProducts.increment();
                productId = _numOfProducts.current();
                _productTrackerId[productId]=trackerId;
                trackerMappings.productIds.push(productId);
                _productData[productId].auditor = msg.sender;
            } 
            product = trackerMappings.product[productId];
            _productData[productId].name = productNames[i];
            _productData[productId].unitAmount = productUnitAmounts[i];
            _productData[productId].unit = productUnits[i];
            product.amount = productAmounts[i];
            product.available = productAmounts[i];
            trackerData.totalProductAmounts = 
                trackerData.totalProductAmounts.add(productAmounts[i]);
        }
        emit ProductsUpdated(trackerData.trackerId,productIds,productAmounts);
    }
    /**
     * @dev update the token data within the Tracker
     * @param tokenId to be updated
     * @param tokenData to be updated 
     * @param amountAdd - amount of token to add
     * @param index - index of current tokenId
     * @param tokenTypeId
    **/
    function _addTokenAmounts(
        CarbonTrackerMappings storage tokenData,
        uint tokenId,  
        uint amountAdd,
        uint index,
        uint tokenTypeId) internal{ 
        //AEC are not used by the tracker contract
        if(tokenTypeId==4){
            tokenData.amount[tokenId] = tokenData.amount[tokenId].add(amountAdd);
        }else if(tokenTypeId==2){
            tokenData.amount[tokenId] = tokenData.amount[tokenId].sub(amountAdd);
        }// REC does not change the total emissions

        if(tokenData.amount[tokenId]>0){
            // if the final amount is not zero check if the tokenId should be
            // added to the tokenIds array and update idAmount
            if(index==0){
                tokenData.tokenIds.push(tokenId);
                tokenData.idIndex[tokenId]=tokenData.tokenIds.length;
            }
            
        }
    }
    function _subTokenAmounts(uint tokenId, CarbonTrackerMappings storage tokenData, 
        uint total, 
        uint amountSub,
        uint index,
        uint tokenTypeId
        ) internal returns(uint){
        if(tokenTypeId>2){
            total = total.sub(amountSub);
            tokenData.amount[tokenId] = tokenData.amount[tokenId].sub(amountSub);
        }else if(tokenTypeId==2){
            total = total.add(amountSub);
            tokenData.amount[tokenId] = tokenData.amount[tokenId].add(amountSub);
        }// REC does not change the total emissions

        if(tokenData.amount[tokenId]==0){
            // remove tokenId and associated data from tracker
            if (tokenData.tokenIds.length > 1) {
                tokenData.tokenIds[index-1] = 
                    tokenData.tokenIds[tokenData.tokenIds.length-1];
                tokenData.idIndex[tokenData.tokenIds[index-1]]=index;
            }
            // index of tokenId should be deleted;
            delete tokenData.idIndex[tokenId];
            delete tokenData.amount[tokenId];
            delete tokenData.tokenIds[tokenData.tokenIds.length-1];
        }
        return total;
    }
    /**
     * @dev update the product info within the Tacker
    **/
    function _updateTrackedProducts(
        uint trackerId, 
        uint256 sourceTrackerId, 
        uint productId,
        uint productAmount) internal  {
        CarbonTrackerMappings storage trackerMappings = _trackerMappings[trackerId]; 
        ProductsTracked storage productsTracked =
            trackerMappings.productsTracked[sourceTrackerId];
        productsTracked.amount[productId]=
            productsTracked.amount[productId].add(productAmount);

        uint trackerIndex = trackerMappings.trackerIndex[sourceTrackerId];
        uint productIndex = productsTracked.productIndex[productId];
        
        if(productsTracked.amount[productId]>0){
            // if there are tracked tokenIds    
            if(productIndex==0){
                // if the productId is not indexed (default is 0) 
                productsTracked.productIds.push(productId);
                productsTracked.productIndex[productId]
                    =productsTracked.productIds.length;
            }
        }else{
            if(productIndex>0){
                // if product has index drop from array
                if (productsTracked.productIds.length > 1) {
                    productsTracked.productIds[productIndex-1] = 
                        productsTracked.productIds[productsTracked.productIds.length-1];
                    productsTracked.productIndex[productsTracked.productIds[productIndex-1]]=productIndex;
                }
                delete productsTracked.productIndex[productId];
                delete productsTracked.productIds[productsTracked.productIds.length-1];
            }
            // and finally delete carbonToken data 
            delete productsTracked.amount[productId];
        }
        if(productsTracked.productIds.length>0){
            // if there are productIds update trackerIds and trackerIndex    
            if(trackerIndex==0){
                // if the sourceTrackerId is not indexed (default is 0) push it to trackerIds
                trackerMappings.trackerIds.push(sourceTrackerId);
                trackerMappings.trackerIndex[sourceTrackerId]=trackerMappings.trackerIds.length;
            }
        }else{
            // if there are no tracked products drop trackerIds and trackerIndex
            if(trackerIndex>0){
                // remove sourceTrackerId from array, update indexing
                if (trackerMappings.trackerIds.length > 1) {
                    trackerMappings.trackerIds[trackerIndex-1] = 
                        trackerMappings.trackerIds[trackerMappings.trackerIds.length-1];
                    trackerMappings.trackerIndex[trackerMappings.trackerIds[trackerIndex-1]]=trackerIndex;
                }
                delete trackerMappings.trackerIndex[sourceTrackerId];
                delete trackerMappings.trackerIds[trackerMappings.trackerIds.length-1];
            }
            // and finally delete tracked products data 
            delete trackerMappings.productsTracked[sourceTrackerId];
        }
    }

    function audit(uint trackerId) 
        public notAudited(trackerId) isAuditor(trackerId) {
        _trackerData[trackerId].auditor=msg.sender;   
    }

    function removeAudit(uint trackerId) public isAuditor(trackerId){
        delete _trackerData[trackerId].auditor;
    }
    /**
     * @dev msg.sender can volunteer themselves as registered tracker or admin
     */
    function registerTracker(address tracker) selfOrAdmin(tracker) external
    {
        _setupRole(REGISTERED_TRACKER, tracker);
        emit RegisteredTracker(tracker);
    }
    /**
     * @dev change trackee of trackerId
     * @param trackerId - id of token tp be changed
    
    function changeTrackee(uint trackerId, address trackee) external 
        onlyAdmin registeredTracker(trackee) trackerExists(trackerId){
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        trackerData.trackee = trackee;
        emit TrackeeChanged(trackerId,trackee);
    }  
     */  
    /**
     * @dev approve verifier for trackee as msg.sender
     * @param verifier to be approved or removed
     * @param approve (true) or remove (false)
     */
    function approveVerifier(address verifier, bool approve) 
        external registeredTracker(msg.sender){
        require(
            net.isAuditor(verifier) || !approve,
            "CLM8::approveVerifier: address is not a registered emissions auditor"
        );
        require(verifier!=msg.sender,
            "CLM8::approveVerifier: auditor cannot be msg.sender"
        );
        isVerifierApproved[verifier][msg.sender]=approve;
        if(approve){
            emit VerifierApproved(verifier,msg.sender);
        }else{
            emit VerifierRemoved(verifier,msg.sender);
        }
    }
    /**
     * These are public view functions
     * Warning: should never be called within functions that update the network to avoid excessive gas fees
    */
    function carbonIntensity(uint trackerId /*, uint productId*/)
        public view returns (uint) {
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        //require(_numOfProducts.current()>=productId,
        //    "CLM8::_carbonIntensity: product does not exist");
        //ProductQuantities storage product = _trackerMappings[trackerId].product[productId];
        //require(product.amount>0,
        //    "CLM8::_carbonIntensity: product amount is 0");
        if(trackerData.totalProductAmounts>0){
            //"CLM8::_carbonIntensity: the total product amount is 0");
            return(getTotalEmissions(trackerId).mul(divDecimals)
            .div(trackerData.totalProductAmounts));
        }else{return(0);}
    } 

    /**
     * @dev Returns `true` if uint signature is valid
     * 
     * Note, to avoid exposing if a unit matches a signature
     * avoid sending this public funciton call to an unkown server that might store the funciton attribtues
     * (public functions are not broadcast to the EVM or blockchain network)
     */
    function verifyUnitSignature(
        uint trackerId,
        uint productId,
        string memory unit,
        bytes memory signature
    ) public view isAudited(trackerId) trackerExists(trackerId) returns (bool){   
        address signer = _productData[productId].auditor;
        bytes32 ethSignedUnitHash =
            _getUnitHash(trackerId, productId, unit).toEthSignedMessageHash();
        return ethSignedUnitHash.recover(signature)==signer;
    }
    /**
     * @dev Returns keccak256 hash of text for a trackerId and productId pair
     * This function should be called by the auditor submitting product data
     * to produce a unitHash that is signed off-chain. 
     * The signature can be provided to accounts requesting products 
     * to verify the unit associated with product amounts 
     * unit data is not stored on-chain to respect producer privacy
     */
    function _getUnitHash(
        uint trackerId,
        uint productId,        
        string memory unit
    ) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this)
            ,trackerId, productId, unit));
    }
    /**
     * @dev returns total emissions
     */
    function getTotalEmissions(uint trackerId) public view returns (uint256) {
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        CarbonTrackerMappings storage trackerMappings = _trackerMappings[trackerId];
        uint totalEmissions = _getTotalEmissions(trackerData,trackerMappings);
        return totalEmissions;
    } 
    function _getTotalEmissions(
        CarbonTrackerDetails storage trackerData,
        CarbonTrackerMappings storage trackerMappings) internal view returns (uint256) {
        uint[] storage tokenIds = trackerMappings.tokenIds;
        uint totalEmissions;
        for (uint i = 0; i < tokenIds.length; i++) {
            totalEmissions = totalEmissions.add(trackerMappings.amount[tokenIds[i]]);
        }
        uint[] memory productIds = trackerMappings.productIds;
        for (uint i = 0; i < productIds.length; i++) {
            uint productTrackerId = _productTrackerId[productIds[i]];
            if(productTrackerId!=trackerData.trackerId){
                totalEmissions = totalEmissions.add(getTotalEmissions(productTrackerId));
            }
        }
        uint[] memory trackerIds = trackerMappings.trackerIds;
        ProductsTracked storage productsTracked;
        for (uint i = 0; i < trackerIds.length; i++) {
            productsTracked = trackerMappings.productsTracked[trackerIds[i]];
            productIds = productsTracked.productIds;
            uint productAmount;
            for (uint j = 0; j < productIds.length; j++) {
                productAmount = productsTracked.amount[productIds[j]];
                totalEmissions = totalEmissions.add(
                    productAmount.mul(carbonIntensity(trackerIds[i]/*,productIds[j]*/))
                    .div(divDecimals)
                );
            }
        }
        return totalEmissions;
    }
    function getProductBalance(uint productId, uint trackerId, address owner ) public view returns (uint256) {
        return productBalance[productId][trackerId][owner];
    } 
    /**
     * @dev returns total product amounts
     */
    function getTotalProductAmounts(uint trackerId) public view returns (uint256) {
        CarbonTrackerMappings storage trackerMappings = _trackerMappings[trackerId];
        uint[] memory productIds = trackerMappings.productIds;
        uint totalProductAmounts;
        for (uint i = 0; i < productIds.length; i++) {
            totalProductAmounts = 
                totalProductAmounts.add(trackerMappings.product[productIds[i]].amount);
        }
        return totalProductAmounts;
    }        
    /**
     * @dev returns number of unique trackers
     */
    function getNumOfUniqueTrackers() public view returns (uint256) {
        return _numOfUniqueTrackers.current();
    }
    /**
     * @dev returns the details of a given trackerId
     */
    function getTrackerDetails(uint256 trackerId)
        public view
        returns (CarbonTrackerDetails memory, uint)
    {
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        CarbonTrackerMappings storage trackerMappings =  _trackerMappings[trackerId];
        uint totalEmissions = _getTotalEmissions(trackerData,trackerMappings);        
        return (trackerData,totalEmissions);
    }
    function getTrackerProductDetails(uint256 trackerId)
        public view
        returns (uint[] memory, uint[] memory, uint[] memory)
    {
        CarbonTrackerMappings storage trackerMappings =  _trackerMappings[trackerId];
        uint[] memory productIds = trackerMappings.productIds;
        uint[] memory productAmounts = new uint[](productIds.length);
        uint[] memory productAvailable = new uint[](productIds.length);
        ProductQuantities storage product;
        for (uint i = 0; i < productIds.length; i++) {
            product = trackerMappings.product[productIds[i]];
            productAmounts[i] = product.amount;
            productAvailable[i] = product.available;
        }
        return (productIds,productAmounts,productAvailable);
    }
    function getTrackerProductAddDetails(uint256 trackerId)
        public view
        returns (string[] memory, uint[] memory, string[] memory)
    {
        CarbonTrackerMappings storage trackerMappings =  _trackerMappings[trackerId];
        uint[] memory productIds = trackerMappings.productIds;
        string[] memory productNames = new string[](productIds.length);
        //uint[] memory productUnitAmounts = new uint[](productIds.length);
        string[] memory productUnits = new string[](productIds.length);
        // for converting from product amounts to physical product units
        uint[] memory productConv = new uint[](productIds.length);

        uint totalProductAmount;//total amount of products (unitless)
        for (uint i = 0; i < productIds.length; i++) {

            productNames[i] = _productData[productIds[i]].name;
            //productUnitAmounts[i] = _productData[productIds[i]].unitAmount;
            productUnits[i] = _productData[productIds[i]].unit;
            if(_productTrackerId[productIds[i]]!=trackerId){
                totalProductAmount=_trackerMappings[_productTrackerId[productIds[i]]].product[productIds[i]].amount;
            }else{
                totalProductAmount=trackerMappings.product[productIds[i]].amount;
            }
            productConv[i] = divDecimals
                //total unit amount of products
                .mul(_productData[productIds[i]].unitAmount)
                .div(totalProductAmount);
        }
        return (productNames,productConv,productUnits);
    }
    function getTrackerTokenDetails(uint256 trackerId)
        public view
        returns (uint[] memory, uint[] memory)
    {
        CarbonTrackerMappings storage trackerMappings =  _trackerMappings[trackerId];
        uint[] memory tokenIds = trackerMappings.tokenIds;
        uint[] memory tokenAmounts = new uint[](tokenIds.length);
        for (uint i = 0; i < tokenIds.length; i++) {
            tokenAmounts[i] = trackerMappings.amount[tokenIds[i]];
        }
        return (tokenIds,tokenAmounts);
    }
    /**
     * @dev returns number of unique trackers
     */
    function getNumOfProducts() public view returns (uint256) {
        return _numOfProducts.current();
    }
    function getTrackerIds(uint trackerId) public view returns(uint[] memory) {
        return (_trackerMappings[trackerId].trackerIds);
    }
    function getTokenIds(uint trackerId) 
        public view returns(uint[] memory) {
        return ( _trackerMappings[trackerId].tokenIds);
    }
    function getTokenAmounts(uint trackerId) 
        public view returns(uint[] memory,uint[] memory) {
        CarbonTrackerMappings storage trackerMappings = _trackerMappings[trackerId];
        uint[] memory tokenIds = trackerMappings.tokenIds;
        uint[] memory tokenAmounts = new uint[](tokenIds.length);
        for (uint j = 0; j < tokenIds.length; j++) {
            tokenAmounts[j]=trackerMappings.amount[tokenIds[j]];
        }
        return (tokenIds,tokenAmounts);
    }
}