// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";
//import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./NetEmissionsTokenNetwork.sol";
import { TxVerifier } from "./Libraries/TxVerifier.sol";
import { ArrayModifier } from "./Libraries/ArrayModifier.sol";
import { Tracker } from "./Libraries/Tracker.sol";
/**

CarbonTracker is a contract used to transfer embedded emissions of products in a supply chain.  
See https://wiki.hyperledger.org/display/CASIG/2022-09-12+Peer+Programming+Call
Key concepts are:
 - Product is something that has embedded emissions.  
   Oil and natural gas, plastics, electricity, square feet of office, etc ...  
 - CarbonTracker tokens reference Products and tokens from the NET network,
   These represent product specific emission certificates for industry 
 - Products have various attribtutes
    - normalized amounts that assign a weighted distribution of the 
      CarbonTracker emissions to each product. Could be normalize energy 
      content, e.g., BOE (barrels of oil equivalent), if emissions are 
      allocated propotional to energy content of products, or unitless.
    - Arrays of units and unit amounts used to store specific attributes.  
      For example gallons for oil and cubic feet of natural gas.    
 - Trackee is the registered entitity that the tracker is issued for. 
   E.g., a natural gas utility.

Workflow of the token:
 - Auditors registered with NET issue CarbtonTracker tokens
 - track() to create, or trackUpdate() to update an existing, tracker
    - these functions assign NETs to the tracker
 - issueProduct() for auditors to assign unique product amounts to a tracker
 - issue() to mark a tracker as Audited 
    - approve an industry emission certificate
    - allow its products to be transfered to other accounts
 - transferProducts() to another trackee, customer, auditor, ...
    - The entire audited CarbonTracker can also be transffered, 
      e.g., to an emission certificate dealer, investor, ...
 - trackProduct() track a previously issued product to a new tracker ID.
    - This funciton enables tracking accross product supply chains 
 - getTotalEmissions() - calculate the total emissions of the CarbonTracker 
     -based on its emissions network tokens
 - create to create another tracker, for example by the customer for its product.  For example, it could be plastics or office space.
 - transferProductToTracker - transfer some of the original product to the new tracker.  For example, transfer cubic feet of natural gas to plastics or office space.
   This transfers the emissions through the supply chain from one product to another.

**/

contract CarbonTracker is ERC1155, AccessControl, ERC1155Holder {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    using TxVerifier for bytes32;
    //using TxVerifier for bytes;
    using TxVerifier for address;
    //using TxVerifier for uint32;
    //using TxVerifier for uint256;
    using TxVerifier for bool;

    using ArrayModifier for uint256;
    using ArrayModifier for uint256[];
    using ArrayModifier for mapping(uint256 => uint256)
    ;
    using Tracker for uint256;
    //using Tracker for uint256[];
    using Tracker for Tracker.NetTotals;
    using Tracker for mapping(uint256 => uint256)
    ;
    using Tracker for mapping(uint256 => Tracker.CarbonTrackerMappings);
    
    address public netAddress;
    NetEmissionsTokenNetwork public net;
    

    /**
     * @dev Structure of all tokens issued in this contract
     * tokenId - Auto-increments whenever new tokens are issued
     * tokenTypeId - Corresponds to the two token types:
     *   1 => Tracker Token : NFT that map to list of TokenIds (NET) and ProductIds (CarbonTracker)
     *   2 => Product Token : Fungible tokens issued to each trackerId
     * sourceId - id of the source tracker or product token details
     * issuedBy - Address of transaction runner
     * issuedFrom - Address of dealer issuing this token
     * metadata - information stored about the product (e.g., unit information, source location, production dates )
     * manifest - source information about the product
     * description - high level description about the product (e.g., name)
     */
    struct TokenDetails {
        uint256 tokenId;
        uint8 tokenTypeId;
        uint256 sourceId;
        address issuedBy;
        address issuedFrom;
        string metadata;
        string manifest;
        //string description;
    }

    mapping(uint256 => TokenDetails) public _tokenDetails;
    //mapping(uint256 => mapping(address => uint256)) public _retiredBalances;

    /**
     * @dev ProductDetails
     * tokenId corresponding ERC1155 token ID
     * trackerId that this product belongs to
     * amount of the product. used as a weighted amount (weight = amount/_trackerData.totalProductAmounts) to distribute a trackers total emissions across multiple products 
     * available amount of product remaining for transfer   
     **/
    struct ProductDetails {
        uint256 tokenId;
        uint256 productId;
        uint256 trackerId;
        uint256 issued;
        uint256 available;
    }

    mapping(uint256 => Tracker.CarbonTrackerDetails) private _trackerData; 
    //mapping(uint256 => uint256) private _totalProductAmounts; 
    mapping(uint256 => Tracker.CarbonTrackerMappings) private _trackerMappings;
    mapping(uint256 => ProductDetails) public _productData;

    // Counts number of unique token IDs (auto-incrementing)
    Counters.Counter private _numOfUniqueTokens;
    Counters.Counter private _numOfUniqueTrackers;
    Counters.Counter private _numOfUniqueProducts;

    mapping(uint256 => uint256) private _lockedNET; //amount of tokenId locked into the contract. In most cases this is the amount of token issued to the contract address. However we allow cases where tokens are issued to contract before they are assiged to a tracker token using NET parent issue/transfer functions with to addreess set to the contract addresss. 
    //NET need to be assigned to tracker by calling track() for new , and trackUpdate() for exisitng carbon tracker.
    // WARNING if the above is not done tokens issued to the contract can be linked to any unissued trackerId of the CarbonTracker contract by and auditor.
    // The safest way to assing NET to tracker is using NET functions that call the CarbonTrackerContract, i.e,., issueAndTrack(). 

    mapping(address => mapping(address => bool)) internal isAuditorApproved;
    // map trackee to boolean enforcing isAuditorApproved in isAuditor modifier
    mapping(address => bool) internal approvedAuditorsOnly;

    mapping(address => mapping(address => uint32)) private tokenTransferNonce;

    mapping(address => bool) public approveProductTransfer;

    uint256 public decimalsCt; // decimals for distribution of shared NET within CarbonTracker contract

    event TrackerEvent(
        uint256 indexed trackerId,
        address indexed operator,
        uint256[] tokenIds,
        uint256[] tokenAmounts
    );
    /*event TrackerIssued(
        uint256 indexed trackerId,
        uint256 date
    );*/
    /*event ProductsIssued(
        uint256 indexed trackerId,
        uint256[] productIds,
        uint256[] productAmounts,
        uint256 date
    );*/
    event TransferProducts(
        address indexed sender,
        uint256[] productIds,
        uint256[] productAmounts
    );

    event VerifierApproval(address indexed auditor, address indexed trackee, bool approve, uint256 date);

    event ApproveProductTransfer(address indexed receiver, bool approve, uint256 date);

    constructor(address _net, address _admin) ERC1155("") {
        net = NetEmissionsTokenNetwork(_net);
        netAddress = _net;
        decimalsCt = 1000000;
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    modifier isAuditor(uint256 trackerId) {
        require(
            __isAuditor(_trackerData[trackerId].trackee),
            "CLM8::isAuditor: msg.sender is not an approved auditor for this trackerId"
        );
        _;
    }

    function __isAuditor(address _trackee) internal view returns (bool) {
        require(_trackee !=msg.sender, "CLM8::__isAuditor: _trackee address is the same as msg.sender");
        return (
            net.isAuditor(msg.sender) || msg.sender == netAddress) &&
            (// require isAuditorApproved?
                (approvedAuditorsOnly[_trackee] && isAuditorApproved[msg.sender][_trackee]) ||
                !approvedAuditorsOnly[_trackee] // otherwise permit any auditor
            );
    }

    function _tokenExists(uint256 tokenId) internal view {
        require(
            _tokenDetails[tokenId].tokenId!=0,
            "CLM8::_tokenExists: tokenId does not exist"
        );
    }

    modifier notIssued(uint256 trackerId) {
        _tokenExists(_trackerData[trackerId].tokenId);
        require(
            _tokenDetails[_trackerData[trackerId].tokenId].issuedBy == address(0),
            "CLM8::notIssued: trackerId has already been issued"
        );
        _;
    }

    function _isIssued(uint256 trackerId) internal view {
        require(
            _tokenDetails[_trackerData[trackerId].tokenId].issuedBy != address(0),
            "CLM8::_isIssued: trackerId is not issued"
        );
    }

    function _isOwner(uint256 trackerId) internal view {
        require(
            super.balanceOf(msg.sender, _trackerData[trackerId].tokenId) == 1,
            "CLM8::_isOwner: msg.sender does not own this trackerId"
        );
    }

    modifier isAuditorOrTrackee(uint256 trackerId) {
        require(
            __isAuditor(_trackerData[trackerId].trackee) || _trackerData[trackerId].trackee == msg.sender,
            "CLM8::_isAuditorOrTrackee: msg.sender is not the auditor or is not the assigned trackee of trackerId"
        );
        _;
    }

    modifier isIndustry(address industry) {
        require(net.isIndustry(industry),
            "CLM8::isIndustry: address must be a registered industry");
        _;
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CLM8::onlyAdmin: msg.sender is not an admin"
        );
        _;
    }

    modifier consumerOrIndustry(address _address){
        if (_address != address(0)) {
            // if not burning require sender to be consumerOrDealer
            require(
                net._consumerOrDealer(_address),
                "CLM8::consumerOrDealer: address is not a registered consumer, industry or dealer"
            );
        }
        _;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, ERC1155Receiver, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev hook before handling tokenTransfers
     * Used to prevent locked product tokens from being transfered from the contract address
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual consumerOrIndustry(to) override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        bool productTransferVerified; // only verified product transfer once
        for (uint256 i = 0; i < ids.length; i++) {
            if(_tokenDetails[ids[i]].tokenTypeId==2){ 
                if (approveProductTransfer[to] && !productTransferVerified) {
                    bytes32 messageHash = getTransferHash(from, to, ids, amounts);
                    productTransferVerified = messageHash.verifySignature(data, to);
                    require(productTransferVerified,
                        "CLM8::_beforeTokenTransfer: receiver has not approved the transaction");
                    //increment the nonce once transaction has been confirmed
                    tokenTransferNonce[from][to]++;
                }
            }
            //if(to==address(0)){_retiredBalances[ids[i]][from]=amounts[i];}
        }
    }

    /**
     * @dev initialize a tracker Token for trackee. Any address can initilize a tracker. However, only auditors can initialize a tracker with emission tokens
     * @param trackee - address of the registered industry of the trackee
     * @param netIds - array of ids of tracked tokens from NET (direct/indirect/offsets)
     * @param netAmounts - array of incoming token id amounts (direct/indirect/offsets) matching each carbon token
     * @param metadata - information about the tracker
     * @param manifest - info about the origin of the tracker (e.g. source file)
     * param description - about the tracker
     */
    function track(
        address trackee,
        uint256[] memory netIds,
        uint256[] memory netAmounts,
        string memory metadata,
        string memory manifest
        //,string memory description
    ) public 
        isIndustry(trackee) // limit new tracker to industry addresses
    {
        _numOfUniqueTrackers.increment();
        // create tracker details
        uint trackerId = _numOfUniqueTrackers.current();
        _trackerData[trackerId].trackerId = trackerId;
        _trackerData[trackerId].trackee = trackee;

        // issue token for tracker (NFT) but do not mint 
        _issue(
            address(0), //do not set issued address until token is minted
            msg.sender,
            trackee,
            1, //tokenTypeId 
            0, //tokenAmount set to 0. Only mint this in final issue() function
            trackerId,
            metadata,
            manifest
            //,description
        );
        _trackerData[trackerId].tokenId = _numOfUniqueTokens.current();

        // add tokens if provided
        if (netIds.length > 0) {
            return _trackTokens(trackerId, netIds, netAmounts);
        }else{
            emit TrackerEvent(
                trackerId,
                msg.sender,
                netIds,
                netAmounts
            );
        }
    }

    /**
     * @dev update a tracker Token
     * @param trackerId of the token
     * see tracker() function for description of other inputs
     **/
    function trackUpdate(
        uint256 trackerId ,
        uint256[] memory netIds,
        uint256[] memory netAmounts,
        string memory metadata,
        string memory manifest
        //,string memory description
    ) public notIssued(trackerId) {

        if (bytes(metadata).length > 0) {
            _tokenDetails[_trackerData[trackerId].tokenId].metadata = metadata;
        }
        if (bytes(manifest).length > 0) {
            _tokenDetails[_trackerData[trackerId].tokenId].manifest = manifest;
        }
        /*if (bytes(description).length > 0) {
            _tokenDetails[_trackerData[trackerId].tokenId].description = description;
        }*/
        _trackTokens(trackerId, netIds, netAmounts);
    }

    /**
     * @dev updated token data assinged to tracker
     * used by track() and trackerUpdate()
     **/
    function _trackTokens(
        uint256 trackerId,
        uint256[] memory tokenIds,
        uint256[] memory tokenAmounts
    ) internal isAuditor(_trackerData[trackerId].trackerId){
        require(
            tokenAmounts.length == tokenIds.length,
            "CLM8::_trackTokens: tokenAmounts and tokenIds are not the same length"
        );
        // create trcker Mappings to store tokens (and product) info
        Tracker.CarbonTrackerMappings storage trackerMappings = _trackerMappings[
            _trackerData[trackerId].trackerId
        ];

        for (uint256 i = 0; i < tokenIds.length; i++) {
            // get available and retired token balances issued to the trackerAddress.
            (uint256 available, uint256 retired ) = net.getAvailableAndRetired(
                address(this),tokenIds[i]
            );

            uint8 tokenTypeId = net.getTokenTypeId(tokenIds[i]);
            uint256 balance;

            if(tokenTypeId == 3){
                // if AEC use retired amount
                balance = retired;
            }else{
                // otherwise balance is what is available to the contract
                balance = available;
            }

            // subtract previous token amount locked to contract
            _lockedNET[tokenIds[i]] = _lockedNET[tokenIds[i]].sub(trackerMappings.amount[tokenIds[i]]);
            
            require( msg.sender == netAddress || balance.sub(_lockedNET[tokenIds[i]]) >= tokenAmounts[i],
                "CLM8::_trackTokens: one of the tokenAmounts is greater than the balance of the tracker contract"
            );

            _lockedNET[tokenIds[i]] = _lockedNET[tokenIds[i]].add(tokenAmounts[i]);

            tokenIds[i].updateIndexAndAmount(tokenAmounts[i],trackerMappings.tokenIds,trackerMappings.idIndex,trackerMappings.amount);
        }
        emit TrackerEvent(
            trackerId,
            msg.sender,
            tokenIds,
            tokenAmounts
        );
    }

    /**
     * @dev add to (or update) products mapped to a trackerId.
     * @param trackerId to assign products
     * @param productAmounts - amount of products. Used for weighted distribution of emissino for multiproduct tracker
     * @param metadata - descriptive attributes like units and unitAmount if different from _productData[productId].issued
     * @param manifests - info about the origin of the issued product
     * param descriptions - description of product - e.g. name 
     **/
    function issueProducts(
        uint256 trackerId,
        uint256[] memory productIds,
        uint256[] memory productAmounts,
        string[] memory metadata,
        string[] memory manifests
        //,string[] memory descriptions
    )
        public
        notIssued(trackerId)
        isAuditor(trackerId)
    {
        //uint256[] memory productIds;
        Tracker.CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        require(
            productAmounts.length == productIds.length,
            "CLM8::issueProducts: productIds and productAmounts arrays are not the same length"
        );
        require(
            productAmounts.length == metadata.length,
            "CLM8::issueProducts: productIds and metadata arrays are not the same length"
        );  
        require(
            productAmounts.length == manifests.length,
            "CLM8::issueProducts: productIds and manifest arrays are not the same length"
        ); 
        /*require(
            productAmounts.length == descriptions.length,
            "CLM8::issueProducts: productIds and descriptions arrays are not the same length"
        );*/ 
        for (uint256 i = 0; i < productAmounts.length; i++) {
            if(productIds[i]==0){
                // create a new productId
                _numOfUniqueProducts.increment();
                productIds[i]=_numOfUniqueProducts.current();
                // issue token for products
                _issue(
                    msg.sender,
                    msg.sender,
                    address(this), // issue product Token to tracker Address
                    2, //tokenTypeId 
                    productAmounts[i], //tokenAmount for Carbon Tracker (NFT) = 1
                    productIds[i],
                    metadata[i],
                    manifests[i]
                    //,descriptions[i]
                );

                _productData[productIds[i]].tokenId = _numOfUniqueTokens.current();
                _productData[productIds[i]].productId = productIds[i];
                _productData[productIds[i]].trackerId = trackerId;
            }else{
                _tokenExists(_productData[productIds[i]].tokenId);
                require(_tokenDetails[_productData[productIds[i]].tokenId].issuedBy== msg.sender,
                    "CLM8::issueProducts: msg.sender attempt to modify productId it did not issue"
                );
                if(productAmounts[i]>_productData[productIds[i]].issued){
                    //mint more products
                    super._mint(address(this), _productData[productIds[i]].tokenId, productAmounts[i].sub(_productData[productIds[i]].issued), "");
                }else{
                    //burn excess products
                    super._burn(address(this), _productData[productIds[i]].tokenId, _productData[productIds[i]].issued.sub(productAmounts[i]));
                }
                //subtract previously stored productAmount from total.
                trackerData.totalProductAmounts = trackerData.totalProductAmounts.sub(_productData[productIds[i]].issued);

                if (bytes(metadata[i]).length > 0) {
                    _tokenDetails[_productData[productIds[i]].tokenId].metadata = metadata[i];
                }
                if (bytes(manifests[i]).length > 0) {
                    _tokenDetails[_productData[productIds[i]].tokenId].manifest = manifests[i];
                }
                /*if (bytes(descriptions[i]).length > 0) {
                    _tokenDetails[_productData[productIds[i]].tokenId].description = descriptions[i];
                }*/
            }

            //productIds[i].updateIndex(productAmounts[i],_trackerMappings[trackerId].productIds,_trackerMappings[trackerId].productIdIndex);

            _productData[productIds[i]].issued = productAmounts[i];
            _productData[productIds[i]].available = productAmounts[i];

            trackerData.totalProductAmounts = trackerData.totalProductAmounts.add(productAmounts[i]);
        }
        //emit ProductsIssued(trackerId, productIds, productAmounts, block.timestamp);
    }

    /**
     * @dev issue token
     **/
    function _issue(
        address _issuedBy,
        address _issuedFrom,
        address _issuedTo,
        uint8 _tokenTypeId,
        uint256 _quantity,
        uint256 _sourceId,
        string memory metadata,
        string memory manifest
        //,string memory description
    ) internal {

        // increment trackerId
        _numOfUniqueTokens.increment();
        uint256 tokenId = _numOfUniqueTokens.current();
        // create token details
 
        _tokenDetails[tokenId].tokenId = tokenId;
        _tokenDetails[tokenId].sourceId = _sourceId;
        _tokenDetails[tokenId].tokenTypeId = _tokenTypeId;
        _tokenDetails[tokenId].issuedBy = _issuedBy;
        _tokenDetails[tokenId].issuedFrom = _issuedFrom;
        _tokenDetails[tokenId].metadata = metadata;
        _tokenDetails[tokenId].manifest = manifest;
        //_tokenDetails[tokenId].description = description;

        if(_quantity>0){
            super._mint(_issuedTo, tokenId, _quantity, "");  
        }  
    }
    /**
     * @dev transfer product 
     * @param ids corresponding to TokenDetails tokenId
     * @param amounts of tokenId to transfer
     * @param to receiver's address
     **/
    function transferProducts(
        uint256[] memory ids,
        uint256[] memory amounts,
        address to,
        bytes memory data) public
    {
        uint256 productId;
        //uint256[] memory tokenIds = new uint256[](productIds.length);

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 available = _productData[_tokenDetails[ids[i]].sourceId].available;
            require(available >= amounts[i], 
                "CLM8::_beforeTokenTransfer: product amount exceeds what is available to the contract");
            //update avaiable amount of productId;
            _productData[_tokenDetails[ids[i]].sourceId].available = available.sub(amounts[i]);
            if(productId!=_tokenDetails[ids[i]].sourceId){
                productId = _tokenDetails[ids[i]].sourceId;
                _isIssued(_productData[productId].trackerId);
                _isOwner(_productData[productId].trackerId);
            }
            require(_tokenDetails[ids[i]].tokenTypeId==2,
                "CLM8::transferProducts: token is not a product");
        }
        super._safeBatchTransferFrom(address(this),to,ids,amounts,data);
        emit TransferProducts(msg.sender,ids,amounts);
    }

    /**
     * @dev track a product to an new trackerId
     * in this function the owner of trackerId, or an auditor, assigns products received from other carbon tracker tokens
     **/
    function trackProduct(
        uint256 trackerId,
        uint256 productId,
        uint256 productAmount
    ) public 
        notIssued(trackerId) 
        isAuditorOrTrackee(trackerId) 
    {
        require(trackerId != _productData[productId].trackerId,
            "CLM8::trackProduct: product's trackerId can not be the same as the trackerId"
        );

        uint256 previousProductAmount = _trackerMappings[trackerId].productsTracked[_productData[productId].trackerId].amount[productId];

        _updateTrackedProduct(trackerId, productId, productAmount);

        if(productAmount>previousProductAmount){
            // transfer more product to contract
            if(__isAuditor(_trackerData[trackerId].trackee)){  
                // approve auditor to transfer tokens for trackee
                super._setApprovalForAll(_trackerData[trackerId].trackee,msg.sender,true);
            }
            super.safeTransferFrom(_trackerData[trackerId].trackee,address(this),_productData[productId].tokenId,productAmount.sub(previousProductAmount),'');
    
            if(__isAuditor(_trackerData[trackerId].trackee)){ 
                // remove approval to transfer tokens for trackee
                super._setApprovalForAll(_trackerData[trackerId].trackee,msg.sender,false);
            }
        }else{
            //refund excess amount previously locked to contract
            super.safeTransferFrom(
                address(this),_trackerData[trackerId].trackee,_productData[productId].tokenId,previousProductAmount.sub(productAmount),'');
        }
    }

    /**
     * @dev update the product info within the Tacker
     **/
    function _updateTrackedProduct(
        uint256 trackerId,
        uint256 productId,
        uint256 productAmount
    ) internal {
        uint256 _sourceTrackerId = _productData[productId].trackerId;
        Tracker.CarbonTrackerMappings storage trackerMappings = _trackerMappings[trackerId];
        Tracker.ProductsTracked storage productsTracked = trackerMappings.productsTracked[_sourceTrackerId];

        productId.updateIndexAndAmount(productAmount,productsTracked.productIds,productsTracked.productIndex,productsTracked.amount);
        
        _sourceTrackerId.updateIndex(productsTracked.productIds.length,trackerMappings.trackerIds,trackerMappings.trackerIndex);
        if (productsTracked.productIds.length == 0){
            delete trackerMappings.productsTracked[_sourceTrackerId];
        }
    }

    /**
     * Issue the tracker token
     **/
    function issue(uint256 trackerId)
        public
        notIssued(trackerId)
        isAuditor(trackerId)
    {
        super._mint(
            _trackerData[trackerId].trackee, 
            _trackerData[trackerId].tokenId, 
            1, "");
        _tokenDetails[_trackerData[trackerId].tokenId].issuedBy = msg.sender;

        //TrackerIssued(trackerId,block.timestamp);
    }

    /**
     * @dev approve verifier for trackee as msg.sender
     * @param approve (true) or remove (false)
     */
    function setApprovedAuditorsOnly(bool approve)
        external isIndustry(msg.sender)
    { approvedAuditorsOnly[msg.sender]=approve;}

    /**
     * @dev approve verifier for trackee as msg.sender
     * @param verifier to be approved or removed
     * @param approve (true) or remove (false)
     */
    function approveVerifier(address verifier, bool approve)
        external
        isIndustry(msg.sender)
    {
        require(
            net.isAuditor(verifier) || !approve,
            "CLM8::approveVerifier: address is not a registered emissions auditor"
        );
        require(
            verifier != msg.sender,
            "CLM8::approveVerifier: auditor cannot be msg.sender"
        );
        isAuditorApproved[verifier][msg.sender] = approve;
        emit VerifierApproval(verifier, msg.sender, approve,block.timestamp);
    }
    /*
    @dev function requires receiver address to pre-approve product transfers
    @param approve bool to tollge tx verificion on or off
    */
    function setApproveProductTransfer(bool approve)
        external consumerOrIndustry(msg.sender){
        approveProductTransfer[msg.sender]=approve;
        emit ApproveProductTransfer(msg.sender, approve, block.timestamp);
    }

    /**
     * @dev Returns keccak256 hash of transaction request
     */
    function getTransferHash(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) public view returns (bytes32) {
        return
            _from._getTransferHash(_to,_ids,_amounts,
                tokenTransferNonce[_from][_to]);
    }

    /** Below are public view functions **/

    /**
     * @dev returns the details of a given trackerId
     */
    function getTrackerDetails(uint256 trackerId)
        public
        view
        returns (
            Tracker.CarbonTrackerDetails memory,
            uint256[] memory,uint256[] memory,
            Tracker.NetTotals memory
            //,uint256[] memory
        )
    {
        uint256[] memory tokenAmounts = new uint256[](_trackerMappings[trackerId].tokenIds.length);
        for (uint256 i = 0; i <_trackerMappings[trackerId].tokenIds.length; i++) {
            tokenAmounts[i] = _trackerMappings[trackerId].amount[_trackerMappings[trackerId].tokenIds[i]];
        }
        Tracker.NetTotals memory totals = trackerId._getTotalEmissions(decimalsCt, address(net), _trackerData, _trackerMappings);
        
        return (
            _trackerData[trackerId], 
            _trackerMappings[trackerId].tokenIds,
            tokenAmounts,
            totals
            //,_trackerMappings[trackerId].productIds
        );
    }

    /*function getTrackerTokenDetails(uint256 trackerId)
        public
        view
        returns (uint256[] memory, uint256[] memory)
    {
        Tracker.CarbonTrackerMappings storage trackerMappings = _trackerMappings[
            trackerId
        ];
        uint256[] memory tokenAmounts = new uint256[](trackerMappings.tokenIds.length);
        for (uint256 i = 0; i < tokenAmounts.length; i++) {
            tokenAmounts[i] = trackerMappings.amount[trackerMappings.tokenIds[i]];
        }
        return (trackerMappings.tokenIds, tokenAmounts);
    }*/

    /**
     * @dev returns number of unique trackers
     */
    function getNumOfUniqueTrackers() public view returns (uint256) {
        return _numOfUniqueTrackers.current();
    }
    /**
     * @dev returns number of unique trackers
     */
    function getNumOfUniqueProducts() public view returns (uint256) {
        return _numOfUniqueProducts.current();
    }
    /**
     * @dev returns number of unique trackers
     */
    function getNumOfUniqueTokens() public view returns (uint256) {
        return _numOfUniqueTokens.current();
    }
}
