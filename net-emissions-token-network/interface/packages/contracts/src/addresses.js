// This file stores the contract address the interface will attempt to connect to
const addresses = {
  
  // default Hardhat deployment address
  tokenNetwork: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    network: "Hardhat Network"
  },

  // governance contracts
  dao: {
    governor: {
      address: "0x70f98cD79b5b3A8Cd979D9ECF6B443265FE9a4c2"
    },
    daoToken: {
      address: "0xA7702cB0922979fd1a9b456f76600c0E914c11A5"
    }
  }
};

export default addresses;
