// This address points to a dummy ERC20 contract deployed on Ethereum Mainnet,
// Goerli, Kovan, Rinkeby and Ropsten. Replace it with your smart contracts.
const addresses = {
  // tokenNetwork: "0x5FbDB2315678afecb367f032d93F642f64180aa3" // default Hardhat deployment address
  // tokenNetwork: "0x57257E8a359A42cA859d597264017653F0984e03" // Goerli contract, deployed 2021-01-05 (includes UOM)
  tokenNetwork: "0x2d6b1634d419A768786f6dDD07a4f6240Ccff6C4" // Goerli contract, deployed 2021-01-07 (removes UOM)
};

export default addresses;
