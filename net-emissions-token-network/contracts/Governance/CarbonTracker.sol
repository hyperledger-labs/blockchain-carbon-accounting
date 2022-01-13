// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../NetEmissionsTokenNetwork.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract CarbonTracker is Initializable, ERC721Upgradeable, AccessControlUpgradeable {

    using SafeMathUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    NetEmissionsTokenNetwork net;

    // Registered Tracker
    bytes32 public constant REGISTERED_TRACKER =
        keccak256("REGISTERED_TRACKER");
    /**
     * @dev tracker struct for incoming/ outgoing carbon tokens of the tracker
     * tokenIds - array of ids of carbon tokens (direct/indirect/offsets)
     * idIndex - mapping tokenId to its index in array. 1st index is 1, 0 reserved for unindexed
     * inAmount - mapping tokenId to incoming (burnt) amount
     * outAmount - mapping tokenId to outgoing amounts
    **/
    struct CarbonTokens{
        uint256[] tokenIds;
        mapping(uint => uint) idIndex; 
        mapping(uint => uint) inAmount;
        mapping(uint => uint) outAmount;
    }
    /**
     * @dev tracker details
     * trackee - address of the account the tracking will apply to
     * auditor -
     * totalEmissions - total amount of carbon in
     * totalAudited - total audited outgoing emission certificates
     * trackerIds - arrays of tracker ids
     * trackerIndex - mapping sourceTrackerId to index in array. 1st index is 1, 0 reserved for unindexed.
     * carbonTokens -  mapping sourceTrackerId (0 for none) to current CarbonTokens input/outputs. 
     * totalOut - mapping tokenId to total Carbon output amounts tracked
     * totalTracked - mapping tokenId for aggregate carbon (token type 4) tracked to other tracker ids
    **/
    struct CarbonTrackerDetails {
        //uint trackerId;
        address trackee;    
        address auditor;    
        uint256 totalEmissions;
        uint256 totalAudited;
        uint256[] trackerIds;
        mapping(uint256 => uint256) trackerIndex;
        mapping(uint256 => CarbonTokens) carbonTokens;
        mapping(uint256 => uint256) totalOut;
        mapping(uint256 => uint256) totalTracked;
    }

    mapping(uint => CarbonTrackerDetails) public _trackerData;
    CountersUpgradeable.Counter private _numOfUniqueTrackers;

    // retired balances of tokenId tracked to address trackee
    mapping(uint => mapping(address => uint)) private _retiredBalances; 
    // transferredBalances balances of tokenId tracked to address trackee
    mapping(uint => mapping(address => uint)) private _transferredBalances; 
    // map audited emission token to a trackerId 
    mapping(uint => uint) public auditedTrackerId;
    // map offset credit token to a trackerId 
    mapping(uint => uint) public offsetTrackerId;

    // map auditor to trackee
    mapping(address => mapping (address => bool)) isAuditorApproved;

    event RegisteredTracker(address indexed account);
    event TrackerUpdated(
        uint256 indexed trackerId,
        address indexed tracker,
        uint256[] tokenIds,
        uint256[] inAmounts,
        uint256[] outAmounts,
        uint256[] trackerIds);
    event TrackeeChanged(uint indexed trackerId, address indexed trackee);
    event AuditorApproved(address indexed auditor,address indexed trackee);
    event AuditorRemoved(address indexed auditor,address indexed trackee);
    event VerifiedTransfer(uint indexed tokenId,address indexed trackee,uint amount );

    function initialize(address _net, address _admin) public initializer {
        net = NetEmissionsTokenNetwork(_net);
        __ERC721_init('NET Carbon Tracker', "NETT");
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(REGISTERED_TRACKER, _admin);
    }  
    modifier notAudited(uint trackerId){
        _notAudited(trackerId);
        _;
    }
    function _notAudited(uint trackerId) view internal {
        require(_trackerData[trackerId].auditor==address(0),
            "CLM8::notAudited: trackerId is already audited"
        );
    }
    modifier isAuditor(uint trackerId){
        _isAuditor(trackerId);
        _;
    }
    function _isAuditor(uint trackerId) view internal{
        require(isAuditorApproved[msg.sender][_trackerData[trackerId].trackee],
            "CLM8::isAuditor: auditor is not approved by the trackee");
    }
    modifier trackerTokenkExists(uint256 tokenId){
        require(_numOfUniqueTrackers.current() >= tokenId,
            "CLM8::trackerTokenkExists: tracker token ID does not exist");
        _;
    }
    modifier registeredTracker(address trackee){
        require(hasRole(REGISTERED_TRACKER, trackee),
            "CLM8::registeredTracker: the address is not registered");
        _;
    }
    modifier onlyAdmin() {         
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CLM8::onlyAdmin: msg.sender is not an admin");
        _;
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
        override(ERC721Upgradeable,AccessControlUpgradeable) returns (bool) {
        return interfaceId == type(IAccessControlUpgradeable).interfaceId || super.supportsInterface(interfaceId);
    }
    /**
     * @dev create a tracker Token for trackee. Note _track will check that msg.sender is either the trackee, or is an approved auditor of the trackee (see isAuditorApproved[][] mapping)
     * @param trackee - target adress to be tracked
     * @param tokenIds - array of ids of tracked carbon tokens (direct/indirect/offsets)
     * @param inAmounts - array of incoming token id amounts (direct/indirect/offsets) matching each carbon token
     * @param outAmounts - array of outgoing token id amounts (direct/indirect emissions) matching each carbon token
     * @param trackerIds - array of trackerIds matching each tokenID for tracing embodied emissions 
     */
    function track(
        address trackee,
        uint256[] memory tokenIds,
        uint256[] memory inAmounts,
        uint256[] memory outAmounts,
        uint256[] memory trackerIds) 
        public {
        // increment trackerId
        _numOfUniqueTrackers.increment();
        uint256 trackerId = _numOfUniqueTrackers.current();
        _notAudited(trackerId);

        // create token details
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        trackerData.trackee = trackee;
        _track(trackerId,tokenIds,inAmounts,outAmounts,trackerIds);
        super._mint(msg.sender,trackerId);
    }
    /**
     * @dev update a tracker Token 
     * @param trackerId of the token
     * see tracker() function for description of other inputs
    **/ 
    function trackUpdate(
        uint trackerId,
        uint256[] memory tokenIds,
        uint256[] memory inAmounts,
        uint256[] memory outAmounts,
        uint[] memory trackerIds) public 
        notAudited(trackerId) trackerTokenkExists(trackerId) {
        _track(trackerId,tokenIds,inAmounts,outAmounts,trackerIds);
    }
    /**
     * @dev internal track operations used by track() and trackUpdate()
     * see trackerUpdate() for description of other inputs
    **/ 
    function _track(
        uint256 trackerId,
        uint256[] memory tokenIds,
        uint256[] memory inAmounts,
        uint256[] memory outAmounts,
        uint256[] memory trackerIds) internal 
        {
        require(inAmounts.length == tokenIds.length, 
            "CLM8::_track: inAmounts and tokenIds are not the same length"); 
        require(outAmounts.length == tokenIds.length, 
            "CLM8::_track: outAmounts and tokenIds are not the same length");
        require(trackerIds.length == tokenIds.length, 
            "CLM8::_track: trackerIds and tokenIds are not the same length");
        // create token details
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        
        uint256 sourceTrackerId = trackerIds[0];
        CarbonTokens storage carbonTokens = trackerData.carbonTokens[sourceTrackerId];

        require(
            ( msg.sender == trackerData.trackee &&          
              hasRole(REGISTERED_TRACKER, trackerData.trackee)) ||
            (   net.isAuditor(msg.sender) &&
                isAuditorApproved[msg.sender][trackerData.trackee]),
            "CLM8::_track: msg.sender is not the registered trackee or an approved auditor"
        );
        uint8 tokenTypeId;
        for (uint i = 0; i < tokenIds.length; i++) { 
            tokenTypeId = net.getTokenTypeId(tokenIds[i]);
            if(i>0){
                 // get the data for the next tracker id if different
                if(trackerIds[i]!=trackerIds[i-1]){
                    sourceTrackerId = trackerIds[i];
                    carbonTokens = trackerData.carbonTokens[sourceTrackerId];
                }   
            }
            // verify retired emissions and set total emissions
            trackerData.totalEmissions = _verifyRetired(tokenIds[i], 
                trackerData.trackee, trackerData.totalEmissions,
                tokenTypeId, carbonTokens.inAmount[tokenIds[i]], inAmounts[i]);
            if(tokenTypeId==4){
                // asign trackerIds only for tokenTypeId==4             
                if(sourceTrackerId>0){ 
                    _updateTrackerSource(carbonTokens,
                        sourceTrackerId,tokenIds[i],inAmounts[i],outAmounts[i]);
                }
                trackerData.totalOut[tokenIds[i]] = _verifyTransferred(
                    trackerData.totalOut[tokenIds[i]], trackerData.trackee, 
                    tokenIds[i], carbonTokens.outAmount[tokenIds[i]],outAmounts[i]); 

                _verifyTotalTracked(trackerData.totalOut[tokenIds[i]],
                    trackerData.totalTracked[tokenIds[i]]); 
                // TO-DO how to prevent/resolve inconsistencies if attempting to
                // reduce tokenId totalOut after totalTracker has been increased?
            }else{
                // the following operations are for handing audited emissions and offset outputs
                if(sourceTrackerId>0){
                    // if user supplies a non-zero trackerId to this tokenId override
                    sourceTrackerId = 0;
                    // TO-DO: introduce a revert error (or event) to inform the user?
                    // sourceTrackerIds can only be assigned to tokenTypeId=4
                    // outgoing audited emission tokens are mapped using auditedTrackerIds 
                    // outoging offset tokens are mapped using offsetTrackerId
                }
                if(tokenTypeId==3){
                    if(isAuditorApproved[msg.sender][trackerData.trackee]){
                        //_isAuditor(trackerId);
                        // only auditor can assign audited emissions as outgoing carbon token
                        // TO-DO use trackerId and associated tx hahses as inputs for the Fabric
                        // emissions auditing channel
                        // In addition to issuing a retired audited emisison token to issuee
                        // the audited emission are tied to a the trackerId (asigned to auditor) as outgoing emssions
                        // TO-DO If the issuee is an industry that has volunteered to be tracked by the auditor
                        // a new trackerId could be issued with the audited emissions as an input
    
                        if(carbonTokens.outAmount[tokenIds[i]]>0){
                            trackerData.totalAudited = trackerData.totalAudited
                                .sub(carbonTokens.outAmount[tokenIds[i]]);
                        }
                        if(outAmounts[i]>0){
                            trackerData.totalAudited = 
                                trackerData.totalAudited.add(outAmounts[i]);
                            auditedTrackerId[tokenIds[i]]=trackerId;        
                        }else{
                            // if removing the outAmount delete the tracker mapping.
                            delete auditedTrackerId[tokenIds[i]];
                        }
                    }else{
                        // override outAmount to equal value already set by auditor
                        // TO-DO: introduce a revert error (or event) to inform the user?
                        outAmounts[i]=carbonTokens.outAmount[tokenIds[i]];
                    }
                }else if(tokenTypeId==2){
                    //To Do, set tracking data for offset credits
                }
            }   
            _updateTokenAmounts(carbonTokens,tokenIds[i],inAmounts[i],outAmounts[i]);

            if(i==tokenIds.length-1 || sourceTrackerId!=trackerIds[i+1]){
                // before moving to the next tracker Id update the trackerIds array
                _updateTrackerId(sourceTrackerId, trackerData, 
                    carbonTokens.tokenIds.length);
            }
        }
        require(trackerData.totalEmissions>=trackerData.totalAudited,
            "CLM8::_track: total audited emission out is greater than total emissions tracked");  
        emit TrackerUpdated(trackerId,msg.sender,
            tokenIds,inAmounts,outAmounts,trackerIds);
    } 
    /**
     * @dev verify and set data for carbon tokenId (tokenTypeId=4) linked to another trackerId
     * TO-DO can the owner of sourceTrackerId authorize who is tracking to it?
     * Note the tracker must have received and burnt/retired (_verifyRetired) 
     * the same amount of carbon tokens. Is this enought to authorize who can reference sourceTrackerId 
     * @param carbonTokens of active trackerId
     * @param sourceTrackerId to update
     * @param tokenId being tracked
     * @param inAmount of tokenId
     * @param outAmount of tokenId
    **/ 
    function _updateTrackerSource(CarbonTokens storage carbonTokens, 
        uint256 sourceTrackerId, uint256 tokenId, 
        uint256 inAmount, uint256 outAmount) internal {
        // correct for previous amount assigned to the tokenId
        CarbonTrackerDetails storage sourceTracker = _trackerData[sourceTrackerId];
        if(carbonTokens.inAmount[tokenId]!=inAmount){
            if(carbonTokens.inAmount[tokenId]>0){
                sourceTracker.totalTracked[tokenId] = sourceTracker.totalTracked[tokenId]
                    .sub(carbonTokens.inAmount[tokenId]);
            }
            if(inAmount>0){
                sourceTracker.totalTracked[tokenId] = 
                    sourceTracker.totalTracked[tokenId].add(inAmount);
            }
        }
        if(carbonTokens.outAmount[tokenId]!=outAmount){
            if(carbonTokens.outAmount[tokenId]>0){
                sourceTracker.totalTracked[tokenId] = sourceTracker.totalTracked[tokenId]
                   .sub(carbonTokens.outAmount[tokenId]);
                }
            if(outAmount>0){
                sourceTracker.totalTracked[tokenId] = 
                    sourceTracker.totalTracked[tokenId].add(outAmount);
            }
        }
        _verifyTotalTracked(sourceTracker.totalOut[tokenId],
            sourceTracker.totalTracked[tokenId]);
    }
    /**
     * @dev update the token data within the Tacker
     * @param _tokenData to be updated 
     * @param tokenId to be added/removed/modified in _tokenData
     * @param inAmount - amount of input tokenId
     * @param outAmount - amount of output tokenId
    **/
    function _updateTokenAmounts(CarbonTokens storage _tokenData, 
        uint tokenId,uint inAmount,uint outAmount) internal {
        uint index = _tokenData.idIndex[tokenId];
        if(inAmount>0 || outAmount>0){
            // if the final amount is not zero check if the tokenId should be
            // added to the tokenIds array and update idAmount
            if(index==0){
                _tokenData.tokenIds.push(tokenId);
                _tokenData.idIndex[tokenId]=_tokenData.tokenIds.length;
            }
            _tokenData.inAmount[tokenId] = inAmount;
            _tokenData.outAmount[tokenId] = outAmount;  
        }else{
            // remove tokenId and associated data from tracker
            if (_tokenData.tokenIds.length > 1) {
                _tokenData.tokenIds[index-1] = 
                    _tokenData.tokenIds[_tokenData.tokenIds.length-1];
                _tokenData.idIndex[_tokenData.tokenIds[index-1]]=index;
            }
            // index of tokenId should be deleted;
            delete _tokenData.idIndex[tokenId];
            delete _tokenData.inAmount[tokenId];
            delete _tokenData.outAmount[tokenId];
            //delete _tokenData.idAudit[tokenId]
            delete _tokenData.tokenIds[_tokenData.tokenIds.length-1];
        }
    }
    /**
     * @dev update the token data within the Tacker
     * @param trackerData to be modified with trackerId
     * @param tokenIdsLength number of tokenIds mapped to a trackerId
    **/
    function _updateTrackerId(uint256 trackerId,
        CarbonTrackerDetails storage trackerData, uint256 tokenIdsLength) internal  {
        uint index = trackerData.trackerIndex[trackerId];
        if(tokenIdsLength>0){
            // if there are tracked tokenIds    
            if(trackerId>0 && index==0){
                // if the trackerId is not indexed (default is 0) 
                trackerData.trackerIds.push(trackerId);
                trackerData.trackerIndex[trackerId]
                    =trackerData.trackerIds.length;
            }
        }else{
            if(trackerId>0 && index>0){
                // if there are no tracked tokens (removed from tracker)
                // remove any non-zero trackerId from array, update indexing
                if (trackerData.trackerIds.length > 1) {
                    trackerData.trackerIds[index-1] = 
                        trackerData.trackerIds[trackerData.trackerIds.length-1];
                    trackerData.trackerIndex[trackerData.trackerIds[index-1]]=index;
                }
                delete trackerData.trackerIndex[trackerId];
                delete trackerData.trackerIds[trackerData.trackerIds.length-1];
            }
            // and finally delete carbonToken data if 
            delete trackerData.carbonTokens[trackerId];
        }
    }
    /**
     * @dev verify the amount of tokenId tracked as retired 
     * @param trackee for the tokenId 
     * @param tokenTypeId of the token being retired
     * @param amountOld previous amount retired
     * @param amountNew current amount to be retired
     * @param total amount of emission retired for this token Id. Also the @returns
    **/
    function _verifyRetired(uint tokenId, address trackee, uint total, 
        uint8 tokenTypeId, uint amountOld, uint amountNew) internal returns(uint) {
        if(amountOld!=amountNew){
            //adjust existing _retiredBalances
            _retiredBalances[tokenId][trackee]
                 =_retiredBalances[tokenId][trackee].sub(amountOld);
            if(tokenTypeId>2){
                total = total.sub(amountOld);
            }else if(tokenTypeId==2){
                total = total.add(amountOld);
            }// REC does not change the total emissions
        }
        if(amountNew>0){
            _retiredBalances[tokenId][trackee]=
                _retiredBalances[tokenId][trackee].add(amountNew);
            if(tokenTypeId>2){ //add in emission
                total = total.add(amountNew);
            }else if(tokenTypeId==2){ //subtract out offset
                total = total.sub(amountNew);
                // TO-DO: custom error message?
            }// else REC does not change the total emissions
            require(
                net.getRetiredBalances(tokenId,trackee) >= _retiredBalances[tokenId][trackee], 
                "CLM8::_verifyRetired: the retired balance exceeds what has been reported in NET"
            );
        }
        return total;
    }
    /**
     * @dev verify amount of tokenId listed as transferred (output)
     * @param tokenId being transfered
     * @param trackee transferring tokenId
     * @param amountOld previous balance listed transferred
     * @param amountNew current amount to listed as transferred
    **/
    function _verifyTransferred(uint totalOut, address trackee, uint tokenId, 
        uint amountOld, uint amountNew) internal returns (uint256) {
        if(amountOld!=amountNew && amountOld>0){
            //adjust existing _transferredBalances for tokenTypeId 4
            _transferredBalances[tokenId][trackee]
                =_transferredBalances[tokenId][trackee].sub(amountOld);
            totalOut = totalOut.sub(amountOld); 
        }
        if(amountNew>0){
            _transferredBalances[tokenId][trackee]
                =_transferredBalances[tokenId][trackee].add(amountNew);
            totalOut = totalOut.add(amountNew); 
            require(
                net.getTransferredBalances(tokenId,trackee) >= _transferredBalances[tokenId][trackee], 
                "CLM8::_verifyTransferred: the transferred balance exceeds what has been reported in NET"
            );
            emit VerifiedTransfer(tokenId,trackee,amountNew);
        }
        return totalOut;
    }

    function audit(uint trackerId) 
        public notAudited(trackerId) isAuditor(trackerId){
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
     */
    function changeTrackee(uint trackerId, address trackee) external 
        onlyAdmin registeredTracker(trackee) trackerTokenkExists(trackerId){
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        trackerData.trackee = trackee;
        emit TrackeeChanged(trackerId,trackee);
    }    
    /**
     * @dev approve auditor for trackee as msg.sender
     * @param auditor to be approved or removed
     * @param approve approve (true) or remove (false)
     */
    function approveAuditor(address auditor,bool approve) 
        external {
        require(
            net.isAuditor(auditor) || !approve,
            "CLM8::approveAuditor: address is not a registered emissions auditor"
        );
        require(auditor!=msg.sender,
            "CLM8::approveAuditor: auditor cannot be msg.sender"
        );
        isAuditorApproved[auditor][msg.sender]=approve;
        if(approve){
            emit AuditorApproved(auditor,msg.sender);
        }else{
            emit AuditorRemoved(auditor,msg.sender);
        }
    }
    /**
     * The are public view functions
     * Warning: should never be called within functions that update the network to avoid excessive gas fees
    */
    /**
     * @dev measure the carbon intensity of a tracker NFT. 
     *      This is a recursive function that cycle through all previous trackerIds
     * @param trackerId to measure
     * @param audited measure carbonIntensity of outgoing audited emission certificates or transfered carbon tracker token 
    */
    function carbonIntensity(uint trackerId, bool audited) 
        public view returns (uint) {
        uint decimals = 1000000; // decimals used to calculate the final intensity metric (i.e., divide integer by this amount)
        
        if(trackerId==0){if(audited){return decimals;}else{return 0;}}
        // the carbon intensity of:
        //      - untracked audited emission certificate inputs = 1 (scaled by decimals)
        //      - untracked burnt carbon tracker token inputs = 0
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        uint256 total;//= trackerData.totalEmissions;
        uint outEmbedded; // embedded emissions associated with all outgoing CarbonTracker token amounts
        uint denominator; // of the carbon intensity metric
        uint8 tokenTypeId;
        uint inAmount;
        uint outAmount;
        uint ci; 
        trackerId = 0; 
        // start by calculating carbon intensity for tokenIds mapped to the 
        // default trackerId 0 (no trackerId assigned).
        CarbonTokens storage carbonTokens = trackerData.carbonTokens[trackerId];
        for(uint i = 0; i <= trackerData.trackerIds.length; i++){
            // trackerId and carbonTokens updated at the end of loop
            for (uint j = 0; j < carbonTokens.tokenIds.length; j++) {
                /*if(trackerId>0){
                    //There is no need to verifyTotalTracked. This is done in 
                    //this is currenlty handled in _track() function afer
                    _verifyTotalTracked(
                        _trackerData[trackerId].carbonTokens.outAmount[tokenId],
                        _trackerData[trackerId].totalTracked[tokenId]);
                } */
                tokenTypeId = net.getTokenTypeId(carbonTokens.tokenIds[j]);
                inAmount = carbonTokens.inAmount[carbonTokens.tokenIds[j]]
                    .mul(decimals);
                outAmount = carbonTokens.outAmount[carbonTokens.tokenIds[j]]
                    .mul(decimals);
                if(tokenTypeId==4){
                    ci = carbonIntensity(trackerId,false);
                    total = total.add(inAmount);
                    outEmbedded=outEmbedded.add(outAmount.mul(ci).div(decimals));
                    denominator = denominator.add(
                        carbonTokens.outAmount[carbonTokens.tokenIds[j]]);
                }else if(tokenTypeId==3){
                    if(outAmount==0){
                        ci = carbonIntensity(auditedTrackerId[carbonTokens.tokenIds[j]],true);
                    }else{
                        // audited emissions out will always point back to the the tracker id
                        // set ci to 1, otherwise will enter recursive loop.
                        ci = decimals;
                    }
                }else if(tokenTypeId==2){
                    // TO-DO setup how we handle offset tokens
                    ci = carbonIntensity(offsetTrackerId[carbonTokens.tokenIds[j]],false);
                    total = total.sub(inAmount);
                }
                total = total.add(inAmount.mul(ci).div(decimals));              
            }
            if(i<trackerData.trackerIds.length){
                trackerId = trackerData.trackerIds[i];
                carbonTokens = trackerData.carbonTokens[trackerId];
            }
        }
        if(audited){
            return total.div(trackerData.totalEmissions);

        }else{
            if(denominator==0){
                // If  no outgoing carbon transfers the denominator is by 
                // default the total emissions reported
                denominator = trackerData.totalEmissions;
            }
            total = total.add(outEmbedded).sub(
                trackerData.totalAudited.mul(total.div(trackerData.totalEmissions))
            );
            // subtract out the total embodied emission tied to outgoing 
            // audited emission certificates
            // TO-DO: GAMING OPPORTUNITY
            // auditor could be paid to issue fake emission certificats on tracker
            // to reduce the reportec carbon intensity rating of outgoing carbon tracker tokens
            return(total.div(denominator));
        }   
    }
    function getTrackerIds(uint trackerId) public view returns(uint[] memory) {
        return (_trackerData[trackerId].trackerIds);
    }
    function getTokenIds(uint trackerId, uint sourceTrackerId) 
        public view returns(uint[] memory, uint) {
        return ( _trackerData[trackerId].carbonTokens[sourceTrackerId].tokenIds,
                 _trackerData[trackerId].trackerIndex[sourceTrackerId]);
    }
    function getTokenIdOut(uint trackerId, uint tokenId) 
        public view returns(uint, uint) {
        return ( _trackerData[trackerId].totalOut[tokenId],
                 _trackerData[trackerId].totalTracked[tokenId]);
    }
    function getTokenIdAmounts(uint trackerId, uint sourceTrackerId, uint tokenId) 
        public view returns(uint, uint, uint){
            CarbonTokens storage carbonTokens = 
                _trackerData[trackerId].carbonTokens[sourceTrackerId];
            return( carbonTokens.inAmount[tokenId],
                    carbonTokens.outAmount[tokenId],
                    carbonTokens.idIndex[tokenId]);
        }
    function getTokenAmounts(uint trackerId, uint sourceTrackerId) 
        public view returns(uint[] memory, uint[] memory) {
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        CarbonTokens storage carbonTokens;
        carbonTokens = trackerData.carbonTokens[sourceTrackerId];
        uint[] memory tokenIds = carbonTokens.tokenIds;
        uint[] memory inAmounts = new uint[](tokenIds.length);
        uint[] memory outAmounts = new uint[](tokenIds.length);
        for (uint j = 0; j < tokenIds.length; j++) {
            inAmounts[j]=carbonTokens.inAmount[tokenIds[j]];
            outAmounts[j]=carbonTokens.outAmount[tokenIds[j]];
        }
        return (inAmounts,outAmounts);
    }
}