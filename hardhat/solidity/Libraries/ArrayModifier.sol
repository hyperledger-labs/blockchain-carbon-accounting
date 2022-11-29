// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

library ArrayModifier {
    function updateIndex(
        uint256 id,
        uint256 amount,
        uint256[] storage ids,
        mapping(uint256 => uint256) storage idIndex
    ) internal {
        uint256 index = idIndex[id];
        if (amount > 0) {
            // if the final amount is positive check if the id should be added to the ids array
            if (index == 0) {
                ids.push(id);
                idIndex[id] = ids.length;
            }
        } else {
            if (index > 0) {
                if (ids.length > 1) {
                    // first replace indexed id with last in ids array
                    ids[index - 1] = ids[ids.length - 1];
                    // 2nd updated the index of id we are deleting with the one replacing it
                    idIndex[ids[index - 1]] = index;
                }
                // delete the index of the ud
                delete idIndex[id];
                // drop the last id from the array
                delete ids[ids.length - 1];
            }
        }
    }

    function updateIndexAndAmount(
        uint256 id,
        uint256 amount,
        uint256[] storage ids,
        mapping(uint256 => uint256) storage idIndex,
        mapping(uint256 => uint256) storage idAmount
    ) internal {
        updateIndex(id, amount, ids, idIndex);
        if (amount > 0) {
            idAmount[id] = amount;
        } else {
            delete idAmount[id];
        }
    }
}
