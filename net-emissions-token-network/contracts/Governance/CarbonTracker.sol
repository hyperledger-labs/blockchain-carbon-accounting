// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;
import "../NetEmissionsTokenNetwork.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
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
     * tokenId - array of ids of carbon tokens (direct/indirect/offsets)
     * idIndex - mapping tokenId to its index in array. index starts at 1 and 0 reserved for unindexed tokens
     * idAmount - mapping tokenId to an amount
     * idAudit - address that audited this token
    **/
    struct CarbonTrackerTokens{
        uint256[] tokenIds;
        mapping(uint => uint) idIndex; 
        mapping(uint => uint) idAmount;
        // TO-DO introduce idAudit for each token?
        // TO-DO if idAudit is market true should we prevent further update?
        // TO-DO introduce audit conflict if requesting update to audited tokenId?
        // NOTE: for now we can check if tracker update was submited by auditor from
        // the TrackerUpdated event
        //mapping(uint => address) idAudit; 
    }

    /**
     * @dev tracker details
     * trackee - address of the account the tracking will apply to
     * carbonIn - token inputs (i.e. direct indirect emissions)
     * carbonOut - token outputs (i.e unrealized emission transfers or indirect emissions)
     * trackerId - mapping tokenId (in) to another trackerId for embodied emission tracing
    **/
    struct CarbonTrackerDetails {
        //uint256 trackerId;
        address trackee;    
        address auditor;    
        uint totalEmissions;
        uint totalAudited;

        CarbonTrackerTokens carbonIn;
        CarbonTrackerTokens carbonOut;
        //tokenId into previous trackerId (token type 4)
        mapping(uint => uint) trackerId;
        //tokenId into aggregate amounts tracked into other tracker tokens
        mapping(uint => uint) totalIn;

    }
    // mappings for carbon tracking data
    mapping(uint256 => CarbonTrackerDetails) private _trackerData;
    // retired balances of tokenId tracked to address trackee
    mapping(uint256 => mapping(address => uint256)) private _retiredBalances; 
    // transferredBalances balances of tokenId tracked to address trackee
    mapping(uint256 => mapping(address => uint256)) private _transferredBalances; 

    // map audited emission tokens into a trackerId 
    mapping(uint => uint) auditedTrackerId;

    // map auditor to trackee
    mapping(address => mapping (address => bool)) isAuditorApproved;

    // Counts number of unique token IDs (auto-incrementing)
    CountersUpgradeable.Counter private _numOfUniqueTrackers;

    event RegisteredTracker(address indexed account);
    event TrackerUpdated(
        uint256 indexed trackerId,
        address indexed tracker,
        uint256[] inIds,
        uint256[] inAmounts,
        uint256[] outIds,
        uint256[] outAmounts,
        uint256[] trackerIds);
    event TrackeeChanged(uint indexed trackerId, address indexed trackee);
    event AuditorApproved(address indexed auditor,address indexed trackee);
    event AuditorRemoved(address indexed auditor,address indexed trackee);


    function initialize(address _net, address _admin) public initializer {
        net = NetEmissionsTokenNetwork(_net);
        __ERC721_init('NET Carbon Tracker', "NETT");
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(REGISTERED_TRACKER, _admin);
    }  
    modifier notSender(address auditor){
        require(auditor!=msg.sender,
            "CLM8::notSender: auditor cannot be msg.sender");
        _;
    }
    /**
     * @dev msg.sender is trackee or approved auditor of trackee
     * @param trackerId - target trackerId
     */
    modifier trackerOrAuditor(uint trackerId) {
        require(
            ( msg.sender == _trackerData[trackerId].trackee &&          
              hasRole(REGISTERED_TRACKER, _trackerData[trackerId].trackee)) ||
            isAuditorApproved[msg.sender][_trackerData[trackerId].trackee],
            "CLM8::trackerOrAuditor: msg.sender must be a registered tracker or approved auditor of the trackee"
        );
        _;
    }
    modifier notAudited(uint trackerId){
        require(_trackerData[trackerId].auditor==address(0),
            "CLM8::notAudited: trackerId is already audited"
        );
        _;
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
    modifier equalLength(uint[] memory arrayOne, uint[] memory arrrayTwo){
        require(arrayOne.length == arrrayTwo.length, 
            "CLM8::_equalLength: array lengths are not equal"); 
        _;
    }
    /**
     * @dev msg.sender is trackee or approved auditor of trackee
     * @param trackee - target adress to be tracked
     * @param inIds - array of ids of incoming carbon tokens (direct/indirect/offsets)
     * @param inAmounts - array of incoming token idAmount (direct/indirect/offsets) matching each carbon token
     * @param trackerIds - array of trackerIDs matching each tokenID for tracing embodied emissions 
     * @param outIds - array of ids of outgoing carbon tokens (direct/indirect/offsets)
     * @param outAmounts - array of outgoing token idAmount (direct/indirect emissions) matching each carbon token
     */
    function track(
        address trackee,
        uint256[] memory inIds,
        uint256[] memory inAmounts,
        uint256[] memory outIds,
        uint256[] memory outAmounts,
        uint256[] memory trackerIds) 
        public {
        // increment trackerId
        _numOfUniqueTrackers.increment();
        uint256 trackerId = _numOfUniqueTrackers.current();
        // create token details
        CarbonTrackerDetails storage trackerData = _trackerData[trackerId];
        trackerData.trackee = trackee;
        _track(trackerId,inIds,inAmounts,outIds,outAmounts,trackerIds);
        super._mint(msg.sender,trackerId);
    }

    function trackUpdate(
        uint256 trackerId,
        uint256[] memory inIds,
        uint256[] memory inAmounts,
        uint256[] memory outIds,
        uint256[] memory outAmounts,
        uint256[] memory trackerIds) public trackerTokenkExists(trackerId) {
        _track(trackerId,inIds,inAmounts,outIds,outAmounts,trackerIds);
    }
    function _track(
        uint256 _trackerId,
        uint256[] memory inIds,
        uint256[] memory inAmounts,
        uint256[] memory outIds,
        uint256[] memory outAmounts,
        uint256[] memory trackerIds) internal 
        notAudited(_trackerId)
        {
        require(inAmounts.length == inIds.length, 
            "CLM8::_equalLength: inAmounts and inIds lengths are not equal"); 
        require(outAmounts.length == outIds.length, 
            "CLM8::_equalLength: outAmounts and outIds lengths are not equal"); 
        require(trackerIds.length == 0 || trackerIds.length == inIds.length, 
            "CLM8::_track: length of carbonIn TrackerIds do not match the IDs");
        // create token details
        CarbonTrackerDetails storage trackerData = _trackerData[_trackerId];
        require(
            ( msg.sender == trackerData.trackee &&          
              hasRole(REGISTERED_TRACKER, trackerData.trackee)) ||
            isAuditorApproved[msg.sender][trackerData.trackee],
            "CLM8::trackerOrAuditor: msg.sender must be a registered tracker or approved auditor of the trackee"
        );

        CarbonTrackerTokens storage carbonTrackerIn = trackerData.carbonIn; 
        uint8 tokenTypeId;
        for (uint i = 0; i < inIds.length; i++) { 
            tokenTypeId = net.getTokenTypeId(inIds[i]);
            // validate retired emissions and set total emissions
            trackerData.totalEmissions = 
                _verifyRetired(inIds[i], trackerData.trackee, tokenTypeId,
                    carbonTrackerIn.idAmount[inIds[i]], inAmounts[i],
                    trackerData.totalEmissions);
            // asign trackerIds only for tokenTypeId==4
            // Note audited emission tokens are mapped in auditedTrackerId 
            if(trackerIds.length>0 && tokenTypeId==4){ 
                _setTrackerId(trackerData,
                    trackerIds[i],inIds[i],inAmounts[inIds[i]]);
            }
            _update(carbonTrackerIn,inIds[i],inAmounts[i]);
        }
        // collect token details
        CarbonTrackerTokens storage carbonTrackerOut = trackerData.carbonOut;
        for (uint i = 0; i < outIds.length; i++) { 
            tokenTypeId = net.getTokenTypeId(outIds[i]);
            if(tokenTypeId==4){
                _verifyTransferred(outIds[i],trackerData.trackee,
                    carbonTrackerOut.idAmount[outIds[i]],outAmounts[i]);  
            }else if(tokenTypeId==3){
                // to assign sudited emissions as outgoing carbon tracker must be an auditor
                // TO-DO use trackerId and associated tx hahses as inputs for the Fabric
                // emissions auditing channel
                // In addition to issuing a retired audited emisison token to issuee
                // the trackerId of the source industry will be updated with the audited emission as an output
                // If the issuee is an industry that has volunteered to be tracked by the auditor
                // a new trackerId could be issued with the audited emissions as an input
                _isAuditor(_trackerId);
                if(carbonTrackerOut.idAmount[outIds[i]]>0){
                    trackerData.totalAudited = 
                        trackerData.totalAudited.sub(carbonTrackerOut.idAmount[outIds[i]]);
                }
                if(outAmounts[i]>0){
                    trackerData.totalAudited = 
                        trackerData.totalAudited.add(outAmounts[i]);
                    require(trackerData.totalEmissions>=trackerData.totalAudited,
                        "CLM8::_track: total audited emission out is greater than total emission tracked");
                    auditedTrackerId[outIds[i]]=_trackerId;        
                }else{
                    // if removing the amount completly delete the tracker mapping.
                    delete auditedTrackerId[outIds[i]];
                }
            }else{
                revert("CLM8::_track: can not track outgoin offsets or RECs");
            }         
            _update(carbonTrackerOut,outIds[i],outAmounts[i]);//,_isAuditor);
        }   
        emit TrackerUpdated(_trackerId,msg.sender,
            inIds,inAmounts,outIds,outAmounts,trackerIds);
    } 


    function _setTrackerId(CarbonTrackerDetails storage trackerData, 
        uint trackerId, uint tokenId, uint amount) internal {
        // correct for previous amount assigned to the tokenId
        CarbonTrackerDetails storage sourceTracker = _trackerData[trackerId];
        if(trackerData.carbonIn.idAmount[tokenId]>0){
            sourceTracker.totalIn[tokenId] = sourceTracker.totalIn[tokenId]
                .sub(trackerData.carbonIn.idAmount[tokenId]);
        }
        if(amount>0){
            sourceTracker.totalIn[tokenId] = 
                sourceTracker.totalIn[tokenId].add(amount);
            require(
                sourceTracker.carbonOut.idAmount[tokenId] >=
                    sourceTracker.totalIn[tokenId],
                "CLM8::_track: total tracked in exceeds token output of trackerId"
            );
            trackerData.trackerId[tokenId]=trackerId;
        }else{
            delete trackerData.trackerId[tokenId];
        }
    }

    /**
     * @dev update the token data within the Tacker
     * @
     * @param tokenId - to be updated
     * @param amount - amount asigned to tokenId
    **/
    function _update(
        CarbonTrackerTokens storage _tokenData,
        uint tokenId,
        uint amount
        //bool _isAuditor
        ) internal {

        uint index = _tokenData.idIndex[tokenId];
        if(amount>0){
            // if the final amount is not zero check if the tokenId should be
            // added to the tokenIds array and update idAmount
            //_tokenData.idAudit[tokenId] = _isAuditor;
            if(index==0){
                _tokenData.tokenIds.push(tokenId);
                _tokenData.idIndex[tokenId]=_tokenData.tokenIds.length;
            }
            _tokenData.idAmount[tokenId] = amount;  
        }else{
            // remove tokenId and associated data from tracker
            if (_tokenData.tokenIds.length > 1) {
                _tokenData.tokenIds[index-1] = 
                    _tokenData.tokenIds[_tokenData.tokenIds.length-1];
                _tokenData.idIndex[_tokenData.tokenIds[index-1]]=index;
            }
            // index of tokenId should be deleted;
            delete _tokenData.idIndex[tokenId];
            delete _tokenData.idAmount[tokenId];
            //delete _tokenData.idAudit[tokenId]
            delete _tokenData.tokenIds[_tokenData.tokenIds.length-1];
            //_tokenData.tokenIds.length--; // Implicitly recovers gas from last element storage
        }
    }

    function _verifyRetired(uint tokenId,address trackee, uint8 tokenTypeId,
        uint amountOld, uint amountNew, uint total) internal returns(uint) {
        if(amountOld>0){
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
                total = total.add(amountOld);
            }else if(tokenTypeId==2){ //subtract out offset
                total = total.sub(amountOld);
            }// else REC does not change the total emissions
            require(
                net.getRetiredBalances(tokenId,trackee) >= _retiredBalances[tokenId][trackee], 
                "CLM8::_update: the retired balance exceeds what has been reported in NET"
            );
        }
        return total;
    }
    function _verifyTransferred(uint tokenId, address trackee, 
        uint amountOld, uint amountNew) internal {
        if(amountOld>0){
            //adjust existing _transferredBalances for tokenTypeId 4
            _transferredBalances[tokenId][trackee]
                =_transferredBalances[tokenId][trackee].sub(amountOld);
        }
        if(amountNew>0){
            _transferredBalances[tokenId][trackee]
                =_transferredBalances[tokenId][trackee].add(amountNew);
            require(
                net.getTransferredBalances(tokenId,trackee) >= _transferredBalances[tokenId][trackee], 
                "CLM8::_update: the transferred balance exceeds what has been reported in NET"
            );
        }
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
     * auditor - to be approved or removed
     * approve - approve (true) or remove (false)
     */
    function approveAuditor(address auditor,bool approve) 
        external notSender(auditor){
        require(
            net.isAuditor(auditor) || !approve,
            "CLM8::approveAuditor: address is not a registered emissions auditor"
        );
        isAuditorApproved[auditor][msg.sender]=approve;
        if(approve){
            emit AuditorApproved(auditor,msg.sender);
        }else{
            emit AuditorRemoved(auditor,msg.sender);
        }
    }
}