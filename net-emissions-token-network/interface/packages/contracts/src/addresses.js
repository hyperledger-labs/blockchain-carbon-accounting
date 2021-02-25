// This file stores the contract address the interface will attempt to connect to
// By default, these addresses are all set to the addresses returned by running the command:
// npx hardhat run --network localhost scripts/deploy-all.js
const addresses = {
  
  network: "Hardhat Network",
  
  tokenNetwork: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // default Hardhat deployment address with scripts/deploy-all.js
  },

  // governance contracts
  dao: {
    governor: {
      address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" // default Hardhat deployment address with scripts/deploy-all.js
    },
    daoToken: {
      address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // default Hardhat deployment address with scripts/deploy-all.js
    }
  }
};

export default addresses;
