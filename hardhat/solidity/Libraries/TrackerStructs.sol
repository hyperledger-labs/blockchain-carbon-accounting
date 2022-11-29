// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../NetEmissionsTokenNetwork.sol";

library Tracker {
    using SafeMath for uint256;

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

    /**
     * @dev tracker mappings
     * tokenIds - array of ids of NET (direct/indirect/offsets)
     * idIndex - mapping tokenId to its index in array. 1st index is 1, 0 reserved for unindexed
     * amount - mapping tokenId to amount of emissions
     * productIds - array of productIds tracked as inputs
     * productIdIndex mapping productId to index in array
     * productAmount - of productId tracked
     **/
    struct CarbonTrackerMappings {
        uint256[] tokenIds;
        mapping(uint256 => uint256) idIndex;
        mapping(uint256 => uint256) amount;
        uint256[] productIds;
        mapping(uint256 => uint256) productIdIndex;
        mapping(uint256 => uint256) productAmount;
    }
}
