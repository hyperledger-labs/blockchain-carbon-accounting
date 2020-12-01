pragma solidity >=0.4.22 <0.6.0; 
pragma experimental ABIEncoderV2;

contract EmissionsCert {


struct Certificate
{
    uint256 tokenId;
    uint8 quantity;
    string issuerId;
    string recipientId;
    string assetType;
    string uom;
    string dateStamp;
    string metadata;
    string manifest;
}

uint256 public owners_count;
address public contract_owner;              // Manufacturer/owner
bytes32 public land_id;                   // land_id
bytes32 public land_sqrfeet;              // land_sqrfeet
bytes32 public land_created_date;         // Created date
mapping(uint => address) public owners;     // list of owners


Certificate[] public _all_certs;
string[] public _registered_dealers;
string[] public _registered_consumers;

mapping (uint256 => Certificate) private _certificate;

function createRenewableEnergyCertificate(uint8 _quantity, string memory _issuerId, string memory _recipientId, string memory _assetType, string memory _uom, string memory _dateStamp, string memory _metadata, string memory _manifest) public returns (bool){
    Certificate storage newCert = _certificate[ _all_certs.length ];
    newCert.tokenId = _all_certs.length;
    newCert.quantity = _quantity;
    newCert.issuerId = _issuerId;
    newCert.recipientId = _recipientId;
    newCert.assetType = _assetType;
    newCert.uom = _uom;
    newCert.dateStamp = _dateStamp;
    newCert.metadata = _metadata;
    newCert.manifest = _manifest;
    
    _all_certs.push( newCert );   // add to array of tokens
    
    return true;
}

function transferOwner(uint256 Id, string memory newOwner) public returns (Certificate memory) {
    Certificate memory certificate;
    certificate = getRenewableEnergyCertificateById(Id);
    certificate.recipientId = newOwner;
    _all_certs[Id] = certificate;
    return certificate;
}

function getRenewableEnergyCertificateById(uint256 Id) public returns (Certificate memory){
    return (_all_certs[Id]);
  }


function getAllRenewableEnergyCertificate() public returns (Certificate[] memory){
    
    return _all_certs;
}

function registerDealer(string memory dealerName) public returns (bool){
    _registered_dealers.push(dealerName);
    return true;
}

function getRegisteredDealers() public returns (string[] memory){
    return _registered_dealers;
}

function registerConsumer(string memory consumerName) public returns (bool){
    _registered_consumers.push(consumerName);
    return true;
}

function getRegisteredConsumers() public returns (string[] memory){
    return _registered_consumers;
}

}
