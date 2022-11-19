// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../NetEmissionsTokenNetwork.sol";

library Tracker {
    using SafeMath for uint256;
    struct NetTotals {
        uint256 rec;
        uint256 offsets;
        uint256 emissions;
    }
    /**
     * @dev tracker details
     * tokenId corresponding ERC1155 token ID
     * trackerId
     * trackee - address of the account the tracking will apply to
     * totalProductAmounts - to unit of products issued to this tracker
     **/
    struct CarbonTrackerDetails {
        uint256 tokenId;
        uint256 trackerId;
        address trackee;
        uint256 totalProductAmounts;
    }
    /**
     * @dev ProductsTracked
     * productIds - tracked
     * productIndex - of productId tracked
     * amount - of productId tracked
     **/
    struct ProductsTracked {
        uint256[] productIds;
        mapping(uint256 => uint256) productIndex;
        mapping(uint256 => uint256) amount;
    }
    /**
     * @dev tracker mappings
     * tokenIds - array of ids of NET (direct/indirect/offsets)
     * idIndex - mapping tokenId to its index in array. 1st index is 1, 0 reserved for unindexed
     * amount - mapping tokenId to amount of emissions
     * productIds - array of productIds
     * productIdIndex mapping productId to index in array
     * trackerIds - arrays of tracker ids referenced by this tracker
     * trackerIndex - mapping sourceTrackerId to index in array. 1st index is 1, 0 reserved for unindexed.
     * productsTracked - map trackerId to information about productsTracked
     **/
    struct CarbonTrackerMappings {
        uint256[] tokenIds;
        mapping(uint256 => uint256) idIndex;
        mapping(uint256 => uint256) amount;
        //uint256[] productIds;
        //mapping(uint256 => uint256) productIdIndex;
        uint256[] trackerIds;
        mapping(uint256 => uint256) trackerIndex;
        mapping(uint256 => ProductsTracked) productsTracked;
    }

    function _getTotalEmissions(
        uint256 trackerId,
        uint256 decimalsCt,
        address _net,
        mapping(uint256 => CarbonTrackerDetails) storage trackerData,
        mapping(uint256 => CarbonTrackerMappings) storage trackerMappings
    )
        internal view returns (NetTotals memory)
    {
        NetEmissionsTokenNetwork net = NetEmissionsTokenNetwork(_net);
        uint256[] memory tokenIds = trackerMappings[trackerId].tokenIds;
        NetTotals memory totals;
        uint256 netAmount;
        uint8 tokenTypeId;
        for (uint i = 0; i < tokenIds.length; i++) {
            netAmount = decimalsCt.mul(trackerMappings[trackerId].amount[tokenIds[i]]);
            tokenTypeId = net.getTokenTypeId(tokenIds[i]);
            if (tokenTypeId == 3) {
                totals.emissions = totals.emissions.add(netAmount);
            } else if (tokenTypeId == 2) {
                totals.offsets = totals.offsets.add(netAmount);
            } else if (tokenTypeId == 1) {
                totals.rec = totals.rec.add(netAmount);
            }
        }
        return _getTotalsTracked(totals, trackerId, decimalsCt, _net, trackerData, trackerMappings);
        //return totals;
    }

    function _getTotalsTracked(
        NetTotals memory totals,
        uint256 trackerId,
        uint256 decimalsCt,
        address _net,
        mapping(uint256 => CarbonTrackerDetails) storage trackerData,
        mapping(uint256 => CarbonTrackerMappings) storage trackerMappings
    ) 
        private view returns (NetTotals memory) 
    {
        uint256[] memory trackerIds  = trackerMappings[trackerId].trackerIds;
        ProductsTracked storage productsTracked;
        uint weights;
        NetTotals memory _totalsTracked;
        for (uint i = 0; i < trackerIds.length; i++) {
            productsTracked = trackerMappings[trackerId].productsTracked[trackerIds[i]];
            if(trackerData[trackerIds[i]].totalProductAmounts>0){
                _totalsTracked = _getTotalEmissions(
                    trackerIds[i],
                    decimalsCt,
                    _net, 
                    trackerData,
                    trackerMappings
                );

                for (uint j = 0; j < productsTracked.productIds.length; j++) {
                    // get weights for distribution of tokens 
                    weights = decimalsCt.mul(productsTracked.amount[productsTracked.productIds[j]]).div(trackerData[trackerIds[i]].totalProductAmounts);
                    totals.emissions = totals.emissions.add(weights.mul(_totalsTracked.emissions));
                    totals.offsets = totals.offsets.add(weights.mul(_totalsTracked.offsets));
                    totals.rec = totals.rec.add(weights.mul(_totalsTracked.rec));
                }
            }
        }
        return totals;
    }
}
    /*function getTotalEmissions(uint256 trackerId)
        public
        view
        returns (Tracker.NetTotals memory)
    {
        return trackerId._getTotalEmissions(
            decimalsCt,
            address(net),
            _trackerData,            
            _trackerMappings
        );

        uint256[] storage tokenIds = _trackerMappings[trackerId].tokenIds;
        NetTotals memory totals;
        for (uint i = 0; i < tokenIds.length; i++) {
            uint256 netAmount = _trackerMappings[trackerId].amount[tokenIds[i]].mul(decimalsCt);
            uint8 tokenTypeId = net.getTokenTypeId(tokenIds[i]);
            if (tokenTypeId == 3) {
                totals.emissions = totals.emissions.add(netAmount);
            } else if (tokenTypeId == 2) {
                totals.offsets = totals.offsets.add(netAmount);
            } else if (tokenTypeId == 1) {
                totals.rec = totals.rec.add(netAmount);
            }
        }

        uint256[] memory trackerIds  = _trackerMappings[trackerId].trackerIds;
        ProductsTracked storage productsTracked;
        for (uint i = 0; i < trackerIds.length; i++) {
            productsTracked = _trackerMappings[trackerId].productsTracked[trackerIds[i]];
            if(_trackerData[trackerIds[i]].totalProductAmounts>0){
                NetTotals memory _totalsTracked = getTotalEmissions(trackerIds[i]);
                for (uint j = 0; j < productsTracked.productIds.length; j++) {
                    // get weights for distribution of tokens 
                    uint weights = decimalsCt.mul(productsTracked.amount[productsTracked.productIds[j]]).div(_trackerData[trackerIds[i]].totalProductAmounts);
                    totals.emissions = totals.emissions.add(weights.mul(_totalsTracked.emissions));
                    totals.offsets = totals.offsets.add(weights.mul(_totalsTracked.offsets));
                    totals.rec = totals.rec.add(weights.mul(_totalsTracked.rec));
                }
            }
        }
        return totals;
    }*/