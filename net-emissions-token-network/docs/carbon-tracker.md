# Carbon Tracker:

## An NFT using ERC721Upgradeable template create carbon trackers
- Each NFT is used to track the unique emission profile of a product/facility based on NETs
- NETs in each NFTs can be linked to previous NFT connect emission profiles (embedded emissions)
    - The IDs and amonts of NETs defined as inputs/outputs to the tracker .
    - Inputs are defined as burnt tokens of Type 3,4 (audited emission token, industry emissions token) 
    - There are two types of outputs:
        1. carbon transfers (type 4 unburnt fuel/feedstock) 
        2. audited emissions (type 3) issued incunjunction with a tracker Id
    - to track transfers with token type 4:    
        - trackerId: (map) input tokenId to a previous tracker id
        - totalIn: (map) tokenId (type 4) to aggregate anount tracked in by other trackers
    - totalAudited: total audited emissions (type 3) generated for this tracker (outputs)
    - totalEmission: total emissions tracked here  
- Unique audited emission certificates may be issued for each NFT:
    - track embedded emission transfers (e.g. scope 2/3) for non-hydrocarbon fuel/feedstock product transfers
    - auditedTrackerId maps audited emission token to trackerId
- validation of retired/audited and transfered emission balances so that tracker entries don't conflit with NET.


## A new token for registered industry

TokenTypeId=4 for carbon Tokens issued by registered industry of the Net Emission Token (NET) Network. This supply side token and CarbonTracker contract enable shared emission inventories across organizations and  embedded emission tracking.
Carbon tokens can only be transferred with the approval of the receiving party using the openzepplin ECDSAUpgradeable

Additions/changes to the NetEmissionTokenNetwork contract:
- Role REGISTERED_INDUSTRY: new industry actors, self assigned or admin elected
- Role REGISTERED_INDUSTRY_DEALER: elected by admin as official Carbon Token industry dealers
- Mapping `_transferredBalances` allows CarbonTracker to check the transferred balances of a tokenId by a given address. The address can not track more transfers than reported within NET. 
- mapping `carbonTransferNonce`: 
    - prevent processing of carbon token transfers (tokenTypeID=4) multiple times. 
    - Used in getTransferHash (see below)
    - Increment in _beforeTokenTransfer hook when approveCarbon require verifySignature (see below).
- Modifier consumerOrDealer(address from,address to): modifer for filter for from and to addresses.
    - from!=address(0): if not minting require sender to be consumerOrDealer
    - to!=address(0): if not burning require receiver is consumerOrDealer  
- function `_beforeTokenTransfer()`: saferansfer() hook
    - Ensures that require is enforced for all safeTransferFrom (or Batch) calls. 
    - Also applies to issue `super._mint` and retire `super._burn`.
    - if condition tokenTypeId == 4, require receiverApproved()
- `getTransferHash()`: create Hash of token transfer from,to,ids,amounts
- `verifySignature()`: require address that signed getTransferHash() matches to address