// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

library TxVerifier {
    using ECDSA for bytes32;
    using ECDSA for address;

    /**
     * @dev Returns `true` if transfer has been approved by to address
     * reconstruct transferHash and check that it matches the signature
     */
    function verifySignature(
        bytes32 msgHash,
        bytes memory signature,
        address signer
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = msgHash.toEthSignedMessageHash();
        return ethSignedMessageHash.recover(signature) == signer;
    }

    /**
     * @dev Returns keccak256 hash of transaction request
     * including next available nonce for transfer from -> to addresses
     */
    function _getTransferHash(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        uint32 _nonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(_from, _to, _ids, _amounts, _nonce + 1));
    }

    /**
     * @dev Returns `true` if metadata signature is valid
     * (public functions are not broadcast to the EVM or blockchain network)
     */
    function verifyMetadataSignature(
        address contractAddress,
        uint256 productId,
        address signer,
        string memory metadata,
        bytes memory signature
    ) internal pure returns (bool) {
        //address signer = _tokenDetails[_productData[productId].tokenId].issuedBy;
        bytes32 ethSignedUnitHash = _getMetadataHash(
            contractAddress,
            productId,
            metadata
        ).toEthSignedMessageHash();
        return ethSignedUnitHash.recover(signature) == signer;
    }

    /**
     * @dev Returns keccak256 hash of text for a trackerId and productId pair
     * This function should be called by the auditor submitting product data
     * to produce a unitHash that is signed off-chain.
     * The signature can be provided to accounts requesting products
     * to verify the unit associated with product amounts
     * unit data is not stored on-chain to respect producer privacy
     */
    function _getMetadataHash(
        address contractAddress,
        uint256 productId,
        string memory metadata
    ) internal pure returns (bytes32) {
        return
            keccak256(abi.encodePacked(contractAddress, productId, metadata));
    }
}
