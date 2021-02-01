# Net Emissions Tokens Network

The net emissions tokens network represents the net emissions of an entity, which could be an organization, a building, or even a person. It is the sum of all the emissions from different channels such as the [utility emissions channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel), plus offsetting Renewable Energy Certificates and carbon offsets. Each token represents either an emissions debt, which you incur through activities that emit greenhouse gases, or an emissions credit, which offset the debt by removing emissions from the atmosphere.

Read more on the [Hyperledger Climate Action SIG website](https://wiki.hyperledger.org/display/CASIG/Net+Emissions+Tokens+Network).

## Contracts

The net emissions token network is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts.

### Installation and use

Clone this repository, navigate to the net-emissions-token-network directory, and run `npm install`

#### Misc. contract commands

- To test, run `npx hardhat test`
- To compile, run `npx hardhat compile`
- To export ABIs after recompiling contract, run `sh exportAbis.sh`
- To see all commands, run `npx hardhat`

## Interface

The interface for interacting with the contract is created using [create-eth-app](https://github.com/PaulRBerg/create-eth-app). The MetaMask browser extension is required for testing.

The application connects to the contract of the address specified in `net-emissions-token-network/interface/packages/contracts/src/addresses.js`, which is by default set to the default address of deployment on the Hardhat Network. To instead connect to an Ethereum testnet on Goerli, read *Starting the React application and connecting to Goerli testnet*, otherwise, read the instructions below.

### Starting the React application and connecting to local Hardhat Network

To run a testnet locally via Hardhat Network:

1. From the `net-emissions-token-network/interface` directory, install the necessary packages and start the React app with

```bash
yarn install
yarn react-app:start
```

2. In a separate terminal, start a local Hardhat Network in `net-emissions-token-network/` with:

```bash
npx hardhat node
```

3. In a separate terminal, deploy the contracts in `net-emissions-token-network/` to the local Hardhat Network with:

```bash
npx hardhat run --network localhost scripts/deploy.js
```

The address of the deployed contract should end with `0aa3`.

4. Import the private keys of the accounts from Hardhat in the terminal window after clicking the account icon then Import Account.

5. Within the settings for localhost in MetaMask, be sure that the Chain ID is set to 1337.

6. In the MetaMask extension after navigating to the interface in the browser, change the network from Ethereum Mainnet to _Localhost 8545_. Make sure Metamask says the account is "Connected" with a green dot.

7. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

8. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to your local testnet and be able to interact with contracts deployed on it through the React application.

_Note: When restarting the Hardhat Network after interacting with the contracts through MetaMask, it might be necessary to reset the account's transactions otherwise an "invalid nonce" error might occur due to the way Ethereum prevents double-counting transactions. To reset transaction history in MetaMask, click the account icon in the top right, go to Settings, Advanced, and Reset Account._

### Starting the React application and connecting to Goerli testnet

Goerli is a public Ethereum testnet. When interacting with the contract on Goerli, access to the owner private key is needed to register dealers via the interface, and new wallets can be created via MetaMask (be sure to fund newly created wallets with Goerli ETH via a faucet or transferring funds for gas fees). Transactions can be viewed by anyone on [Etherscan](https://goerli.etherscan.io/) (to see the history of transactions, one can enter the current contract address at `net-emissions-token-network/interface/packages/contracts/src/addresses.js`). After deploying the contract to Goerli (as outlined under the section Deploying contract to Goerli), connect the interface with the following steps:

1. In `net-emissions-token-network/interface/packages/contracts/src/addresses.js`, replace the contract address deployed to the Hardhat Network (ending in `0aa3`) with the address of the Goerli contract you'd like to connect to.

2. From the `net-emissions-token-network/interface` directory, install the necessary packages and start the React app with

```bash
yarn install
yarn react-app:start
```

3. After navigating to `localhost:3000` in the browser, change the network from Ethereum Mainnet to _Goerli Test Network_. Make sure MetaMask says the account is "Connected" with a green dot.

4. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

5. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to the contract in Goerli and be able to interact with contracts deployed on it through the React application.

---

### Deploying contract to Goerli

If you'd like to deploy the contract to the Goerli testnet yourself, go to [Infura.io](https://infura.io/) to set up an account.  Then start a project under the "Ethereum" tab.  You will need the project ID.

Next, connect your Metamask wallet to the Goerli Test Network and create an account on it.  This will be used as the account for deploying your contract.  Copy the private key for the new account.  Go to a [Goerli faucet](https://faucet.goerli.mudit.blog) to get some test ETH for your account 

Now follow these steps to deploy the contract to the Goerli testnet and update references to the address:

1. Create `.goerli-config.js` by copying the template with 

```bash
cp .goerli-config.js.example .goerli-config.js` and
```

2.  Edit `.goerli-config.js` and set the private key for your Ethereum deployment address and Infura key.

3. Edit the file `hardhat.config.js` and uncomment these line 

```bash
     // const goerliConfig = require("./.goerli-config");
     ....
     // goerli: {
     //   url: `https://goerli.infura.io/v3/${goerliConfig.INFURA_PROJECT_ID}`,
     //   accounts: [`0x${goerliConfig.GOERLI_CONTRACT_OWNER_PRIVATE_KEY}`]
     //
```

4. Deploy by via the deploy script with the following command:

```bash
npx hardhat run --network goerli scripts/deploy.js
```
You will get a result that says

```bash
Net Emissions Token Network deployed to: 0x_________________________________
```

This is the deployed address for your contract. 

5. Update the deployed address for the interface in `net-emissions-token-network/interface/packages/contracts/src/addresses.js`.  You can also change the `network` attribute to "Goerli" so that it shows up in the react app later.

6. Update the deployed address for the Fabric API in `../utility-emissions-channel/typescript_app/src/blockchain-gateway/net-emissions-token-network/networkConfig.ts`.

### Verifying contract on Etherscan

[Etherscan](https://etherscan.io/) is a popular block explorer for Ethereum networks. In order for Etherscan to display the names of the contract functions after compiling and deploying, one must supply Etherscan with the contract code for verification. Once the contract is verified, it is easier to view interactions with the contract as it deciphers the payloads. 

To submit a contract for verification:

1. Go to [Etherscan](https://etherscan.io/) to sign up for an account.  Then go to API Keys and enter get an API key. 

2.  Create `.etherscan-config.js` by copying the template with 

```bash
cp .etherscan-config.js.example .etherscan-config.js
```

3. Populate your `etherscan-config.js` with your Etherscan API key.

4. Edit the file `hardhat.config.js` and uncomment these line 

```bash
   // const etherscanConfig = require("./.etherscan-config");
    ...
   // apiKey: `${etherscanConfig.ETHERSCAN_API_KEY}`
```

Also make sure that the Goerli settings are uncommented (see above.)

5. Verify with the following command (replace DEPLOYED_CONTRACT_ADDRESS with the contract address):

```bash
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS
```
You should see

```bash
Successfully verified contract NetEmissionsTokenNetwork on Etherscan
```

You can now go to https://goerli.etherscan.io/ to search for your contract and wallet addresses and see the transactions.  Click through to a particular transaction, and click on the button to "Decode Input Data".  You will now see all the fields of the transaction.

### Token User Flow

In the net-emissions-token-network contract, we currently support this functionality:

- Issuing tokens and verifying that its type is valid
- Registering/unregistering dealers
- Registering/unregistering consumers
- Transferring tokens
- Retiring tokens

#### An example of a user consuming these services would look similar to the following:
nter
After registering a consumer, the dealer will be able to issue this consumer a token with the issue function:

```bash
function issue( address account, uint8 tokenTypeId, uint256 quantity, string memory uom, string memory fromDate, string memory thruDate, string memory automaticRetireDate, string memory metadata, string memory manifest, string memory description )
```
sets and renewable energy certificates can be retired:

```bash
function retire(address account, uint256 tokenId, uint256 amount)
```
unctier f
function getBothBalanceByTokenId(uint8 tokenTypeId)
```

which returns a key-value pair like this:
0", "1": "uint256: 100" }

The `0` index is the available balance, and the `1` index is the retired balance. You can also separately get available and retired balances with `getAvailableBalanceByTokenTypeId` and `getRetiredBalanceByTokenTypeId`.

Dealers and consumers may also be unregistered within the network. Only the contract owner can unregister a dealer:
```ba
A dealer may unregister its consumers with the unregisterConsumer function:

```bash
function unregisterConsumer( address account )
```
rsnpmstall -g remixd
```
ies for the contract in the net-emissions-token-network directory:

```bash
npm install
```
To st,ions-token-network --remix-ide https://remix.ethereum.org
```

After installing, navigate to https://remix.ethereum.org/ in the browser of your choice. (Currently only tested in Chrome)

Find the "plugins" tab on the left of the IDE user interface. Select remixd and connect. You will now see the entire net-emissions-token-network folder in the file explorer within remixd.

Under localhost -> contracts, select NetEmissionsTokenNetwork.sol in the file explorer.

Go to the compiler tab, change the compiler version to the same as the Solidity version at the beginning of the contract.  Check the box for "optimize" and compile the contract.

Next, select the "Deploy and run transactions tab", change the gas limit to "9999999", select "NetEmissionsTokenNetwork" from the drop down, and deploy the contract.
i    "axios": {
      "version": "0.19.2",
      "resolved": "https://registry.npmjs.org/axios/-/axios-0.19.2.tgz",
      "integrity": "sha512-fjgm5MvRHLhx+osE2xoekY70AhARk3a6hkN+3Io1jc00jtquGvxYlKlsFUhmUET0V5te6CcZI7lcv2Ym61mjHA==",
      "dev": true,
      "requires": {
        "follow-redirects": "1.5.10"
      },
      "dependencies": {
        "debug": {
          "version": "3.1.0",
          "resolved": "https://registry.npmjs.org/debug/-/debug-3.1.0.tgz",
          "integrity": "sha512-OX8XqP7/1a9cqkxYw2yXss15f26NKWBpDXQd0/uK/KPqdQhxbPa994hnzjcE2VqQpDslf55723cKPUOGSmMY3g==",
          "dev": true,
          "requires": {
            "ms": "2.0.0"
          }
        },
        "follow-redirects": {
          "version": "1.5.10",
          "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.5.10.tgz",
          "integrity": "sha512-0V5l4Cizzvqt5D44aTXbFZz+FtyXV1vrDN6qrelxtfYQKW0KO0W2T/hkE8xvGa/540LkZlkaUjO4ailYTFtHVQ==",
          "dev": true,
          "requires": {
            "debug": "=3.1.0"
          }
        },
        "ms": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
          "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
          "dev": true
        }
      }
    },
    "balanced-match": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.0.tgz",
      "integrity": "sha1-ibTRmasr7kneFk6gK4nORi1xt2c=",
      "dev": true
    },
    "base": {
      "version": "0.11.2",
      "resolved": "https://registry.npmjs.org/base/-/base-0.11.2.tgz",
      "integrity": "sha512-5T6P4xPgpp0YDFvSWwEZ4NoE3aM4QBQXDzmVbraCkFj8zHM+mba8SyqB5DbZWyR7mYHo6Y7BdQo3MoA4m0TeQg==",
      "dev": true,
      "requires": {
        "cache-base": "^1.0.1",
        "class-utils": "^0.3.5",
        "component-emitter": "^1.2.1",
        "define-property": "^1.0.0",
        "isobject": "^3.0.1",
        "mixin-deep": "^1.2.0",
        "pascalcase": "^0.1.1"
      },
      "dependencies": {
        "define-property": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/define-property/-/define-property-1.0.0.tgz",
          "integrity": "sha1-dp66rz9KY6rTr56NMEybvnm/sOY=",
          "dev": true,
          "requires": {
            "is-descriptor": "^1.0.0"
          }
        }
      }
    },
    "base-x": {
      "version": "3.0.8",
      "resolved": "https://registry.npmjs.org/base-x/-/base-x-3.0.8.tgz",
      "integrity": "sha512-Rl/1AWP4J/zRrk54hhlxH4drNxPJXYUaKffODVI53/dAsV4t9fBxyxYKAVPU1XBHxYwOWP9h9H0hM2MVw4YfJA==",
      "dev": true,
      "requires": {
        "safe-buffer": "^5.0.1"
      }
    },
    "base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "dev": true
    },
    "bcrypt-pbkdf": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/bcrypt-pbkdf/-/bcrypt-pbkdf-1.0.2.tgz",
      "integrity": "sha1-pDAdOJtqQ/m2f/PKEaP2Y342Dp4=",
      "dev": true,
      "requires": {
        "tweetnacl": "^0.14.3"
      },
      "dependencies": {
        "tweetnacl": {
          "version": "0.14.5",
          "resolved": "https://registry.npmjs.org/tweetnacl/-/tweetnacl-0.14.5.tgz",
          "integrity": "sha1-WuaBd/GS1EViadEIr6k/+HQ/T2Q=",
          "dev": true
        }
      }
    },
    "bech32": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/bech32/-/bech32-1.1.4.tgz",
      "integrity": "sha512-s0IrSOzLlbvX7yp4WBfPITzpAU8sqQcpsmwXDiKwrG4r491vwCO/XpejasRNl0piBMe/DvP4Tz0mIS/X1DPJBQ==",
      "dev": true
    },
    "bignumber.js": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/bignumber.js/-/bignumber.js-9.0.1.tgz",
      "integrity": "sha512-IdZR9mh6ahOBv/hYGiXyVuyCetmGJhtYkqLBpTStdhEGjegpPlUawydyaF3pbIOFynJTpllEs+NP+CS9jKFLjA==",
      "dev": true
    },
    "binary-extensions": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.1.0.tgz",
      "integrity": "sha512-1Yj8h9Q+QDF5FzhMs/c9+6UntbD5MkRfRwac8DoEm9ZfUBZ7tZ55YcGVAzEe4bXsdQHEk+s9S5wsOKVdZrw0tQ==",
      "dev": true
    },
    "bindings": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/bindings/-/bindings-1.5.0.tgz",
      "integrity": "sha512-p2q/t/mhvuOj/UeLlV6566GD/guowlr0hHxClI0W9m7MWYkL1F0hLo+0Aexs9HSPCtR1SXQ0TD3MMKrXZajbiQ==",
      "dev": true,
      "requires": {
        "file-uri-to-path": "1.0.0"
      }
    },
    "bip66": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/bip66/-/bip66-1.1.5.tgz",
      "integrity": "sha1-AfqHSHhcpwlV1QESF9GzE5lpyiI=",
      "dev": true,
      "requires": {
        "safe-buffer": "^5.0.1"
      }
    },
    "blakejs": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/blakejs/-/blakejs-1.1.0.tgz",
      "integrity": "sha1-ad+S75U6qIylGjLfarHFShVfx6U=",
      "dev": true
    },
    "bluebird": {
      "version": "3.7.2",
      "resolved": "https://registry.npmjs.org/bluebird/-/bluebird-3.7.2.tgz",
      "integrity": "sha512-XpNj6GDQzdfW+r2Wnn7xiSAd7TM3jzkxGXBGTtWKuSXv1xUV+azxAm8jdWZN06QTQk+2N2XB9jRDkvbmQmcRtg==",
      "dev": true
    },
    "bn.js": {
      "version": "4.11.9",
      "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-4.11.9.tgz",
      "integrity": "sha512-E6QoYqCKZfgatHTdHzs1RRKP7ip4vvm+EyRUeE2RF0NblwVvb0p6jSVeNTOFxPn26QXN2o6SMfNxKp6kU8zQaw==",
      "dev": true
    },
    "body-parser": {
      "version": "1.19.0",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-1.19.0.tgz",
      "integrity": "sha512-dhEPs72UPbDnAQJ9ZKMNTP6ptJaionhP5cBb541nXPlW60Jepo9RV/a4fX4XWW9CuFNK22krhrj1+rgzifNCsw==",
      "dev": true,
      "requires": {
        "bytes": "3.1.0",
        "content-type": "~1.0.4",
        "debug": "2.6.9",
        "depd": "~1.1.2",
        "http-errors": "1.7.2",
        "iconv-lite": "0.4.24",
        "on-finished": "~2.3.0",
        "qs": "6.7.0",
        "raw-body": "2.4.0",
        "type-is": "~1.6.17"
      },
      "dependencies": {
        "debug": {
          "version": "2.6.9",
          "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
          "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
          "dev": true,
          "requires": {
            "ms": "2.0.0"
          }
        },
        "http-errors": {
          "version": "1.7.2",
          "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-1.7.2.tgz",
          "integrity": "sha512-uUQBt3H/cSIVfch6i1EuPNy/YsRSOUBXTVfZ+yR7Zjez3qjBz6i9+i4zjNaoqcoFVI4lQJ5plg63TvGfRSDCRg==",
          "dev": true,
          "requires": {
            "depd": "~1.1.2",
            "inherits": "2.0.3",
            "setprototypeof": "1.1.1",
            "statuses": ">= 1.5.0 < 2",
            "toidentifier": "1.0.0"
          }
        },
        "inherits": {
          "version": "2.0.3",
          "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.3.tgz",
          "integrity": "sha1-Yzwsg+PaQqUC9SRmAiSA9CCCYd4=",
          "dev": true
        },
        "ms": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
          "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
          "dev": true
        },
        "qs": {
          "version": "6.7.0",
          "resolved": "https://registry.npmjs.org/qs/-/qs-6.7.0.tgz",
          "integrity": "sha512-VCdBRNFTX1fyE7Nb6FYoURo/SPe62QCaAyzJvUjwRaIsc+NePBEniHlvxFmmX56+HZphIGtV0XeCirBtpDrTyQ==",
          "dev": true
        },
        "raw-body": {
          "version": "2.4.0",
          "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-2.4.0.tgz",
          "integrity": "sha512-4Oz8DUIwdvoa5qMJelxipzi/iJIi40O5cGV1wNYp5hvZP8ZN0T+jiNkL0QepXs+EsQ9XJ8ipEDoiH70ySUJP3Q==",
          "dev": true,
          "requires": {
            "bytes": "3.1.0",
            "http-errors": "1.7.2",
            "iconv-lite": "0.4.24",
            "unpipe": "1.0.0"
          }
        }
      }
    },
    "brace-expansion": {
      "version": "1.1.11",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
      "dev": true,
      "requires": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "braces": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.2.tgz",
      "integrity": "sha512-b8um+L1RzM3WDSzvhm6gIz1yfTbBt6YTlcEKAvsmqCZZFw46z626lVj9j1yEPW33H5H+lBQpZMP1k8l+78Ha0A==",
      "dev": true,
      "requires": {
        "fill-range": "^7.0.1"
      }
    },
    "brorand": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/brorand/-/brorand-1.1.0.tgz",
      "integrity": "sha1-EsJe/kCkXjwyPrhnWgoM5XsiNx8=",
      "dev": true
    },
    "browser-stdout": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/browser-stdout/-/browser-stdout-1.3.1.tgz",
      "integrity": "sha512-qhAVI1+Av2X7qelOfAIYwXONood6XlZE/fXaBSmW/T5SzLAmCgzi+eiWE7fUvbHaeNBQH13UftjpXxsfLkMpgw==",
      "dev": true
    },
    "browserify-aes": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/browserify-aes/-/browserify-aes-1.2.0.tgz",
      "integrity": "sha512-+7CHXqGuspUn/Sl5aO7Ea0xWGAtETPXNSAjHo48JfLdPWcMng33Xe4znFvQweqc/uzk5zSOI3H52CYnjCfb5hA==",
      "dev": true,
      "requires": {
        "buffer-xor": "^1.0.3",
        "cipher-base": "^1.0.0",
        "create-hash": "^1.1.0",
        "evp_bytestokey": "^1.0.3",
        "inherits": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "browserify-cipher": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/browserify-cipher/-/browserify-cipher-1.0.1.tgz",
      "integrity": "sha512-sPhkz0ARKbf4rRQt2hTpAHqn47X3llLkUGn+xEJzLjwY8LRs2p0v7ljvI5EyoRO/mexrNunNECisZs+gw2zz1w==",
      "dev": true,
      "requires": {
        "browserify-aes": "^1.0.4",
        "browserify-des": "^1.0.0",
        "evp_bytestokey": "^1.0.0"
      }
    },
    "browserify-des": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/browserify-des/-/browserify-des-1.0.2.tgz",
      "integrity": "sha512-BioO1xf3hFwz4kc6iBhI3ieDFompMhrMlnDFC4/0/vd5MokpuAc3R+LYbwTA9A5Yc9pq9UYPqffKpW2ObuwX5A==",
      "dev": true,
      "requires": {
        "cipher-base": "^1.0.1",
        "des.js": "^1.0.0",
        "inherits": "^2.0.1",
        "safe-buffer": "^5.1.2"
      }
    },
    "browserify-rsa": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/browserify-rsa/-/browserify-rsa-4.1.0.tgz",
      "integrity": "sha512-AdEER0Hkspgno2aR97SAf6vi0y0k8NuOpGnVH3O99rcA5Q6sh8QxcngtHuJ6uXwnfAXNM4Gn1Gb7/MV1+Ymbog==",
      "dev": true,
      "requires": {
        "bn.js": "^5.0.0",
        "randombytes": "^2.0.1"
      },
      "dependencies": {
        "bn.js": {
          "version": "5.1.3",
          "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-5.1.3.tgz",
          "integrity": "sha512-GkTiFpjFtUzU9CbMeJ5iazkCzGL3jrhzerzZIuqLABjbwRaFt33I9tUdSNryIptM+RxDet6OKm2WnLXzW51KsQ==",
          "dev": true
        }
      }
    },
    "browserify-sign": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/browserify-sign/-/browserify-sign-4.2.1.tgz",
      "integrity": "sha512-/vrA5fguVAKKAVTNJjgSm1tRQDHUU6DbwO9IROu/0WAzC8PKhucDSh18J0RMvVeHAn5puMd+QHC2erPRNf8lmg==",
      "dev": true,
      "requires": {
        "bn.js": "^5.1.1",
        "browserify-rsa": "^4.0.1",
        "create-hash": "^1.2.0",
        "create-hmac": "^1.1.7",
        "elliptic": "^6.5.3",
        "inherits": "^2.0.4",
        "parse-asn1": "^5.1.5",
        "readable-stream": "^3.6.0",
        "safe-buffer": "^5.2.0"
      },
      "dependencies": {
        "bn.js": {
          "version": "5.1.3",
          "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-5.1.3.tgz",
          "integrity": "sha512-GkTiFpjFtUzU9CbMeJ5iazkCzGL3jrhzerzZIuqLABjbwRaFt33I9tUdSNryIptM+RxDet6OKm2WnLXzW51KsQ==",
          "dev": true
        },
        "readable-stream": {
          "version": "3.6.0",
          "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.0.tgz",
          "integrity": "sha512-BViHy7LKeTz4oNnkcLJ+lVSL6vpiFeX6/d3oSH8zCW7UxP2onchk+vTGB143xuFjHS3deTgkKoXXymXqymiIdA==",
          "dev": true,
          "requires": {
            "inherits": "^2.0.3",
            "string_decoder": "^1.1.1",
            "util-deprecate": "^1.0.1"
          }
        }
      }
    },
    "bs58": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/bs58/-/bs58-4.0.1.tgz",
      "integrity": "sha1-vhYedsNU9veIrkBx9j806MTwpCo=",
      "dev": true,
      "requires": {
        "base-x": "^3.0.2"
      }
    },
    "bs58check": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/bs58check/-/bs58check-2.1.2.tgz",
      "integrity": "sha512-0TS1jicxdU09dwJMNZtVAfzPi6Q6QeN0pM1Fkzrjn+XYHvzMKPU3pHVpva+769iNVSfIYWf7LJ6WR+BuuMf8cA==",
      "dev": true,
      "requires": {
        "bs58": "^4.0.0",
        "create-hash": "^1.1.0",
        "safe-buffer": "^5.1.2"
      }
    },
    "buffer": {
      "version": "5.7.1",
      "resolved": "https://registry.npmjs.org/buffer/-/buffer-5.7.1.tgz",
      "integrity": "sha512-EHcyIPBQ4BSGlvjB16k5KgAJ27CIsHY/2JBmCRReo48y9rQ3MaUzWX3KVlBa4U7MyX02HdVj0K7C3WaB3ju7FQ==",
      "dev": true,
      "requires": {
        "base64-js": "^1.3.1",
        "ieee754": "^1.1.13"
      }
    },
    "buffer-from": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.1.tgz",
      "integrity": "sha512-MQcXEUbCKtEo7bhqEs6560Hyd4XaovZlO/k9V3hjVUF/zwW7KBVdSK4gIt/bzwS9MbR5qob+F5jusZsb0YQK2A==",
      "dev": true
    },
    "buffer-to-arraybuffer": {
      "version": "0.0.5",
      "resolved": "https://registry.npmjs.org/buffer-to-arraybuffer/-/buffer-to-arraybuffer-0.0.5.tgz",
      "integrity": "sha1-YGSkD6dutDxyOrqe+PbhIW0QURo=",
      "dev": true
    },
    "buffer-xor": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/buffer-xor/-/buffer-xor-1.0.3.tgz",
      "integrity": "sha1-JuYe0UIvtw3ULm42cp7VHYVf6Nk=",
      "dev": true
    },
    "bufferutil": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/bufferutil/-/bufferutil-4.0.2.tgz",
      "integrity": "sha512-AtnG3W6M8B2n4xDQ5R+70EXvOpnXsFYg/AK2yTZd+HQ/oxAdz+GI+DvjmhBw3L0ole+LJ0ngqY4JMbDzkfNzhA==",
      "dev": true,
      "requires": {
        "node-gyp-build": "^4.2.0"
      }
    },
    "bytes": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.0.tgz",
      "integrity": "sha512-zauLjrfCG+xvoyaqLoV8bLVXXNGC4JqlxFCutSDWA6fJrTo2ZuvLYTqZ7aHBLZSMOopbzwv8f+wZcVzfVTI2Dg==",
      "dev": true
    },
    "cache-base": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/cache-base/-/cache-base-1.0.1.tgz",
      "integrity": "sha512-AKcdTnFSWATd5/GCPRxr2ChwIJ85CeyrEyjRHlKxQ56d4XJMGym0uAiKn0xbLOGOl3+yRpOTi484dVCEc5AUzQ==",
      "dev": true,
      "requires": {
        "collection-visit": "^1.0.0",
        "component-emitter": "^1.2.1",
        "get-value": "^2.0.6",
        "has-value": "^1.0.0",
        "isobject": "^3.0.1",
        "set-value": "^2.0.0",
        "to-object-path": "^0.3.0",
        "union-value": "^1.0.0",
        "unset-value": "^1.0.0"
      }
    },
    "cacheable-request": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/cacheable-request/-/cacheable-request-6.1.0.tgz",
      "integrity": "sha512-Oj3cAGPCqOZX7Rz64Uny2GYAZNliQSqfbePrgAQ1wKAihYmCUnraBtJtKcGR4xz7wF+LoJC+ssFZvv5BgF9Igg==",
      "dev": true,
      "requires": {
        "clone-response": "^1.0.2",
        "get-stream": "^5.1.0",
        "http-cache-semantics": "^4.0.0",
        "keyv": "^3.0.0",
        "lowercase-keys": "^2.0.0",
        "normalize-url": "^4.1.0",
        "responselike": "^1.0.2"
      },
      "dependencies": {
        "get-stream": {
          "version": "5.2.0",
          "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-5.2.0.tgz",
          "integrity": "sha512-nBF+F1rAZVCu/p7rjzgA+Yb4lfYXrpl7a6VmJrU8wF9I1CKvP/QwPNZHnOlwbTkY6dvtFIzFMSyQXbLoTQPRpA==",
          "dev": true,
          "requires": {
            "pump": "^3.0.0"
          }
        },
        "lowercase-keys": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/lowercase-keys/-/lowercase-keys-2.0.0.tgz",
          "integrity": "sha512-tqNXrS78oMOE73NMxK4EMLQsQowWf8jKooH9g7xPavRT706R6bkQJ6DY2Te7QukaZsulxa30wQ7bk0pm4XiHmA==",
          "dev": true
        }
      }
    },
    "call-bind": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/call-bind/-/call-bind-1.0.0.tgz",
      "integrity": "sha512-AEXsYIyyDY3MCzbwdhzG3Jx1R0J2wetQyUynn6dYHAO+bg8l1k7jwZtRv4ryryFs7EP+NDlikJlVe59jr0cM2w==",
      "dev": true,
      "requires": {
        "function-bind": "^1.1.1",
        "get-intrinsic": "^1.0.0"
      }
    },
    "camelcase": {
      "version": "5.3.1",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-5.3.1.tgz",
      "integrity": "sha512-L28STB170nwWS63UjtlEOE3dldQApaJXZkOI1uMFfzf3rRuPegHaHesyee+YxQ+W6SvRDQV6UrdOdRiR153wJg==",
      "dev": true
    },
    "caseless": {
      "version": "0.12.0",
      "resolved": "https://registry.npmjs.org/caseless/-/caseless-0.12.0.tgz",
      "integrity": "sha1-G2gcIf+EAzyCZUMJBolCDRhxUdw=",
      "dev": true
    },
    "cbor": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/cbor/-/cbor-5.2.0.tgz",
      "integrity": "sha512-5IMhi9e1QU76ppa5/ajP1BmMWZ2FHkhAhjeVKQ/EFCgYSEaeVaoGtL7cxJskf9oCCk+XjzaIdc3IuU/dbA/o2A==",
      "dev": true,
      "requires": {
        "bignumber.js": "^9.0.1",
        "nofilter": "^1.0.4"
      }
    },
    "chai": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/chai/-/chai-4.2.0.tgz",
      "integrity": "sha512-XQU3bhBukrOsQCuwZndwGcCVQHyZi53fQ6Ys1Fym7E4olpIqqZZhhoFJoaKVvV17lWQoXYwgWN2nF5crA8J2jw==",
      "dev": true,
      "requires": {
        "assertion-error": "^1.1.0",
        "check-error": "^1.0.2",
        "deep-eql": "^3.0.1",
        "get-func-name": "^2.0.0",
        "pathval": "^1.1.0",
        "type-detect": "^4.0.5"
      }
    },
    "chalk": {
      "version": "2.4.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-2.4.2.tgz",
      "integrity": "sha512-Mti+f9lpJNcwF4tWV8/OrTTtF1gZi+f8FqlyAdouralcFWFQWF2+NgCHShjkCb+IFBLq9buZwE1xckQU4peSuQ==",
      "dev": true,
      "requires": {
        "ansi-styles": "^3.2.1",
        "escape-string-regexp": "^1.0.5",
        "supports-color": "^5.3.0"
      }
    },
    "charenc": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/charenc/-/charenc-0.0.2.tgz",
      "integrity": "sha1-wKHS86cJLgN3S/qD8UwPxXkKhmc=",
      "dev": true
    },
    "check-error": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/check-error/-/check-error-1.0.2.tgz",
      "integrity": "sha1-V00xLt2Iu13YkS6Sht1sCu1KrII=",
      "dev": true
    },
    "checkpoint-store": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/checkpoint-store/-/checkpoint-store-1.1.0.tgz",
      "integrity": "sha1-BOTLUWuRQziTWB5tRgGnjpVS6gY=",
      "dev": true,
      "requires": {
        "functional-red-black-tree": "^1.0.1"
      }
    },
    "chokidar": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.4.3.tgz",
      "integrity": "sha512-DtM3g7juCXQxFVSNPNByEC2+NImtBuxQQvWlHunpJIS5Ocr0lG306cC7FCi7cEA0fzmybPUIl4txBIobk1gGOQ==",
      "dev": true,
      "requires": {
        "anymatch": "~3.1.1",
        "braces": "~3.0.2",
        "fsevents": "~2.1.2",
        "glob-parent": "~5.1.0",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.5.0"
      }
    },
    "chownr": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/chownr/-/chownr-1.1.4.tgz",
      "integrity": "sha512-jJ0bqzaylmJtVnNgzTeSOs8DPavpbYgEr/b0YL8/2GO3xJEhInFmhKMUnEJQjZumK7KXGFhUy89PrsJWlakBVg==",
      "dev": true
    },
    "ci-info": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ci-info/-/ci-info-2.0.0.tgz",
      "integrity": "sha512-5tK7EtrZ0N+OLFMthtqOj4fI2Jeb88C4CAZPu25LDVUgXJ0A3Js4PMGqrn0JU1W0Mh1/Z8wZzYPxqUrXeBboCQ==",
      "dev": true
    },
    "cids": {
      "version": "0.7.5",
      "resolved": "https://registry.npmjs.org/cids/-/cids-0.7.5.tgz",
      "integrity": "sha512-zT7mPeghoWAu+ppn8+BS1tQ5qGmbMfB4AregnQjA/qHY3GC1m1ptI9GkWNlgeu38r7CuRdXB47uY2XgAYt6QVA==",
      "dev": true,
      "requires": {
        "buffer": "^5.5.0",
        "class-is": "^1.1.0",
        "multibase": "~0.6.0",
        "multicodec": "^1.0.0",
        "multihashes": "~0.4.15"
      },
      "dependencies": {
        "multicodec": {
          "version": "1.0.4",
          "resolved": "https://registry.npmjs.org/multicodec/-/multicodec-1.0.4.tgz",
          "integrity": "sha512-NDd7FeS3QamVtbgfvu5h7fd1IlbaC4EQ0/pgU4zqE2vdHCmBGsUa0TiM8/TdSeG6BMPC92OOCf8F1ocE/Wkrrg==",
          "dev": true,
          "requires": {
            "buffer": "^5.6.0",
            "varint": "^5.0.0"
          }
        }
      }
    },
    "cipher-base": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/cipher-base/-/cipher-base-1.0.4.tgz",
      "integrity": "sha512-Kkht5ye6ZGmwv40uUDZztayT2ThLQGfnj/T71N/XzeZeo3nf8foyW7zGTsPYkEya3m5f3cAypH+qe7YOrM1U2Q==",
      "dev": true,
      "requires": {
        "inherits": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "class-is": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/class-is/-/class-is-1.1.0.tgz",
      "integrity": "sha512-rhjH9AG1fvabIDoGRVH587413LPjTZgmDF9fOFCbFJQV4yuocX1mHxxvXI4g3cGwbVY9wAYIoKlg1N79frJKQw==",
      "dev": true
    },
    "class-utils": {
      "version": "0.3.6",
      "resolved": "https://registry.npmjs.org/class-utils/-/class-utils-0.3.6.tgz",
      "integrity": "sha512-qOhPa/Fj7s6TY8H8esGu5QNpMMQxz79h+urzrNYN6mn+9BnxlDGf5QZ+XeCDsxSjPqsSR56XOZOJmpeurnLMeg==",
      "dev": true,
      "requires": {
        "arr-union": "^3.1.0",
        "define-property": "^0.2.5",
        "isobject": "^3.0.0",
        "static-extend": "^0.1.1"
      },
      "dependencies": {
        "define-property": {
          "version": "0.2.5",
          "resolved": "https://registry.npmjs.org/define-property/-/define-property-0.2.5.tgz",
          "integrity": "sha1-w1se+RjsPJkPmlvFe+BKrOxcgRY=",
          "dev": true,
          "requires": {
            "is-descriptor": "^0.1.0"
          }
        },
        "is-accessor-descriptor": {
          "version": "0.1.6",
          "resolved": "https://registry.npmjs.org/is-accessor-descriptor/-/is-accessor-descriptor-0.1.6.tgz",
          "integrity": "sha1-qeEss66Nh2cn7u84Q/igiXtcmNY=",
          "dev": true,
          "requires": {
            "kind-of": "^3.0.2"
          },
          "dependencies": {
            "kind-of": {
              "version": "3.2.2",
              "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-3.2.2.tgz",
              "integrity": "sha1-MeohpzS6ubuw8yRm2JOupR5KPGQ=",
              "dev": true,
              "requires": {
                "is-buffer": "^1.1.5"
              }
            }
          }
        },
        "is-buffer": {
          "version": "1.1.6",
          "resolved": "https://registry.npmjs.org/is-buffer/-/is-buffer-1.1.6.tgz",
          "integrity": "sha512-NcdALwpXkTm5Zvvbk7owOUSvVvBKDgKP5/ewfXEznmQFfs4ZRmanOeKBTjRVjka3QFoN6XJ+9F3USqfHqTaU5w==",
          "dev": true
        },
        "is-data-descriptor": {
          "version": "0.1.4",
          "resolved": "https://registry.npmjs.org/is-data-descriptor/-/is-data-descriptor-0.1.4.tgz",
          "integrity": "sha1-C17mSDiOLIYCgueT8YVv7D8wG1Y=",
          "dev": true,
          "requires": {
            "kind-of": "^3.0.2"
          },
          "dependencies": {
            "kind-of": {
              "version": "3.2.2",
              "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-3.2.2.tgz",
              "integrity": "sha1-MeohpzS6ubuw8yRm2JOupR5KPGQ=",
              "dev": true,
              "requires": {
                "is-buffer": "^1.1.5"
              }
            }
          }
        },
        "is-descriptor": {
          "version": "0.1.6",
          "resolved": "https://registry.npmjs.org/is-descriptor/-/is-descriptor-0.1.6.tgz",
          "integrity": "sha512-avDYr0SB3DwO9zsMov0gKCESFYqCnE4hq/4z3TdUlukEy5t9C0YRq7HLrsN52NAcqXKaepeCD0n+B0arnVG3Hg==",
          "dev": true,
          "requires": {
            "is-accessor-descriptor": "^0.1.6",
            "is-data-descriptor": "^0.1.4",
            "kind-of": "^5.0.0"
          }
        },
        "kind-of": {
          "version": "5.1.0",
          "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-5.1.0.tgz",
          "integrity": "sha512-NGEErnH6F2vUuXDh+OlbcKW7/wOcfdRHaZ7VWtqCztfHri/++YKmP51OdWeGPuqCOba6kk2OTe5d02VmTB80Pw==",
          "dev": true
        }
      }
    },
    "cli-table3": {
      "version": "0.5.1",
      "resolved": "https://registry.npmjs.org/cli-table3/-/cli-table3-0.5.1.tgz",
      "integrity": "sha512-7Qg2Jrep1S/+Q3EceiZtQcDPWxhAvBw+ERf1162v4sikJrvojMHFqXt8QIVha8UlH9rgU0BeWPytZ9/TzYqlUw==",
      "dev": true,
      "requires": {
        "colors": "^1.1.2",
        "object-assign": "^4.1.0",
        "string-width": "^2.1.1"
      }
    },
    "cliui": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-5.0.0.tgz",
      "integrity": "sha512-PYeGSEmmHM6zvoef2w8TPzlrnNpXIjTipYK780YswmIP9vjxmd6Y2a3CB2Ks6/AU8NHjZugXvo8w3oWM2qnwXA==",
      "dev": true,
      "requires": {
        "string-width": "^3.1.0",
        "strip-ansi": "^5.2.0",
        "wrap-ansi": "^5.1.0"
      },
      "dependencies": {
        "ansi-regex": {
          "version": "4.1.0",
          "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-4.1.0.tgz",
          "integrity": "sha512-1apePfXM1UOSqw0o9IiFAovVz9M5S1Dg+4TrDwfMewQ6p/rmMueb7tWZjQ1rx4Loy1ArBggoqGpfqqdI4rondg==",
          "dev": true
        },
        "string-width": {
          "version": "3.1.0",
          "resolved": "https://registry.npmjs.org/string-width/-/string-width-3.1.0.tgz",
          "integrity": "sha512-vafcv6KjVZKSgz06oM/H6GDBrAtz8vdhQakGjFIvNrHA6y3HCF1CInLy+QLq8dTJPQ1b+KDUqDFctkdRW44e1w==",
          "dev": true,
          "requires": {
            "emoji-regex": "^7.0.1",
            "is-fullwidth-code-point": "^2.0.0",
            "strip-ansi": "^5.1.0"
          }
        },
        "strip-ansi": {
          "version": "5.2.0",
          "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-5.2.0.tgz",
          "integrity": "sha512-DuRs1gKbBqsMKIZlrffwlug8MHkcnpjs5VPmL1PAh+mA30U0DTotfDZ0d2UUsXpPmPmMMJ6W773MaA3J+lbiWA==",
          "dev": true,
          "requires": {
            "ansi-regex": "^4.1.0"
          }
        }
      }
    },
    "clone-response": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/clone-response/-/clone-response-1.0.2.tgz",
      "integrity": "sha1-0dyXOSAxTfZ/vrlCI7TuNQI56Ws=",
      "dev": true,
      "requires": {
        "mimic-response": "^1.0.0"
      }
    },
    "code-point-at": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/code-point-at/-/code-point-at-1.1.0.tgz",
      "integrity": "sha1-DQcLTQQ6W+ozovGkDi7bPZpMz3c=",
      "dev": true
    },
    "collection-visit": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/collection-visit/-/collection-visit-1.0.0.tgz",
      "integrity": "sha1-S8A3PBZLwykbTTaMgpzxqApZ3KA=",
      "dev": true,
      "requires": {
        "map-visit": "^1.0.0",
        "object-visit": "^1.0.0"
      }
    },
    "color-convert": {
      "version": "1.9.3",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-1.9.3.tgz",
      "integrity": "sha512-QfAUtd+vFdAtFQcC8CCyYt1fYWxSqAiK2cSD6zDB8N3cpsEBAvRxp9zOGg6G/SHHJYAT88/az/IuDGALsNVbGg==",
      "dev": true,
      "requires": {
        "color-name": "1.1.3"
      }
    },
    "color-name": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.3.tgz",
      "integrity": "sha1-p9BVi9icQveV3UIyj3QIMcpTvCU=",
      "dev": true
    },
    "colors": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/colors/-/colors-1.4.0.tgz",
      "integrity": "sha512-a+UqTh4kgZg/SlGvfbzDHpgRu7AAQOmmqRHJnxhRZICKFUT91brVhNNt58CMWU9PsBbv3PDCZUHbVxuDiH2mtA==",
      "dev": true
    },
    "combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "dev": true,
      "requires": {
        "delayed-stream": "~1.0.0"
      }
    },
    "command-exists": {
      "version": "1.2.9",
      "resolved": "https://registry.npmjs.org/command-exists/-/command-exists-1.2.9.tgz",
      "integrity": "sha512-LTQ/SGc+s0Xc0Fu5WaKnR0YiygZkm9eKFvyS+fRsU7/ZWFF8ykFM6Pc9aCVf1+xasOOZpO3BAVgVrKvsqKHV7w==",
      "dev": true
    },
    "commander": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/commander/-/commander-3.0.2.tgz",
      "integrity": "sha512-Gar0ASD4BDyKC4hl4DwHqDrmvjoxWKZigVnAbn5H1owvm4CxCPdb0HQDehwNYMJpla5+M2tPmPARzhtYuwpHow==",
      "dev": true
    },
    "component-emitter": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/component-emitter/-/component-emitter-1.3.0.tgz",
      "integrity": "sha512-Rd3se6QB+sO1TwqZjscQrurpEPIfO0/yYnSin6Q/rD3mOutHvUrCAhJub3r90uNb+SESBuE0QYoB90YdfatsRg==",
      "dev": true
    },
    "concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha1-2Klr13/Wjfd5OnMDajug1UBdR3s=",
      "dev": true
    },
    "concat-stream": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/concat-stream/-/concat-stream-1.6.2.tgz",
      "integrity": "sha512-27HBghJxjiZtIk3Ycvn/4kbJk/1uZuJFfuPEns6LaEvpvG1f0hTea8lilrouyo9mVc2GWdcEZ8OLoGmSADlrCw==",
      "dev": true,
      "requires": {
        "buffer-from": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^2.2.2",
        "typedarray": "^0.0.6"
      }
    },
    "content-disposition": {
      "version": "0.5.3",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-0.5.3.tgz",
      "integrity": "sha512-ExO0774ikEObIAEV9kDo50o+79VCUdEB6n6lzKgGwupcVeRlhrj3qGAfwq8G6uBJjkqLrhT0qEYFcWng8z1z0g==",
      "dev": true,
      "requires": {
        "safe-buffer": "5.1.2"
      },
      "dependencies": {
        "safe-buffer": {
          "version": "5.1.2",
          "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
          "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
          "dev": true
        }
      }
    },
    "content-hash": {
      "version": "2.5.2",
      "resolved": "https://registry.npmjs.org/content-hash/-/content-hash-2.5.2.tgz",
      "integrity": "sha512-FvIQKy0S1JaWV10sMsA7TRx8bpU+pqPkhbsfvOJAdjRXvYxEckAwQWGwtRjiaJfh+E0DvcWUGqcdjwMGFjsSdw==",
      "dev": true,
      "requires": {
        "cids": "^0.7.1",
        "multicodec": "^0.5.5",
        "multihashes": "^0.4.15"
      }
    },
    "content-type": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.4.tgz",
      "integrity": "sha512-hIP3EEPs8tB9AT1L+NUqtwOAps4mk2Zob89MWXMHjHWg9milF/j4osnnQLXBCBFBk/tvIG/tUc9mOUJiPBhPXA==",
      "dev": true
    },
    "cookie": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.4.1.tgz",
      "integrity": "sha512-ZwrFkGJxUR3EIoXtO+yVE69Eb7KlixbaeAWfBQB9vVsNn/o+Yw69gBWSSDK825hQNdN+wF8zELf3dFNl/kxkUA==",
      "dev": true
    },
    "cookie-signature": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.0.6.tgz",
      "integrity": "sha1-4wOogrNCzD7oylE6eZmXNNqzriw=",
      "dev": true
    },
    "cookiejar": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/cookiejar/-/cookiejar-2.1.2.tgz",
      "integrity": "sha512-Mw+adcfzPxcPeI+0WlvRrr/3lGVO0bD75SxX6811cxSh1Wbxx7xZBGK1eVtDf6si8rg2lhnUjsVLMFMfbRIuwA==",
      "dev": true
    },
    "copy-descriptor": {
      "version": "0.1.1",
      "resolved": "https://registry.npmjs.org/copy-descriptor/-/copy-descriptor-0.1.1.tgz",
      "integrity": "sha1-Z29us8OZl8LuGsOpJP1hJHSPV40=",
      "dev": true
    },
    "core-js-pure": {
      "version": "3.8.0",
      "resolved": "https://registry.npmjs.org/core-js-pure/-/core-js-pure-3.8.0.tgz",
      "integrity": "sha512-fRjhg3NeouotRoIV0L1FdchA6CK7ZD+lyINyMoz19SyV+ROpC4noS1xItWHFtwZdlqfMfVPJEyEGdfri2bD1pA==",
      "dev": true
    },
    "core-util-is": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/core-util-is/-/core-util-is-1.0.2.tgz",
      "integrity": "sha1-tf1UIgqivFq1eqtxQMlAdUUDwac=",
      "dev": true
    },
    "cors": {
      "version": "2.8.5",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.5.tgz",
      "integrity": "sha512-KIHbLJqu73RGr/hnbrO9uBeixNGuvSQjul/jdFvS/KFSIH1hWVd1ng7zOHx+YrEfInLG7q4n6GHQ9cDtxv/P6g==",
      "dev": true,
      "requires": {
        "object-assign": "^4",
        "vary": "^1"
      }
    },
    "create-ecdh": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/create-ecdh/-/create-ecdh-4.0.4.tgz",
      "integrity": "sha512-mf+TCx8wWc9VpuxfP2ht0iSISLZnt0JgWlrOKZiNqyUZWnjIaCIVNQArMHnCZKfEYRg6IM7A+NeJoN8gf/Ws0A==",
      "dev": true,
      "requires": {
        "bn.js": "^4.1.0",
        "elliptic": "^6.5.3"
      }
    },
    "create-hash": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/create-hash/-/create-hash-1.2.0.tgz",
      "integrity": "sha512-z00bCGNHDG8mHAkP7CtT1qVu+bFQUPjYq/4Iv3C3kWjTFV10zIjfSoeqXo9Asws8gwSHDGj/hl2u4OGIjapeCg==",
      "dev": true,
      "requires": {
        "cipher-base": "^1.0.1",
        "inherits": "^2.0.1",
        "md5.js": "^1.3.4",
        "ripemd160": "^2.0.1",
        "sha.js": "^2.4.0"
      }
    },
    "create-hmac": {
      "version": "1.1.7",
      "resolved": "https://registry.npmjs.org/create-hmac/-/create-hmac-1.1.7.tgz",
      "integrity": "sha512-MJG9liiZ+ogc4TzUwuvbER1JRdgvUFSB5+VR/g5h82fGaIRWMWddtKBHi7/sVhfjQZ6SehlyhvQYrcYkaUIpLg==",
      "dev": true,
      "requires": {
        "cipher-base": "^1.0.3",
        "create-hash": "^1.1.0",
        "inherits": "^2.0.1",
        "ripemd160": "^2.0.0",
        "safe-buffer": "^5.0.1",
        "sha.js": "^2.4.8"
      }
    },
    "cross-spawn": {
      "version": "6.0.5",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-6.0.5.tgz",
      "integrity": "sha512-eTVLrBSt7fjbDygz805pMnstIs2VTBNkRm0qxZd+M7A5XDdxVRWO5MxGBXZhjY4cqLYLdtrGqRf8mBPmzwSpWQ==",
      "dev": true,
      "requires": {
        "nice-try": "^1.0.4",
        "path-key": "^2.0.1",
        "semver": "^5.5.0",
        "shebang-command": "^1.2.0",
        "which": "^1.2.9"
      },
      "dependencies": {
        "semver": {
          "version": "5.7.1",
          "resolved": "https://registry.npmjs.org/semver/-/semver-5.7.1.tgz",
          "integrity": "sha512-sauaDf/PZdVgrLTNYHRtpXa1iRiKcaebiKQ1BJdpQlWH2lCvexQdX55snPFyK7QzpudqbCI0qXFfOasHdyNDGQ==",
          "dev": true
        }
      }
    },
    "crypt": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/crypt/-/crypt-0.0.2.tgz",
      "integrity": "sha1-iNf/fsDfuG9xPch7u0LQRNPmxBs=",
      "dev": true
    },
    "crypto-browserify": {
      "version": "3.12.0",
      "resolved": "https://registry.npmjs.org/crypto-browserify/-/crypto-browserify-3.12.0.tgz",
      "integrity": "sha512-fz4spIh+znjO2VjL+IdhEpRJ3YN6sMzITSBijk6FK2UvTqruSQW+/cCZTSNsMiZNvUeq0CqurF+dAbyiGOY6Wg==",
      "dev": true,
      "requires": {
        "browserify-cipher": "^1.0.0",
        "browserify-sign": "^4.0.0",
        "create-ecdh": "^4.0.0",
        "create-hash": "^1.1.0",
        "create-hmac": "^1.1.0",
        "diffie-hellman": "^5.0.0",
        "inherits": "^2.0.1",
        "pbkdf2": "^3.0.3",
        "public-encrypt": "^4.0.0",
        "randombytes": "^2.0.0",
        "randomfill": "^1.0.3"
      }
    },
    "d": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/d/-/d-1.0.1.tgz",
      "integrity": "sha512-m62ShEObQ39CfralilEQRjH6oAMtNCV1xJyEx5LpRYUVN+EviphDgUc/F3hnYbADmkiNs67Y+3ylmlG7Lnu+FA==",
      "dev": true,
      "requires": {
        "es5-ext": "^0.10.50",
        "type": "^1.0.1"
      }
    },
    "dashdash": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/dashdash/-/dashdash-1.14.1.tgz",
      "integrity": "sha1-hTz6D3y+L+1d4gMmuN1YEDX24vA=",
      "dev": true,
      "requires": {
        "assert-plus": "^1.0.0"
      }
    },
    "death": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/death/-/death-1.1.0.tgz",
      "integrity": "sha1-AaqcQB7dknUFFEcLgmY5DGbGcxg=",
      "dev": true
    },
    "debug": {
      "version": "4.3.1",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.1.tgz",
      "integrity": "sha512-doEwdvm4PCeK4K3RQN2ZC2BYUBaxwLARCqZmMjtF8a51J2Rb0xpVloFRnCODwqjpwnAoao4pelN8l3RJdv3gRQ==",
      "dev": true,
      "requires": {
        "ms": "2.1.2"
      }
    },
    "decamelize": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-1.2.0.tgz",
      "integrity": "sha1-9lNNFRSCabIDUue+4m9QH5oZEpA=",
      "dev": true
    },
    "decode-uri-component": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/decode-uri-component/-/decode-uri-component-0.2.0.tgz",
      "integrity": "sha1-6zkTMzRYd1y4TNGh+uBiEGu4dUU=",
      "dev": true
    },
    "decompress-response": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/decompress-response/-/decompress-response-3.3.0.tgz",
      "integrity": "sha1-gKTdMjdIOEv6JICDYirt7Jgq3/M=",
      "dev": true,
      "requires": {
        "mimic-response": "^1.0.0"
      }
    },
    "deep-eql": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/deep-eql/-/deep-eql-3.0.1.tgz",
      "integrity": "sha512-+QeIQyN5ZuO+3Uk5DYh6/1eKO0m0YmJFGNmFHGACpf1ClL1nmlV/p4gNgbl2pJGxgXb4faqo6UE+M5ACEMyVcw==",
      "dev": true,
      "requires": {
        "type-detect": "^4.0.0"
      }
    },
    "deep-is": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.3.tgz",
      "integrity": "sha1-s2nW+128E+7PUk+RsHD+7cNXzzQ=",
      "dev": true
    },
    "defer-to-connect": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/defer-to-connect/-/defer-to-connect-1.1.3.tgz",
      "integrity": "sha512-0ISdNousHvZT2EiFlZeZAHBUvSxmKswVCEf8hW7KWgG4a8MVEu/3Vb6uWYozkjylyCxe0JBIiRB1jV45S70WVQ==",
      "dev": true
    },
    "deferred-leveldown": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/deferred-leveldown/-/deferred-leveldown-4.0.2.tgz",
      "integrity": "sha512-5fMC8ek8alH16QiV0lTCis610D1Zt1+LA4MS4d63JgS32lrCjTFDUFz2ao09/j2I4Bqb5jL4FZYwu7Jz0XO1ww==",
      "dev": true,
      "requires": {
        "abstract-leveldown": "~5.0.0",
        "inherits": "^2.0.3"
      }
    },
    "define-properties": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.1.3.tgz",
      "integrity": "sha512-3MqfYKj2lLzdMSf8ZIZE/V+Zuy+BgD6f164e8K2w7dgnpKArBDerGYpM46IYYcjnkdPNMjPk9A6VFB8+3SKlXQ==",
      "dev": true,
      "requires": {
        "object-keys": "^1.0.12"
      }
    },
    "define-property": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/define-property/-/define-property-2.0.2.tgz",
      "integrity": "sha512-jwK2UV4cnPpbcG7+VRARKTZPUWowwXA8bzH5NP6ud0oeAxyYPuGZUAC7hMugpCdz4BeSZl2Dl9k66CHJ/46ZYQ==",
      "dev": true,
      "requires": {
        "is-descriptor": "^1.0.2",
        "isobject": "^3.0.1"
      }
    },
    "delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha1-3zrhmayt+31ECqrgsp4icrJOxhk=",
      "dev": true
    },
    "depd": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/depd/-/depd-1.1.2.tgz",
      "integrity": "sha1-m81S4UwJd2PnSbJ0xDRu0uVgtak=",
      "dev": true
    },
    "des.js": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/des.js/-/des.js-1.0.1.tgz",
      "integrity": "sha512-Q0I4pfFrv2VPd34/vfLrFOoRmlYj3OV50i7fskps1jZWK1kApMWWT9G6RRUeYedLcBDIhnSDaUvJMb3AhUlaEA==",
      "dev": true,
      "requires": {
        "inherits": "^2.0.1",
        "minimalistic-assert": "^1.0.0"
      }
    },
    "destroy": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/destroy/-/destroy-1.0.4.tgz",
      "integrity": "sha1-l4hXRCxEdJ5CBmE+N5RiBYJqvYA=",
      "dev": true
    },
    "detect-port": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/detect-port/-/detect-port-1.3.0.tgz",
      "integrity": "sha512-E+B1gzkl2gqxt1IhUzwjrxBKRqx1UzC3WLONHinn8S3T6lwV/agVCyitiFOsGJ/eYuEUBvD71MZHy3Pv1G9doQ==",
      "dev": true,
      "requires": {
        "address": "^1.0.1",
        "debug": "^2.6.0"
      },
      "dependencies": {
        "debug": {
          "version": "2.6.9",
          "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
          "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
          "dev": true,
          "requires": {
            "ms": "2.0.0"
          }
        },
        "ms": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
          "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
          "dev": true
        }
      }
    },
    "diff": {
      "version": "3.5.0",
      "resolved": "https://registry.npmjs.org/diff/-/diff-3.5.0.tgz",
      "integrity": "sha512-A46qtFgd+g7pDZinpnwiRJtxbC1hpgf0uzP3iG89scHk0AUC7A1TGxf5OiiOUv/JMZR8GOt8hL900hV0bOy5xA==",
      "dev": true
    },
    "diffie-hellman": {
      "version": "5.0.3",
      "resolved": "https://registry.npmjs.org/diffie-hellman/-/diffie-hellman-5.0.3.tgz",
      "integrity": "sha512-kqag/Nl+f3GwyK25fhUMYj81BUOrZ9IuJsjIcDE5icNM9FJHAVm3VcUDxdLPoQtTuUylWm6ZIknYJwwaPxsUzg==",
      "dev": true,
      "requires": {
        "bn.js": "^4.1.0",
        "miller-rabin": "^4.0.0",
        "randombytes": "^2.0.0"
      }
    },
    "dir-glob": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/dir-glob/-/dir-glob-3.0.1.tgz",
      "integrity": "sha512-WkrWp9GR4KXfKGYzOLmTuGVi1UWFfws377n9cc55/tb6DuqyF6pcQ5AbiHEshaDpY9v6oaSr2XCDidGmMwdzIA==",
      "dev": true,
      "requires": {
        "path-type": "^4.0.0"
      },
      "dependencies": {
        "path-type": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/path-type/-/path-type-4.0.0.tgz",
          "integrity": "sha512-gDKb8aZMDeD/tZWs9P6+q0J9Mwkdl6xMV8TjnGP3qJVJ06bdMgkbBlLU8IdfOsIsFz2BW1rNVT3XuNEl8zPAvw==",
          "dev": true
        }
      }
    },
    "dir-to-object": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/dir-to-object/-/dir-to-object-2.0.0.tgz",
      "integrity": "sha512-sXs0JKIhymON7T1UZuO2Ud6VTNAx/VTBXIl4+3mjb2RgfOpt+hectX0x04YqPOPdkeOAKoJuKqwqnXXURNPNEA==",
      "dev": true
    },
    "dom-walk": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/dom-walk/-/dom-walk-0.1.2.tgz",
      "integrity": "sha512-6QvTW9mrGeIegrFXdtQi9pk7O/nSK6lSdXW2eqUspN5LWD7UTji2Fqw5V2YLjBpHEoU9Xl/eUWNpDeZvoyOv2w==",
      "dev": true
    },
    "drbg.js": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/drbg.js/-/drbg.js-1.0.1.tgz",
      "integrity": "sha1-Pja2xCs3BDgjzbwzLVjzHiRFSAs=",
      "dev": true,
      "requires": {
        "browserify-aes": "^1.0.6",
        "create-hash": "^1.1.2",
        "create-hmac": "^1.1.4"
      }
    },
    "duplexer3": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/duplexer3/-/duplexer3-0.1.4.tgz",
      "integrity": "sha1-7gHdHKwO08vH/b6jfcCo8c4ALOI=",
      "dev": true
    },
    "ecc-jsbn": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/ecc-jsbn/-/ecc-jsbn-0.1.2.tgz",
      "integrity": "sha1-OoOpBOVDUyh4dMVkt1SThoSamMk=",
      "dev": true,
      "requires": {
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.1.0"
      }
    },
    "ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha1-WQxhFWsK4vTwJVcyoViyZrxWsh0=",
      "dev": true
    },
    "elliptic": {
      "version": "6.5.3",
      "resolved": "https://registry.npmjs.org/elliptic/-/elliptic-6.5.3.tgz",
      "integrity": "sha512-IMqzv5wNQf+E6aHeIqATs0tOLeOTwj1QKbRcS3jBbYkl5oLAserA8yJTT7/VyHUYG91PRmPyeQDObKLPpeS4dw==",
      "dev": true,
      "requires": {
        "bn.js": "^4.4.0",
        "brorand": "^1.0.1",
        "hash.js": "^1.0.0",
        "hmac-drbg": "^1.0.0",
        "inherits": "^2.0.1",
        "minimalistic-assert": "^1.0.0",
        "minimalistic-crypto-utils": "^1.0.0"
      }
    },
    "emoji-regex": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-7.0.3.tgz",
      "integrity": "sha512-CwBLREIQ7LvYFB0WyRvwhq5N5qPhc6PMjD6bYggFlI5YyDgl+0vxq5VHbMOFqLg7hfWzmu8T5Z1QofhmTIhItA==",
      "dev": true
    },
    "encode-utf8": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/encode-utf8/-/encode-utf8-1.0.3.tgz",
      "integrity": "sha512-ucAnuBEhUK4boH2HjVYG5Q2mQyPorvv0u/ocS+zhdw0S8AlHYY+GOFhP1Gio5z4icpP2ivFSvhtFjQi8+T9ppw==",
      "dev": true
    },
    "encodeurl": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-1.0.2.tgz",
      "integrity": "sha1-rT/0yG7C0CkyL1oCw6mmBslbP1k=",
      "dev": true
    },
    "encoding-down": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/encoding-down/-/encoding-down-5.0.4.tgz",
      "integrity": "sha512-8CIZLDcSKxgzT+zX8ZVfgNbu8Md2wq/iqa1Y7zyVR18QBEAc0Nmzuvj/N5ykSKpfGzjM8qxbaFntLPwnVoUhZw==",
      "dev": true,
      "requires": {
        "abstract-leveldown": "^5.0.0",
        "inherits": "^2.0.3",
        "level-codec": "^9.0.0",
        "level-errors": "^2.0.0",
        "xtend": "^4.0.1"
      }
    },
    "end-of-stream": {
      "version": "1.4.4",
      "resolved": "https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.4.tgz",
      "integrity": "sha512-+uw1inIHVPQoaVuHzRyXd21icM+cnt4CzD5rW+NC1wjOUSTOs+Te7FOv7AhN7vS9x/oIyhLP5PR1H+phQAHu5Q==",
      "dev": true,
      "requires": {
        "once": "^1.4.0"
      }
    },
    "enquirer": {
      "version": "2.3.6",
      "resolved": "https://registry.npmjs.org/enquirer/-/enquirer-2.3.6.tgz",
      "integrity": "sha512-yjNnPr315/FjS4zIsUxYguYUPP2e1NK4d7E7ZOLiyYCcbFBiTMyID+2wvm2w6+pZ/odMA7cRkjhsPbltwBOrLg==",
      "dev": true,
      "requires": {
        "ansi-colors": "^4.1.1"
      }
    },
    "env-paths": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/env-paths/-/env-paths-2.2.0.tgz",
      "integrity": "sha512-6u0VYSCo/OW6IoD5WCLLy9JUGARbamfSavcNXry/eu8aHVFei6CD3Sw+VGX5alea1i9pgPHW0mbu6Xj0uBh7gA==",
      "dev": true
    },
    "errno": {
      "version": "0.1.7",
      "resolved": "https://registry.npmjs.org/errno/-/errno-0.1.7.tgz",
      "integrity": "sha512-MfrRBDWzIWifgq6tJj60gkAwtLNb6sQPlcFrSOflcP1aFmmruKQ2wRnze/8V6kgyz7H3FF8Npzv78mZ7XLLflg==",
      "dev": true,
      "requires": {
        "prr": "~1.0.1"
      }
    },
    "error-ex": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/error-ex/-/error-ex-1.3.2.tgz",
      "integrity": "sha512-7dFHNmqeFSEt2ZBsCriorKnn3Z2pj+fd9kmI6QoWw4//DL+icEBfc0U7qJCisqrTsKTjw4fNFy2pW9OqStD84g==",
      "dev": true,
      "requires": {
        "is-arrayish": "^0.2.1"
      }
    },
    "es-abstract": {
      "version": "1.18.0-next.1",
      "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.18.0-next.1.tgz",
      "integrity": "sha512-I4UGspA0wpZXWENrdA0uHbnhte683t3qT/1VFH9aX2dA5PPSf6QW5HHXf5HImaqPmjXaVeVk4RGWnaylmV7uAA==",
      "dev": true,
      "requires": {
        "es-to-primitive": "^1.2.1",
        "function-bind": "^1.1.1",
        "has": "^1.0.3",
        "has-symbols": "^1.0.1",
        "is-callable": "^1.2.2",
        "is-negative-zero": "^2.0.0",
        "is-regex": "^1.1.1",
        "object-inspect": "^1.8.0",
        "object-keys": "^1.1.1",
        "object.assign": "^4.1.1",
        "string.prototype.trimend": "^1.0.1",
        "string.prototype.trimstart": "^1.0.1"
      },
      "dependencies": {
        "object.assign": {
          "version": "4.1.2",
          "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.2.tgz",
          "integrity": "sha512-ixT2L5THXsApyiUPYKmW+2EHpXXe5Ii3M+f4e+aJFAHao5amFRW6J0OO6c/LU8Be47utCx2GL89hxGB6XSmKuQ==",
          "dev": true,
          "requires": {
            "call-bind": "^1.0.0",
            "define-properties": "^1.1.3",
            "has-symbols": "^1.0.1",
            "object-keys": "^1.1.1"
          }
        }
      }
    },
    "es-to-primitive": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.2.1.tgz",
      "integrity": "sha512-QCOllgZJtaUo9miYBcLChTUaHNjJF3PYs1VidD7AwiEj1kYxKeQTctLAezAOH5ZKRH0g2IgPn6KwB4IT8iRpvA==",
      "dev": true,
      "requires": {
        "is-callable": "^1.1.4",
        "is-date-object": "^1.0.1",
        "is-symbol": "^1.0.2"
      }
    },
    "es5-ext": {
      "version": "0.10.53",
      "resolved": "https://registry.npmjs.org/es5-ext/-/es5-ext-0.10.53.tgz",
      "integrity": "sha512-Xs2Stw6NiNHWypzRTY1MtaG/uJlwCk8kH81920ma8mvN8Xq1gsfhZvpkImLQArw8AHnv8MT2I45J3c0R8slE+Q==",
      "dev": true,
      "requires": {
        "es6-iterator": "~2.0.3",
        "es6-symbol": "~3.1.3",
        "next-tick": "~1.0.0"
      }
    },
    "es6-iterator": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/es6-iterator/-/es6-iterator-2.0.3.tgz",
      "integrity": "sha1-p96IkUGgWpSwhUQDstCg+/qY87c=",
      "dev": true,
      "requires": {
        "d": "1",
        "es5-ext": "^0.10.35",
        "es6-symbol": "^3.1.1"
      }
    },
    "es6-symbol": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/es6-symbol/-/es6-symbol-3.1.3.tgz",
      "integrity": "sha512-NJ6Yn3FuDinBaBRWl/q5X/s4koRHBrgKAu+yGI6JCBeiu3qrcbJhwT2GeR/EXVfylRk8dpQVJoLEFhK+Mu31NA==",
      "dev": true,
      "requires": {
        "d": "^1.0.1",
        "ext": "^1.1.2"
      }
    },
    "escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha1-Aljq5NPQwJdN4cFpGI7wBR0dGYg=",
      "dev": true
    },
    "escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha1-G2HAViGQqN/2rjuyzwIAyhMLhtQ=",
      "dev": true
    },
    "escodegen": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/escodegen/-/escodegen-1.8.1.tgz",
      "integrity": "sha1-WltTr0aTEQvrsIZ6o0MN07cKEBg=",
      "dev": true,
      "requires": {
        "esprima": "^2.7.1",
        "estraverse": "^1.9.1",
        "esutils": "^2.0.2",
        "optionator": "^0.8.1",
        "source-map": "~0.2.0"
      },
      "dependencies": {
        "esprima": {
          "version": "2.7.3",
          "resolved": "https://registry.npmjs.org/esprima/-/esprima-2.7.3.tgz",
          "integrity": "sha1-luO3DVd59q1JzQMmc9HDEnZ7pYE=",
          "dev": true
        },
        "source-map": {
          "version": "0.2.0",
          "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.2.0.tgz",
          "integrity": "sha1-2rc/vPwrqBm03gO9b26qSBZLP50=",
          "dev": true,
          "optional": true,
          "requires": {
            "amdefine": ">=0.0.4"
          }
        }
      }
    },
    "esprima": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/esprima/-/esprima-4.0.1.tgz",
      "integrity": "sha512-eGuFFw7Upda+g4p+QHvnW0RyTX/SVeJBDM/gCtMARO0cLuT2HcEKnTPvhjV6aGeqrCB/sbNop0Kszm0jsaWU4A==",
      "dev": true
    },
    "estraverse": {
      "version": "1.9.3",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-1.9.3.tgz",
      "integrity": "sha1-r2fy3JIlgkFZUJJgkaQAXSnJu0Q=",
      "dev": true
    },
    "esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "dev": true
    },
    "etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha1-Qa4u62XvpiJorr/qg6x9eSmbCIc=",
      "dev": true
    },
    "eth-ens-namehash": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/eth-ens-namehash/-/eth-ens-namehash-2.0.8.tgz",
      "integrity": "sha1-IprEbsqG1S4MmR58sq74P/D2i88=",
      "dev": true,
      "requires": {
        "idna-uts46-hx": "^2.3.1",
        "js-sha3": "^0.5.7"
      },
      "dependencies": {
        "js-sha3": {
          "version": "0.5.7",
          "resolved": "https://registry.npmjs.org/js-sha3/-/js-sha3-0.5.7.tgz",
          "integrity": "sha1-DU/9gALVMzqrr0oj7tL2N0yfKOc=",
          "dev": true
        }
      }
    },
    "eth-gas-reporter": {
      "version": "0.2.20",
      "resolved": "https://registry.npmjs.org/eth-gas-reporter/-/eth-gas-reporter-0.2.20.tgz",
      "integrity": "sha512-gp/PhKrr3hYEEFg5emIQxbhQkVH2mg+iHcM6GvqhzFx5IkZGeQx+5oNzYDEfBXQefcA90rwWHId6eCty6jbdDA==",
      "dev": true,
      "requires": {
        "@ethersproject/abi": "^5.0.0-beta.146",
        "@solidity-parser/parser": "^0.8.2",
        "cli-table3": "^0.5.0",
        "colors": "^1.1.2",
        "ethereumjs-util": "6.2.0",
        "ethers": "^4.0.40",
        "fs-readdir-recursive": "^1.1.0",
        "lodash": "^4.17.14",
        "markdown-table": "^1.1.3",
        "mocha": "^7.1.1",
        "req-cwd": "^2.0.0",
        "request": "^2.88.0",
        "request-promise-native": "^1.0.5",
        "sha1": "^1.1.1",
        "sync-request": "^6.0.0"
      },
      "dependencies": {
        "@solidity-parser/parser": {
          "version": "0.8.2",
          "resolved": "https://registry.npmjs.org/@solidity-parser/parser/-/parser-0.8.2.tgz",
          "integrity": "sha512-8LySx3qrNXPgB5JiULfG10O3V7QTxI/TLzSw5hFQhXWSkVxZBAv4rZQ0sYgLEbc8g3L2lmnujj1hKul38Eu5NQ==",
          "dev": true
        },
        "ethereumjs-util": {
          "version": "6.2.0",
          "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-6.2.0.tgz",
          "integrity": "sha512-vb0XN9J2QGdZGIEKG2vXM+kUdEivUfU6Wmi5y0cg+LRhDYKnXIZ/Lz7XjFbHRR9VIKq2lVGLzGBkA++y2nOdOQ==",
          "dev": true,
          "requires": {
            "@types/bn.js": "^4.11.3",
            "bn.js": "^4.11.0",
            "create-hash": "^1.1.2",
            "ethjs-util": "0.1.6",
            "keccak": "^2.0.0",
            "rlp": "^2.2.3",
            "secp256k1": "^3.0.1"
          }
        },
        "ethers": {
          "version": "4.0.48",
          "resolved": "https://registry.npmjs.org/ethers/-/ethers-4.0.48.tgz",
          "integrity": "sha512-sZD5K8H28dOrcidzx9f8KYh8083n5BexIO3+SbE4jK83L85FxtpXZBCQdXb8gkg+7sBqomcLhhkU7UHL+F7I2g==",
          "dev": true,
          "requires": {
            "aes-js": "3.0.0",
            "bn.js": "^4.4.0",
            "elliptic": "6.5.3",
            "hash.js": "1.1.3",
            "js-sha3": "0.5.7",
            "scrypt-js": "2.0.4",
            "setimmediate": "1.0.4",
            "uuid": "2.0.1",
            "xmlhttprequest": "1.8.0"
          }
        },
        "hash.js": {
          "version": "1.1.3",
          "resolved": "https://registry.npmjs.org/hash.js/-/hash.js-1.1.3.tgz",
          "integrity": "sha512-/UETyP0W22QILqS+6HowevwhEFJ3MBJnwTf75Qob9Wz9t0DPuisL8kW8YZMK62dHAKE1c1p+gY1TtOLY+USEHA==",
          "dev": true,
          "requires": {
            "inherits": "^2.0.3",
            "minimalistic-assert": "^1.0.0"
          }
        },
        "js-sha3": {
          "version": "0.5.7",
          "resolved": "https://registry.npmjs.org/js-sha3/-/js-sha3-0.5.7.tgz",
          "integrity": "sha1-DU/9gALVMzqrr0oj7tL2N0yfKOc=",
          "dev": true
        },
        "keccak": {
          "version": "2.1.0",
          "resolved": "https://registry.npmjs.org/keccak/-/keccak-2.1.0.tgz",
          "integrity": "sha512-m1wbJRTo+gWbctZWay9i26v5fFnYkOn7D5PCxJ3fZUGUEb49dE1Pm4BREUYCt/aoO6di7jeoGmhvqN9Nzylm3Q==",
          "dev": true,
          "requires": {
            "bindings": "^1.5.0",
            "inherits": "^2.0.4",
            "nan": "^2.14.0",
            "safe-buffer": "^5.2.0"
          }
        },
        "scrypt-js": {
          "version": "2.0.4",
          "resolved": "https://registry.npmjs.org/scrypt-js/-/scrypt-js-2.0.4.tgz",
          "integrity": "sha512-4KsaGcPnuhtCZQCxFxN3GVYIhKFPTdLd8PLC552XwbMndtD0cjRFAhDuuydXQ0h08ZfPgzqe6EKHozpuH74iDw==",
          "dev": true
        },
        "secp256k1": {
          "version": "3.8.0",
          "resolved": "https://registry.npmjs.org/secp256k1/-/secp256k1-3.8.0.tgz",
          "integrity": "sha512-k5ke5avRZbtl9Tqx/SA7CbY3NF6Ro+Sj9cZxezFzuBlLDmyqPiL8hJJ+EmzD8Ig4LUDByHJ3/iPOVoRixs/hmw==",
          "dev": true,
          "requires": {
            "bindings": "^1.5.0",
            "bip66": "^1.1.5",
            "bn.js": "^4.11.8",
            "create-hash": "^1.2.0",
            "drbg.js": "^1.0.1",
            "elliptic": "^6.5.2",
            "nan": "^2.14.0",
            "safe-buffer": "^5.1.2"
          }
        },
        "setimmediate": {
          "version": "1.0.4",
          "resolved": "https://registry.npmjs.org/setimmediate/-/setimmediate-1.0.4.tgz",
          "integrity": "sha1-IOgd5iLUoCWIzgyNqJc8vPHTE48=",
          "dev": true
        },
        "uuid": {
          "version": "2.0.1",
          "resolved": "https://registry.npmjs.org/uuid/-/uuid-2.0.1.tgz",
          "integrity": "sha1-wqMN7bPlNdcsz4LjQ5QaULqFM6w=",
          "dev": true
        }
      }
    },
    "eth-lib": {
      "version": "0.2.8",
      "resolved": "https://registry.npmjs.org/eth-lib/-/eth-lib-0.2.8.tgz",
      "integrity": "sha512-ArJ7x1WcWOlSpzdoTBX8vkwlkSQ85CjjifSZtV4co64vWxSV8geWfPI9x4SVYu3DSxnX4yWFVTtGL+j9DUFLNw==",
      "dev": true,
      "requires": {
        "bn.js": "^4.11.6",
        "elliptic": "^6.4.0",
        "xhr-request-promise": "^0.1.2"
      }
    },
    "eth-sig-util": {
      "version": "2.5.2",
      "resolved": "https://registry.npmjs.org/eth-sig-util/-/eth-sig-util-2.5.2.tgz",
      "integrity": "sha512-xvDojS/4reXsw8Pz/+p/qcM5rVB61FOdPbEtMZ8FQ0YHnPEzPy5F8zAAaZ+zj5ud0SwRLWPfor2Cacjm7EzMIw==",
      "dev": true,
      "requires": {
        "buffer": "^5.2.1",
        "elliptic": "^6.4.0",
        "ethereumjs-abi": "0.6.5",
        "ethereumjs-util": "^5.1.1",
        "tweetnacl": "^1.0.0",
        "tweetnacl-util": "^0.15.0"
      },
      "dependencies": {
        "ethereumjs-abi": {
          "version": "0.6.5",
          "resolved": "https://registry.npmjs.org/ethereumjs-abi/-/ethereumjs-abi-0.6.5.tgz",
          "integrity": "sha1-WmN+8Wq0NHP6cqKa2QhxQFs/UkE=",
          "dev": true,
          "requires": {
            "bn.js": "^4.10.0",
            "ethereumjs-util": "^4.3.0"
          },
          "dependencies": {
            "ethereumjs-util": {
              "version": "4.5.1",
              "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-4.5.1.tgz",
              "integrity": "sha512-WrckOZ7uBnei4+AKimpuF1B3Fv25OmoRgmYCpGsP7u8PFxXAmAgiJSYT2kRWnt6fVIlKaQlZvuwXp7PIrmn3/w==",
              "dev": true,
              "requires": {
                "bn.js": "^4.8.0",
                "create-hash": "^1.1.2",
                "elliptic": "^6.5.2",
                "ethereum-cryptography": "^0.1.3",
                "rlp": "^2.0.0"
              }
            }
          }
        },
        "ethereumjs-util": {
          "version": "5.2.1",
          "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
          "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
          "dev": true,
          "requires": {
            "bn.js": "^4.11.0",
            "create-hash": "^1.1.2",
            "elliptic": "^6.5.2",
            "ethereum-cryptography": "^0.1.3",
            "ethjs-util": "^0.1.3",
            "rlp": "^2.0.0",
            "safe-buffer": "^5.1.1"
          }
        }
      }
    },
    "ethashjs": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/ethashjs/-/ethashjs-0.0.8.tgz",
      "integrity": "sha512-/MSbf/r2/Ld8o0l15AymjOTlPqpN8Cr4ByUEA9GtR4x0yAh3TdtDzEg29zMjXCNPI7u6E5fOQdj/Cf9Tc7oVNw==",
      "dev": true,
      "requires": {
        "async": "^2.1.2",
        "buffer-xor": "^2.0.1",
        "ethereumjs-util": "^7.0.2",
        "miller-rabin": "^4.0.0"
      },
      "dependencies": {
        "bn.js": {
          "version": "5.1.3",
          "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-5.1.3.tgz",
          "integrity": "sha512-GkTiFpjFtUzU9CbMeJ5iazkCzGL3jrhzerzZIuqLABjbwRaFt33I9tUdSNryIptM+RxDet6OKm2WnLXzW51KsQ==",
          "dev": true
        },
        "buffer-xor": {
          "version": "2.0.2",
          "resolved": "https://registry.npmjs.org/buffer-xor/-/buffer-xor-2.0.2.tgz",
          "integrity": "sha512-eHslX0bin3GB+Lx2p7lEYRShRewuNZL3fUl4qlVJGGiwoPGftmt8JQgk2Y9Ji5/01TnVDo33E5b5O3vUB1HdqQ==",
          "dev": true,
          "requires": {
            "safe-buffer": "^5.1.1"
          }
        },
        "ethereumjs-util": {
          "version": "7.0.7",
          "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-7.0.7.tgz",
          "integrity": "sha512-vU5rtZBlZsgkTw3o6PDKyB8li2EgLavnAbsKcfsH2YhHH1Le+PP8vEiMnAnvgc1B6uMoaM5GDCrVztBw0Q5K9g==",
          "dev": true,
          "requires": {
            "@types/bn.js": "^4.11.3",
            "bn.js": "^5.1.2",
            "create-hash": "^1.1.2",
            "ethereum-cryptography": "^0.1.3",
            "ethjs-util": "0.1.6",
            "rlp": "^2.2.4"
          }
        }
      }
    },
    "ethereum-bloom-filters": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/ethereum-bloom-filters/-/ethereum-bloom-filters-1.0.7.tgz",
      "integrity": "sha512-cDcJJSJ9GMAcURiAWO3DxIEhTL/uWqlQnvgKpuYQzYPrt/izuGU+1ntQmHt0IRq6ADoSYHFnB+aCEFIldjhkMQ==",
      "dev": true,
      "requires": {
        "js-sha3": "^0.8.0"
      }
    },
    "ethereum-cryptography": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/ethereum-cryptography/-/ethereum-cryptography-0.1.3.tgz",
      "integrity": "sha512-w8/4x1SGGzc+tO97TASLja6SLd3fRIK2tLVcV2Gx4IB21hE19atll5Cq9o3d0ZmAYC/8aw0ipieTSiekAea4SQ==",
      "dev": true,
      "requires": {
        "@types/pbkdf2": "^3.0.0",
        "@types/secp256k1": "^4.0.1",
        "blakejs": "^1.1.0",
        "browserify-aes": "^1.2.0",
        "bs58check": "^2.1.2",
        "create-hash": "^1.2.0",
        "create-hmac": "^1.1.7",
        "hash.js": "^1.1.7",
        "keccak": "^3.0.0",
        "pbkdf2": "^3.0.17",
        "randombytes": "^2.1.0",
        "safe-buffer": "^5.1.2",
        "scrypt-js": "^3.0.0",
        "secp256k1": "^4.0.1",
        "setimmediate": "^1.0.5"
      }
    },
    "ethereum-waffle": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/ethereum-waffle/-/ethereum-waffle-3.2.1.tgz",
      "integrity": "sha512-Fhg7BaBuV+Xo5XT+NEC3UTKGunvpq+iQPglZbIAJF6ZcwQwkiKfJUDuB0ZSkg5ntbRS4gpahfoXj1nTzdtx8UA==",
      "dev": true,
      "requires": {
        "@ethereum-waffle/chai": "^3.2.1",
        "@ethereum-waffle/compiler": "^3.2.1",
        "@ethereum-waffle/mock-contract": "^3.2.1",
        "@ethereum-waffle/provider": "^3.2.1",
        "ethers": "^5.0.1"
      }
    },
    "ethereumjs-account": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/ethereumjs-account/-/ethereumjs-account-3.0.0.tgz",
      "integrity": "sha512-WP6BdscjiiPkQfF9PVfMcwx/rDvfZTjFKY0Uwc09zSQr9JfIVH87dYIJu0gNhBhpmovV4yq295fdllS925fnBA==",
      "dev": true,
      "requires": {
        "ethereumjs-util": "^6.0.0",
        "rlp": "^2.2.1",
        "safe-buffer": "^5.1.1"
      }
    },
    "ethereumjs-block": {
      "version": "2.2.2",
      "resolved": "https://registry.npmjs.org/ethereumjs-block/-/ethereumjs-block-2.2.2.tgz",
      "integrity": "sha512-2p49ifhek3h2zeg/+da6XpdFR3GlqY3BIEiqxGF8j9aSRIgkb7M1Ky+yULBKJOu8PAZxfhsYA+HxUk2aCQp3vg==",
      "dev": true,
      "requires": {
        "async": "^2.0.1",
        "ethereumjs-common": "^1.5.0",
        "ethereumjs-tx": "^2.1.1",
        "ethereumjs-util": "^5.0.0",
        "merkle-patricia-tree": "^2.1.2"
      },
      "dependencies": {
        "abstract-leveldown": {
          "version": "2.6.3",
          "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-2.6.3.tgz",
          "integrity": "sha512-2++wDf/DYqkPR3o5tbfdhF96EfMApo1GpPfzOsR/ZYXdkSmELlvOOEAl9iKkRsktMPHdGjO4rtkBpf2I7TiTeA==",
          "dev": true,
          "requires": {
            "xtend": "~4.0.0"
          }
        },
        "deferred-leveldown": {
          "version": "1.2.2",
          "resolved": "https://registry.npmjs.org/deferred-leveldown/-/deferred-leveldown-1.2.2.tgz",
          "integrity": "sha512-uukrWD2bguRtXilKt6cAWKyoXrTSMo5m7crUdLfWQmu8kIm88w3QZoUL+6nhpfKVmhHANER6Re3sKoNoZ3IKMA==",
          "dev": true,
          "requires": {
            "abstract-leveldown": "~2.6.0"
          }
        },
        "ethereumjs-util": {
          "version": "5.2.1",
          "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
          "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
          "dev": true,
          "requires": {
            "bn.js": "^4.11.0",
            "create-hash": "^1.1.2",
            "elliptic": "^6.5.2",
            "ethereum-cryptography": "^0.1.3",
            "ethjs-util": "^0.1.3",
            "rlp": "^2.0.0",
            "safe-buffer": "^5.1.1"
          }
        },
        "isarray": {
          "version": "0.0.1",
          "resolved": "https://registry.npmjs.org/isarray/-/isarray-0.0.1.tgz",
          "integrity": "sha1-ihis/Kmo9Bd+Cav8YDiTmwXR7t8=",
          "dev": true
        },
        "level-codec": {
          "version": "7.0.1",
          "resolved": "https://registry.npmjs.org/level-codec/-/level-codec-7.0.1.tgz",
          "integrity": "sha512-Ua/R9B9r3RasXdRmOtd+t9TCOEIIlts+TN/7XTT2unhDaL6sJn83S3rUyljbr6lVtw49N3/yA0HHjpV6Kzb2aQ==",
          "dev": true
        },
        "level-errors": {
          "version": "1.0.5",
          "resolved": "https://registry.npmjs.org/level-errors/-/level-errors-1.0.5.tgz",
          "integrity": "sha512-/cLUpQduF6bNrWuAC4pwtUKA5t669pCsCi2XbmojG2tFeOr9j6ShtdDCtFFQO1DRt+EVZhx9gPzP9G2bUaG4ig==",
          "dev": true,
          "requires": {
            "errno": "~0.1.1"
          }
        },
        "level-iterator-stream": {
          "version": "1.3.1",
          "resolved": "https://registry.npmjs.org/level-iterator-stream/-/level-iterator-stream-1.3.1.tgz",
          "integrity": "sha1-5Dt4sagUPm+pek9IXrjqUwNS8u0=",
          "dev": true,
          "requires": {
            "inherits": "^2.0.1",
            "level-errors": "^1.0.3",
            "readable-stream": "^1.0.33",
            "xtend": "^4.0.0"
          },
          "dependencies": {
            "readable-stream": {
              "version": "1.1.14",
              "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-1.1.14.tgz",
              "integrity": "sha1-fPTFTvZI44EwhMY23SB54WbAgdk=",
              "dev": true,
              "requires": {
                "core-util-is": "~1.0.0",
                "inherits": "~2.0.1",
                "isarray": "0.0.1",
                "string_decoder": "~0.10.x"
              }
            }
          }
        },
        "level-ws": {
          "version": "0.0.0",
          "resolved": "https://registry.npmjs.org/level-ws/-/level-ws-0.0.0.tgz",
          "integrity": "sha1-Ny5RIXeSSgBCSwtDrvK7QkltIos=",
          "dev": true,
          "requires": {
            "readable-stream": "~1.0.15",
            "xtend": "~2.1.1"
          },
          "dependencies": {
            "readable-stream": {
              "version": "1.0.34",
              "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-1.0.34.tgz",
              "integrity": "sha1-Elgg40vIQtLyqq+v5MKRbuMsFXw=",
              "dev": true,
              "requires": {
                "core-util-is": "~1.0.0",
                "inherits": "~2.0.1",
                "isarray": "0.0.1",
                "string_decoder": "~0.10.x"
              }
            },
            "xtend": {
              "version": "2.1.2",
              "resolved": "https://registry.npmjs.org/xtend/-/xtend-2.1.2.tgz",
              "integrity": "sha1-bv7MKk2tjmlixJAbM3znuoe10os=",
              "dev": true,
              "requires": {
                "object-keys": "~0.4.0"
              }
            }
          }
        },
        "levelup": {
          "version": "1.3.9",
          "resolved": "https://registry.npmjs.org/levelup/-/levelup-1.3.9.tgz",
          "integrity": "sha512-VVGHfKIlmw8w1XqpGOAGwq6sZm2WwWLmlDcULkKWQXEA5EopA8OBNJ2Ck2v6bdk8HeEZSbCSEgzXadyQFm76sQ==",
          "dev": true,
          "requires": {
            "deferred-leveldown": "~1.2.1",
            "level-codec": "~7.0.0",
            "level-errors": "~1.0.3",
            "level-iterator-stream": "~1.3.0",
            "prr": "~1.0.1",
            "semver": "~5.4.1",
            "xtend": "~4.0.0"
          }
        },
        "memdown": {
          "version": "1.4.1",
          "resolved": "https://registry.npmjs.org/memdown/-/memdown-1.4.1.tgz",
          "integrity": "sha1-tOThkhdGZP+65BNhqlAPMRnv4hU=",
          "dev": true,
          "requires": {
            "abstract-leveldown": "~2.7.1",
            "functional-red-black-tree": "^1.0.1",
            "immediate": "^3.2.3",
            "inherits": "~2.0.1",
            "ltgt": "~2.2.0",
            "safe-buffer": "~5.1.1"
          },
          "dependencies": {
            "abstract-leveldown": {
              "version": "2.7.2",
              "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-2.7.2.tgz",
              "integrity": "sha512-+OVvxH2rHVEhWLdbudP6p0+dNMXu8JA1CbhP19T8paTYAcX7oJ4OVjT+ZUVpv7mITxXHqDMej+GdqXBmXkw09w==",
              "dev": true,
              "requires": {
                "xtend": "~4.0.0"
              }
            }
          }
        },
        "merkle-patricia-tree": {
          "version": "2.3.2",
          "resolved": "https://registry.npmjs.org/merkle-patricia-tree/-/merkle-patricia-tree-2.3.2.tgz",
          "integrity": "sha512-81PW5m8oz/pz3GvsAwbauj7Y00rqm81Tzad77tHBwU7pIAtN+TJnMSOJhxBKflSVYhptMMb9RskhqHqrSm1V+g==",
          "dev": true,
          "requires": {
            "async": "^1.4.2",
            "ethereumjs-util": "^5.0.0",
            "level-ws": "0.0.0",
            "levelup": "^1.2.1",
            "memdown": "^1.0.0",
            "readable-stream": "^2.0.0",
            "rlp": "^2.0.0",
            "semaphore": ">=1.0.1"
          },
          "dependencies": {
            "async": {
              "version": "1.5.2",
              "resolved": "https://registry.npmjs.org/async/-/async-1.5.2.tgz",
              "integrity": "sha1-7GphrlZIDAw8skHJVhjiCJL5Zyo=",
              "dev": true
            }
          }
        },
        "object-keys": {
          "version": "0.4.0",
          "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-0.4.0.tgz",
          "integrity": "sha1-KKaq50KN0sOpLz2V8hM13SBOAzY=",
          "dev": true
        },
        "safe-buffer": {
          "version": "5.1.2",
          "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
          "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
          "dev": true
        },
        "semver": {
          "version": "5.4.1",
          "resolved": "https://registry.npmjs.org/semver/-/semver-5.4.1.tgz",
          "integrity": "sha512-WfG/X9+oATh81XtllIo/I8gOiY9EXRdv1cQdyykeXK17YcUW3EXUAi2To4pcH6nZtJPr7ZOpM5OMyWJZm+8Rsg==",
          "dev": true
        },
        "string_decoder": {
          "version": "0.10.31",
          "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-0.10.31.tgz",
          "integrity": "sha1-YuIDvEF2bGwoyfyEMB2rHFMQ+pQ=",
          "dev": true
        }
      }
    },
    "ethereumjs-blockchain": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/ethereumjs-blockchain/-/ethereumjs-blockchain-4.0.4.tgz",
      "integrity": "sha512-zCxaRMUOzzjvX78DTGiKjA+4h2/sF0OYL1QuPux0DHpyq8XiNoF5GYHtb++GUxVlMsMfZV7AVyzbtgcRdIcEPQ==",
      "dev": true,
      "requires": {
        "async": "^2.6.1",
        "ethashjs": "~0.0.7",
        "ethereumjs-block": "~2.2.2",
        "ethereumjs-common": "^1.5.0",
        "ethereumjs-util": "^6.1.0",
        "flow-stoplight": "^1.0.0",
        "level-mem": "^3.0.1",
        "lru-cache": "^5.1.1",
        "rlp": "^2.2.2",
        "semaphore": "^1.1.0"
      }
    },
    "ethereumjs-common": {
      "version": "1.5.2",
      "resolved": "https://registry.npmjs.org/ethereumjs-common/-/ethereumjs-common-1.5.2.tgz",
      "integrity": "sha512-hTfZjwGX52GS2jcVO6E2sx4YuFnf0Fhp5ylo4pEPhEffNln7vS59Hr5sLnp3/QCazFLluuBZ+FZ6J5HTp0EqCA==",
      "dev": true
    },
    "ethereumjs-tx": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/ethereumjs-tx/-/ethereumjs-tx-2.1.2.tgz",
      "integrity": "sha512-zZEK1onCeiORb0wyCXUvg94Ve5It/K6GD1K+26KfFKodiBiS6d9lfCXlUKGBBdQ+bv7Day+JK0tj1K+BeNFRAw==",
      "dev": true,
      "requires": {
        "ethereumjs-common": "^1.5.0",
        "ethereumjs-util": "^6.0.0"
      }
    },
    "ethereumjs-util": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-6.2.1.tgz",
      "integrity": "sha512-W2Ktez4L01Vexijrm5EB6w7dg4n/TgpoYU4avuT5T3Vmnw/eCRtiBrJfQYS/DCSvDIOLn2k57GcHdeBcgVxAqw==",
      "dev": true,
      "requires": {
        "@types/bn.js": "^4.11.3",
        "bn.js": "^4.11.0",
        "create-hash": "^1.1.2",
        "elliptic": "^6.5.2",
        "ethereum-cryptography": "^0.1.3",
        "ethjs-util": "0.1.6",
        "rlp": "^2.2.3"
      }
    },
    "ethers": {
      "version": "5.0.23",
      "resolved": "https://registry.npmjs.org/ethers/-/ethers-5.0.23.tgz",
      "integrity": "sha512-f3pTcgYpMhtmMTMG9KO6pWHYjrCiGz7yVnvMsTQgAYfAVAeUxKy2H1cxQJyqyghRjtAvgVYJlnXQo8mMCD63BA==",
      "dev": true,
      "requires": {
        "@ethersproject/abi": "5.0.9",
        "@ethersproject/abstract-provider": "5.0.7",
        "@ethersproject/abstract-signer": "5.0.9",
        "@ethersproject/address": "5.0.8",
        "@ethersproject/base64": "5.0.6",
        "@ethersproject/basex": "5.0.6",
        "@ethersproject/bignumber": "5.0.12",
        "@ethersproject/bytes": "5.0.8",
        "@ethersproject/constants": "5.0.7",
        "@ethersproject/contracts": "5.0.8",
        "@ethersproject/hash": "5.0.8",
        "@ethersproject/hdnode": "5.0.7",
        "@ethersproject/json-wallets": "5.0.9",
        "@ethersproject/keccak256": "5.0.6",
        "@ethersproject/logger": "5.0.8",
        "@ethersproject/networks": "5.0.6",
        "@ethersproject/pbkdf2": "5.0.6",
        "@ethersproject/properties": "5.0.6",
        "@ethersproject/providers": "5.0.17",
        "@ethersproject/random": "5.0.6",
        "@ethersproject/rlp": "5.0.6",
        "@ethersproject/sha2": "5.0.6",
        "@ethersproject/signing-key": "5.0.7",
        "@ethersproject/solidity": "5.0.7",
        "@ethersproject/strings": "5.0.7",
        "@ethersproject/transactions": "5.0.8",
        "@ethersproject/units": "5.0.8",
        "@ethersproject/wallet": "5.0.9",
        "@ethersproject/web": "5.0.11",
        "@ethersproject/wordlists": "5.0.7"
      }
    },
    "ethjs-unit": {
      "version": "0.1.6",
      "resolved": "https://registry.npmjs.org/ethjs-unit/-/ethjs-unit-0.1.6.tgz",
      "integrity": "sha1-xmWSHkduh7ziqdWIpv4EBbLEFpk=",
      "dev": true,
      "requires": {
        "bn.js": "4.11.6",
        "number-to-bn": "1.7.0"
      },
      "dependencies": {
        "bn.js": {
          "version": "4.11.6",
          "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-4.11.6.tgz",
          "integrity": "sha1-UzRK2xRhehP26N0s4okF0cC6MhU=",
          "dev": true
        }
      }
    },
    "ethjs-util": {
      "version": "0.1.6",
      "resolved": "https://registry.npmjs.org/ethjs-util/-/ethjs-util-0.1.6.tgz",
      "integrity": "sha512-CUnVOQq7gSpDHZVVrQW8ExxUETWrnrvXYvYz55wOU8Uj4VCgw56XC2B/fVqQN+f7gmrnRHSLVnFAwsCuNwji8w==",
      "dev": true,
      "requires": {
        "is-hex-prefixed": "1.0.0",
        "strip-hex-prefix": "1.0.0"
      }
    },
    "event-target-shim": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/event-target-shim/-/event-target-shim-5.0.1.tgz",
      "integrity": "sha512-i/2XbnSz/uxRCU6+NdVJgKWDTM427+MqYbkQzD321DuCQJUqOuJKIA0IM2+W2xtYHdKOmZ4dR6fExsd4SXL+WQ==",
      "dev": true
    },
    "eventemitter3": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-3.1.2.tgz",
      "integrity": "sha512-tvtQIeLVHjDkJYnzf2dgVMxfuSGJeM/7UCG17TT4EumTfNtF+0nebF/4zWOIkCreAbtNqhGEboB6BWrwqNaw4Q==",
      "dev": true
    },
    "evp_bytestokey": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/evp_bytestokey/-/evp_bytestokey-1.0.3.tgz",
      "integrity": "sha512-/f2Go4TognH/KvCISP7OUsHn85hT9nUkxxA9BEWxFn+Oj9o8ZNLm/40hdlgSLyuOimsrTKLUMEorQexp/aPQeA==",
      "dev": true,
      "requires": {
        "md5.js": "^1.3.4",
        "safe-buffer": "^5.1.1"
      }
    },
    "expand-brackets": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/expand-brackets/-/expand-brackets-2.1.4.tgz",
      "integrity": "sha1-t3c14xXOMPa27/D4OwQVGiJEliI=",
      "dev": true,
      "requires": {
        "debug": "^2.3.3",
        "define-property": "^0.2.5",
        "extend-shallow": "^2.0.1",
        "posix-character-classes": "^0.1.0",
        "regex-not": "^1.0.0",
        "snapdragon": "^0.8.1",
        "to-regex": "^3.0.1"
      },
      "dependencies": {
        "debug": {
          "version": "2.6.9",
          "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
          "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
          "dev": true,
          "requires": {
            "ms": "2.0.0"
          }
        },
        "define-property": {
          "version": "0.2.5",
          "resolved": "https://registry.npmjs.org/define-property/-/define-property-0.2.5.tgz",
          "integrity": "sha1-w1se+RjsPJkPmlvFe+BKrOxcgRY=",
          "dev": true,
          "requires": {
            "is-descriptor": "^0.1.0"
          }
        },
        "extend-shallow": {
          "version": "2.0.1",
          "resolved": "https://registry.npmjs.org/extend-shallow/-/extend-shallow-2.0.1.tgz",
          "integrity": "sha1-Ua99YUrZqfYQ6huvu5idaxxWiQ8=",
          "dev": true,
          "requires": {
            "is-extendable": "^0.1.0"
          }
        },
        "is-accessor-descriptor": {
          "version": "0.1.6",
          "resolved": "https://registry.npmjs.org/is-accessor-descriptor/-/is-accessor-descriptor-0.1.6.tgz",
          "integrity": "sha1-qeEss66Nh2cn7u84Q/igiXtcmNY=",
          "dev": true,
          "requires": {
            "kind-of": "^3.0.2"
          },
          "dependencies": {
            "kind-of": {
              "version": "3.2.2",
              "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-3.2.2.tgz",
              "integrity": "sha1-MeohpzS6ubuw8yRm2JOupR5KPGQ=",
              "dev": true,
              "requires": {
                "is-buffer": "^1.1.5"
              }
            }
          }
        },
        "is-buffer": {
          "version": "1.1.6",
          "resolved": "https://registry.npmjs.org/is-buffer/-/is-buffer-1.1.6.tgz",
          "integrity": "sha512-NcdALwpXkTm5Zvvbk7owOUSvVvBKDgKP5/ewfXEznmQFfs4ZRmanOeKBTjRVjka3QFoN6XJ+9F3USqfHqTaU5w==",
          "dev": true
        },
        "is-data-descriptor": {
          "version": "0.1.4",
          "resolved": "https://registry.npmjs.org/is-data-descriptor/-/is-data-descriptor-0.1.4.tgz",
          "integrity": "sha1-C17mSDiOLIYCgueT8YVv7D8wG1Y=",
          "dev": true,
          "requires": {
            "kind-of": "^3.0.2"
          },
          "dependencies": {
            "kind-of": {
              "version": "3.2.2",
              "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-3.2.2.tgz",
              "integrity": "sha1-MeohpzS6ubuw8yRm2JOupR5KPGQ=",
              "dev": true,
              "requires": {
                "is-buffer": "^1.1.5"
              }
            }
          }
        },
        "is-descriptor": {
          "version": "0.1.6",
          "resolved": "https://registry.npmjs.org/is-descriptor/-/is-descriptor-0.1.6.tgz",
          "integrity": "sha512-avDYr0SB3DwO9zsMov0gKCESFYqCnE4hq/4z3TdUlukEy5t9C0YRq7HLrsN52NAcqXKaepeCD0n+B0arnVG3Hg==",
          "dev": true,
          "requires": {
            "is-accessor-descriptor": "^0.1.6",
            "is-data-descriptor": "^0.1.4",
            "kind-of": "^5.0.0"
          }
        },
        "is-extendable": {
          "version": "0.1.1",
          "resolved": "https://registry.npmjs.org/is-extendable/-/is-extendable-0.1.1.tgz",
          "integrity": "sha1-YrEQ4omkcUGOPsNqYX1HLjAd/Ik=",
          "dev": true
        },
        "kind-of": {
          "version": "5.1.0",
          "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-5.1.0.tgz",
          "integrity": "sha512-NGEErnH6F2vUuXDh+OlbcKW7/wOcfdRHaZ7VWtqCztfHri/++YKmP51OdWeGPuqCOba6kk2OTe5d02VmTB80Pw==",
          "dev": true
        },
        "ms": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
          "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
          "dev": true
        }
      }
    },
    "express": {
      "version": "4.17.1",
      "resolved": "https://registry.npmjs.org/express/-/express-4.17.1.tgz",
      "integrity": "sha512-mHJ9O79RqluphRrcw2X/GTh3k9tVv8YcoyY4Kkh4WDMUYKRZUq0h1o0w2rrrxBqM7VoeUVqgb27xlEMXTnYt4g==",
      "dev": true,
      "requires": {
        "accepts": "~1.3.7",
        "array-flatten": "1.1.1",
        "body-parser": "1.19.0",
        "content-disposition": "0.5.3",
        "content-type": "~1.0.4",
        "cookie": "0.4.0",
        "cookie-signature": "1.0.6",
        "debug": "2.6.9",
        "depd": "~1.1.2",
        "encodeurl": "~1.0.2",
        "escape-html": "~1.0.3",
        "etag": "~1.8.1",
        "finalhandler": "~1.1.2",
        "fresh": "0.5.2",
        "merge-descriptors": "1.0.1",
        "methods": "~1.1.2",
        "on-finished": "~2.3.0",
        "parseurl": "~1.3.3",
        "path-to-regexp": "0.1.7",
        "proxy-addr": "~2.0.5",
        "qs": "6.7.0",
        "range-parser": "~1.2.1",
        "safe-buffer": "5.1.2",
        "send": "0.17.1",
        "serve-static": "1.14.1",
        "setprototypeof": "1.1.1",
        "statuses": "~1.5.0",
        "type-is": "~1.6.18",
        "utils-merge": "1.0.1",
        "vary": "~1.1.2"
      },
      "dependencies": {
        "cookie": {
          "version": "0.4.0",
          "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.4.0.tgz",
          "integrity": "sha512-+Hp8fLp57wnUSt0tY0tHEXh4voZRDnoIrZPqlo3DPiI4y9lwg/jqx+1Om94/W6ZaPDOUbnjOt/99w66zk+l1Xg==",
          "dev": true
        },
        "debug": {
          "version": "2.6.9",
          "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
          "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
          "dev": true,
          "requires": {
            "ms": "2.0.0"
          }
        },
        "ms": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
          "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
          "dev": true
        },
        "qs": {
          "version": "6.7.0",
          "resolved": "https://registry.npmjs.org/qs/-/qs-6.7.0.tgz",
          "integrity": "sha512-VCdBRNFTX1fyE7Nb6FYoURo/SPe62QCaAyzJvUjwRaIsc+NePBEniHlvxFmmX56+HZphIGtV0XeCirBtpDrTyQ==",
          "dev": true
        },
        "safe-buffer": {
          "version": "5.1.2",
          "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
          "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
          "dev": true
        }
      }
    },
    "ext": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/ext/-/ext-1.4.0.tgz",
      "integrity": "sha512-Key5NIsUxdqKg3vIsdw9dSuXpPCQ297y6wBjL30edxwPgt2E44WcWBZey/ZvUc6sERLTxKdyCu4gZFmUbk1Q7A==",
      "dev": true,
      "requires": {
        "type": "^2.0.0"
      },
      "dependencies": {
        "type": {
          "version": "2.1.0",
          "resolved": "https://registry.npmjs.org/type/-/type-2.1.0.tgz",
          "integrity": "sha512-G9absDWvhAWCV2gmF1zKud3OyC61nZDwWvBL2DApaVFogI07CprggiQAOOjvp2NRjYWFzPyu7vwtDrQFq8jeSA==",
          "dev": true
        }
      }
    },
    "extend": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/extend/-/extend-3.0.2.tgz",
      "integrity": "sha512-fjquC59cD7CyW6urNXK0FBufkZcoiGG80wTuPujX590cB5Ttln20E2UB4S/WARVqhXffZl2LNgS+gQdPIIim/g==",
      "dev": true
    },
    "extend-shallow": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/extend-shallow/-/extend-shallow-3.0.2.tgz",
      "integrity": "sha1-Jqcarwc7OfshJxcnRhMcJwQCjbg=",
      "dev": true,
      "requires": {
        "assign-symbols": "^1.0.0",
        "is-extendable": "^1.0.1"
      }
    },
    "extglob": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/extglob/-/extglob-2.0.4.tgz",
      "integrity": "sha512-Nmb6QXkELsuBr24CJSkilo6UHHgbekK5UiZgfE6UHD3Eb27YC6oD+bhcT+tJ6cl8dmsgdQxnWlcry8ksBIBLpw==",
      "dev": true,
      "requires": {
        "array-unique": "^0.3.2",
        "define-property": "^1.0.0",
        "expand-brackets": "^2.1.4",
        "extend-shallow": "^2.0.1",
        "fragment-cache": "^0.2.1",
        "regex-not": "^1.0.0",
        "snapdragon": "^0.8.1",
        "to-regex": "^3.0.1"
      },
      "dependencies": {
        "define-property": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/define-property/-/define-property-1.0.0.tgz",
          "integrity": "sha1-dp66rz9KY6rTr56NMEybvnm/sOY=",
          "dev": true,
          "requires": {
            "is-descriptor": "^1.0.0"
          }
        },
        "extend-shallow": {
          "version": "2.0.1",
          "resolved": "https://registry.npmjs.org/extend-shallow/-/extend-shallow-2.0.1.tgz",
          "integrity": "sha1-Ua99YUrZqfYQ6huvu5idaxxWiQ8=",
          "dev": true,
          "requires": {
            "is-extendable": "^0.1.0"
          }
        },
        "is-extendable": {
          "version": "0.1.1",
          "resolved": "https://registry.npmjs.org/is-extendable/-/is-extendable-0.1.1.tgz",
          "integrity": "sha1-YrEQ4omkcUGOPsNqYX1HLjAd/Ik=",
          "dev": true
        }
      }
    },
    "extsprintf": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/extsprintf/-/extsprintf-1.3.0.tgz",
      "integrity": "sha1-lpGEQOMEGnpBT4xS48V06zw+HgU=",
      "dev": true
    },
    "fake-merkle-patricia-tree": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/fake-merkle-patricia-tree/-/fake-merkle-patricia-tree-1.0.1.tgz",
      "integrity": "sha1-S4w6z7Ugr635hgsfFM2M40As3dM=",
      "dev": true,
      "requires": {
        "checkpoint-store": "^1.1.0"
      }
    },
    "fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "dev": true
    },
    "fast-glob": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.2.4.tgz",
      "integrity": "sha512-kr/Oo6PX51265qeuCYsyGypiO5uJFgBS0jksyG7FUeCyQzNwYnzrNIMR1NXfkZXsMYXYLRAHgISHBz8gQcxKHQ==",
      "dev": true,
      "requires": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.0",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.2",
        "picomatch": "^2.2.1"
      },
      "dependencies": {
        "micromatch": {
          "version": "4.0.2",
          "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.2.tgz",
          "integrity": "sha512-y7FpHSbMUMoyPbYUSzO6PaZ6FyRnQOpHuKwbo1G+Knck95XVU4QAiKdGEnj5wwoS7PlOgthX/09u5iFJ+aYf5Q==",
          "dev": true,
          "requires": {
            "braces": "^3.0.1",
            "picomatch": "^2.0.5"
          }
        }
      }
    },
    "fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true
    },
    "fast-levenshtein": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
      "integrity": "sha1-PYpcZog6FqMMqGQ+hR8Zuqd5eRc=",
      "dev": true
    },
    "fastq": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.10.0.tgz",
      "integrity": "sha512-NL2Qc5L3iQEsyYzweq7qfgy5OtXCmGzGvhElGEd/SoFWEMOEczNh5s5ocaF01HDetxz+p8ecjNPA6cZxxIHmzA==",
      "dev": true,
      "requires": {
        "reusify": "^1.0.4"
      }
    },
    "file-uri-to-path": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/file-uri-to-path/-/file-uri-to-path-1.0.0.tgz",
      "integrity": "sha512-0Zt+s3L7Vf1biwWZ29aARiVYLx7iMGnEUl9x33fbB/j3jR81u/O2LbqK+Bm1CDSNDKVtJ/YjwY7TUd5SkeLQLw==",
      "dev": true
    },
    "fill-range": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.0.1.tgz",
      "integrity": "sha512-qOo9F+dMUmC2Lcb4BbVvnKJxTPjCm+RRpe4gDuGrzkL7mEVl/djYSu2OdQ2Pa302N4oqkSg9ir6jaLWJ2USVpQ==",
      "dev": true,
      "requires": {
        "to-regex-range": "^5.0.1"
      }
    },
    "finalhandler": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-1.1.2.tgz",
      "integrity": "sha512-aAWcW57uxVNrQZqFXjITpW3sIUQmHGG3qSb9mUah9MgMC4NeWhNOlNjXEYq3HjRAvL6arUviZGGJsBg6z0zsWA==",
      "dev": true,
      "requires": {
        "debug": "2.6.9",
        "encodeurl": "~1.0.2",
        "escape-html": "~1.0.3",
        "on-finished": "~2.3.0",
        "parseurl": "~1.3.3",
        "statuses": "~1.5.0",
        "unpipe": "~1.0.0"
      },
      "dependencies": {
        "debug": {
          "version": "2.6.9",
          "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
          "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
          "dev": true,
          "requires": {
            "ms": "2.0.0"
          }
        },
        "ms": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
          "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
          "dev": true
        }
      }
    },
    "find-up": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-2.1.0.tgz",
      "integrity": "sha1-RdG35QbHF93UgndaK3eSCjwMV6c=",
      "dev": true,
      "requires": {
        "locate-path": "^2.0.0"
      }
    },
    "find-yarn-workspace-root": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/find-yarn-workspace-root/-/find-yarn-workspace-root-1.2.1.tgz",
      "integrity": "sha512-dVtfb0WuQG+8Ag2uWkbG79hOUzEsRrhBzgfn86g2sJPkzmcpGdghbNTfUKGTxymFrY/tLIodDzLoW9nOJ4FY8Q==",
      "dev": true,
      "requires": {
        "fs-extra": "^4.0.3",
        "micromatch": "^3.1.4"
      },
      "dependencies": {
        "fs-extra": {
          "version": "4.0.3",
          "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-4.0.3.tgz",
          "integrity": "sha512-q6rbdDd1o2mAnQreO7YADIxf/Whx4AHBiRf6d+/cVT8h44ss+lHgxf1FemcqDnQt9X3ct4McHr+JMGlYSsK7Cg==",
          "dev": true,
          "requires": {
            "graceful-fs": "^4.1.2",
            "jsonfile": "^4.0.0",
            "universalify": "^0.1.0"
          }
        }
      }
    },
    "flat": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/flat/-/flat-4.1.1.tgz",
      "integrity": "sha512-FmTtBsHskrU6FJ2VxCnsDb84wu9zhmO3cUX2kGFb5tuwhfXxGciiT0oRY+cck35QmG+NmGh5eLz6lLCpWTqwpA==",
      "dev": true,
      "requires": {
        "is-buffer": "~2.0.3"
      }
    },
    "flow-stoplight": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/flow-stoplight/-/flow-stoplight-1.0.0.tgz",
      "integrity": "sha1-SiksW8/4s5+mzAyxqFPYbyfu/3s=",
      "dev": true
    },
    "fmix": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/fmix/-/fmix-0.1.0.tgz",
      "integrity": "sha1-x7vxJN7ELJ0ZHPuUfQqXeN2YbAw=",
      "dev": true,
      "requires": {
        "imul": "^1.0.0"
      }
    },
    "follow-redirects": {
      "version": "1.13.0",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.13.0.tgz",
      "integrity": "sha512-aq6gF1BEKje4a9i9+5jimNFIpq4Q1WiwBToeRK5NvZBd/TRsmW8BsJfOEGkr76TbOyPVD3OVDN910EcUNtRYEA==",
      "dev": true
    },
    "for-in": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/for-in/-/for-in-1.0.2.tgz",
      "integrity": "sha1-gQaNKVqBQuwKxybG4iAMMPttXoA=",
      "dev": true
    },
    "forever-agent": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/forever-agent/-/forever-agent-0.6.1.tgz",
      "integrity": "sha1-+8cfDEGt6zf5bFd60e1C2P2sypE=",
      "dev": true
    },
    "form-data": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-3.0.0.tgz",
      "integrity": "sha512-CKMFDglpbMi6PyN+brwB9Q/GOw0eAnsrEZDgcsH5Krhz5Od/haKHAX0NmQfha2zPPz0JpWzA7GJHGSnvCRLWsg==",
      "dev": true,
      "requires": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "mime-types": "^2.1.12"
      }
    },
    "forwarded": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.1.2.tgz",
      "integrity": "sha1-mMI9qxF1ZXuMBXPozszZGw/xjIQ=",
      "dev": true
    },
    "fp-ts": {
      "version": "1.19.3",
      "resolved": "https://registry.npmjs.org/fp-ts/-/fp-ts-1.19.3.tgz",
      "integrity": "sha512-H5KQDspykdHuztLTg+ajGN0Z2qUjcEf3Ybxc6hLt0k7/zPkn29XnKnxlBPyW2XIddWrGaJBzBl4VLYOtk39yZg==",
      "dev": true
    },
    "fragment-cache": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/fragment-cache/-/fragment-cache-0.2.1.tgz",
      "integrity": "sha1-QpD60n8T6Jvn8zeZxrxaCr//DRk=",
      "dev": true,
      "requires": {
        "map-cache": "^0.2.2"
      }
    },
    "fresh": {
      "version": "0.5.2",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-0.5.2.tgz",
      "integrity": "sha1-PYyt2Q2XZWn6g1qx+OSyOhBWBac=",
      "dev": true
    },
    "fs-extra": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-7.0.1.tgz",
      "integrity": "sha512-YJDaCJZEnBmcbw13fvdAM9AwNOJwOzrE4pqMqBq5nFiEqXUqHwlK4B+3pUw6JNvfSPtX05xFHtYy/1ni01eGCw==",
      "dev": true,
      "requires": {
        "graceful-fs": "^4.1.2",
        "jsonfile": "^4.0.0",
        "universalify": "^0.1.0"
      }
    },
    "fs-minipass": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/fs-minipass/-/fs-minipass-1.2.7.tgz",
      "integrity": "sha512-GWSSJGFy4e9GUeCcbIkED+bgAoFyj7XF1mV8rma3QW4NIqX9Kyx79N/PF61H5udOV3aY1IaMLs6pGbH71nlCTA==",
      "dev": true,
      "requires": {
        "minipass": "^2.6.0"
      }
    },
    "fs-readdir-recursive": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/fs-readdir-recursive/-/fs-readdir-recursive-1.1.0.tgz",
      "integrity": "sha512-GNanXlVr2pf02+sPN40XN8HG+ePaNcvM0q5mZBd668Obwb0yD5GiUbZOFgwn8kGMY6I3mdyDJzieUy3PTYyTRA==",
      "dev": true
    },
    "fs.realpath": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs.realpath/-/fs.realpath-1.0.0.tgz",
      "integrity": "sha1-FQStJSMVjKpA20onh8sBQRmU6k8=",
      "dev": true
    },
    "fsevents": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.1.3.tgz",
      "integrity": "sha512-Auw9a4AxqWpa9GUfj370BMPzzyncfBABW8Mab7BGWBYDj4Isgq+cDKtx0i6u9jcX9pQDnswsaaOTgTmA5pEjuQ==",
      "dev": true,
      "optional": true
    },
    "function-bind": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.1.tgz",
      "integrity": "sha512-yIovAzMX49sF8Yl58fSCWJ5svSLuaibPxXQJFLmBObTuCr0Mf1KiPopGM9NiFjiYBCbfaa2Fh6breQ6ANVTI0A==",
      "dev": true
    },
    "functional-red-black-tree": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/functional-red-black-tree/-/functional-red-black-tree-1.0.1.tgz",
      "integrity": "sha1-GwqzvVU7Kg1jmdKcDj6gslIHgyc=",
      "dev": true
    },
    "ganache-cli": {
      "version": "6.12.1",
      "resolved": "https://registry.npmjs.org/ganache-cli/-/ganache-cli-6.12.1.tgz",
      "integrity": "sha512-zoefZLQpQyEJH9jgtVYgM+ENFLAC9iwys07IDCsju2Ieq9KSTLH89RxSP4bhizXKV/h/+qaWpfyCBGWnBfqgIQ==",
      "dev": true,
      "requires": {
        "ethereumjs-util": "6.2.1",
        "source-map-support": "0.5.12",
        "yargs": "13.2.4"
      },
      "dependencies": {
        "@types/bn.js": {
          "version": "4.11.6",
          "bundled": true,
          "dev": true,
          "requires": {
            "@types/node": "*"
          }
        },
        "@types/node": {
          "version": "14.11.2",
          "bundled": true,
          "dev": true
        },
        "@types/pbkdf2": {
          "version": "3.1.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "@types/node": "*"
          }
        },
        "@types/secp256k1": {
          "version": "4.0.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "@types/node": "*"
          }
        },
        "ansi-regex": {
          "version": "4.1.0",
          "bundled": true,
          "dev": true
        },
        "ansi-styles": {
          "version": "3.2.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "color-convert": "^1.9.0"
          }
        },
        "base-x": {
          "version": "3.0.8",
          "bundled": true,
          "dev": true,
          "requires": {
            "safe-buffer": "^5.0.1"
          }
        },
        "blakejs": {
          "version": "1.1.0",
          "bundled": true,
          "dev": true
        },
        "bn.js": {
          "version": "4.11.9",
          "bundled": true,
          "dev": true
        },
        "brorand": {
          "version": "1.1.0",
          "bundled": true,
          "dev": true
        },
        "browserify-aes": {
          "version": "1.2.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "buffer-xor": "^1.0.3",
            "cipher-base": "^1.0.0",
            "create-hash": "^1.1.0",
            "evp_bytestokey": "^1.0.3",
            "inherits": "^2.0.1",
            "safe-buffer": "^5.0.1"
          }
        },
        "bs58": {
          "version": "4.0.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "base-x": "^3.0.2"
          }
        },
        "bs58check": {
          "version": "2.1.2",
          "bundled": true,
          "dev": true,
          "requires": {
            "bs58": "^4.0.0",
            "create-hash": "^1.1.0",
            "safe-buffer": "^5.1.2"
          }
        },
        "buffer-from": {
          "version": "1.1.1",
          "bundled": true,
          "dev": true
        },
        "buffer-xor": {
          "version": "1.0.3",
          "bundled": true,
          "dev": true
        },
        "camelcase": {
          "version": "5.3.1",
          "bundled": true,
          "dev": true
        },
        "cipher-base": {
          "version": "1.0.4",
          "bundled": true,
          "dev": true,
          "requires": {
            "inherits": "^2.0.1",
            "safe-buffer": "^5.0.1"
          }
        },
        "cliui": {
          "version": "5.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "string-width": "^3.1.0",
            "strip-ansi": "^5.2.0",
            "wrap-ansi": "^5.1.0"
          }
        },
        "color-convert": {
          "version": "1.9.3",
          "bundled": true,
          "dev": true,
          "requires": {
            "color-name": "1.1.3"
          }
        },
        "color-name": {
          "version": "1.1.3",
          "bundled": true,
          "dev": true
        },
        "create-hash": {
          "version": "1.2.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "cipher-base": "^1.0.1",
            "inherits": "^2.0.1",
            "md5.js": "^1.3.4",
            "ripemd160": "^2.0.1",
            "sha.js": "^2.4.0"
          }
        },
        "create-hmac": {
          "version": "1.1.7",
          "bundled": true,
          "dev": true,
          "requires": {
            "cipher-base": "^1.0.3",
            "create-hash": "^1.1.0",
            "inherits": "^2.0.1",
            "ripemd160": "^2.0.0",
            "safe-buffer": "^5.0.1",
            "sha.js": "^2.4.8"
          }
        },
        "cross-spawn": {
          "version": "6.0.5",
          "bundled": true,
          "dev": true,
          "requires": {
            "nice-try": "^1.0.4",
            "path-key": "^2.0.1",
            "semver": "^5.5.0",
            "shebang-command": "^1.2.0",
            "which": "^1.2.9"
          }
        },
        "decamelize": {
          "version": "1.2.0",
          "bundled": true,
          "dev": true
        },
        "elliptic": {
          "version": "6.5.3",
          "bundled": true,
          "dev": true,
          "requires": {
            "bn.js": "^4.4.0",
            "brorand": "^1.0.1",
            "hash.js": "^1.0.0",
            "hmac-drbg": "^1.0.0",
            "inherits": "^2.0.1",
            "minimalistic-assert": "^1.0.0",
            "minimalistic-crypto-utils": "^1.0.0"
          }
        },
        "emoji-regex": {
          "version": "7.0.3",
          "bundled": true,
          "dev": true
        },
        "end-of-stream": {
          "version": "1.4.4",
          "bundled": true,
          "dev": true,
          "requires": {
            "once": "^1.4.0"
          }
        },
        "ethereum-cryptography": {
          "version": "0.1.3",
          "bundled": true,
          "dev": true,
          "requires": {
            "@types/pbkdf2": "^3.0.0",
            "@types/secp256k1": "^4.0.1",
            "blakejs": "^1.1.0",
            "browserify-aes": "^1.2.0",
            "bs58check": "^2.1.2",
            "create-hash": "^1.2.0",
            "create-hmac": "^1.1.7",
            "hash.js": "^1.1.7",
            "keccak": "^3.0.0",
            "pbkdf2": "^3.0.17",
            "randombytes": "^2.1.0",
            "safe-buffer": "^5.1.2",
            "scrypt-js": "^3.0.0",
            "secp256k1": "^4.0.1",
            "setimmediate": "^1.0.5"
          }
        },
        "ethereumjs-util": {
          "version": "6.2.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "@types/bn.js": "^4.11.3",
            "ethjs-util": "0.1.6",
            "rlp": "^2.2.3"
          }
        },
        "ethjs-util": {
          "version": "0.1.6",
          "bundled": true,
          "dev": true,
          "requires": {
            "is-hex-prefixed": "1.0.0",
            "strip-hex-prefix": "1.0.0"
          }
        },
        "evp_bytestokey": {
          "version": "1.0.3",
          "bundled": true,
          "dev": true,
          "requires": {
            "md5.js": "^1.3.4",
            "safe-buffer": "^5.1.1"
          }
        },
        "execa": {
          "version": "1.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "cross-spawn": "^6.0.0",
            "get-stream": "^4.0.0",
            "is-stream": "^1.1.0",
            "npm-run-path": "^2.0.0",
            "p-finally": "^1.0.0",
            "signal-exit": "^3.0.0",
            "strip-eof": "^1.0.0"
          }
        },
        "find-up": {
          "version": "3.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "locate-path": "^3.0.0"
          }
        },
        "get-caller-file": {
          "version": "2.0.5",
          "bundled": true,
          "dev": true
        },
        "get-stream": {
          "version": "4.1.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "pump": "^3.0.0"
          }
        },
        "hash-base": {
          "version": "3.1.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "inherits": "^2.0.4",
            "readable-stream": "^3.6.0",
            "safe-buffer": "^5.2.0"
          }
        },
        "hash.js": {
          "version": "1.1.7",
          "bundled": true,
          "dev": true,
          "requires": {
            "inherits": "^2.0.3",
            "minimalistic-assert": "^1.0.1"
          }
        },
        "hmac-drbg": {
          "version": "1.0.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "hash.js": "^1.0.3",
            "minimalistic-assert": "^1.0.0",
            "minimalistic-crypto-utils": "^1.0.1"
          }
        },
        "inherits": {
          "version": "2.0.4",
          "bundled": true,
          "dev": true
        },
        "invert-kv": {
          "version": "2.0.0",
          "bundled": true,
          "dev": true
        },
        "is-fullwidth-code-point": {
          "version": "2.0.0",
          "bundled": true,
          "dev": true
        },
        "is-hex-prefixed": {
          "version": "1.0.0",
          "bundled": true,
          "dev": true
        },
        "is-stream": {
          "version": "1.1.0",
          "bundled": true,
          "dev": true
        },
        "isexe": {
          "version": "2.0.0",
          "bundled": true,
          "dev": true
        },
        "keccak": {
          "version": "3.0.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "node-addon-api": "^2.0.0",
            "node-gyp-build": "^4.2.0"
          }
        },
        "lcid": {
          "version": "2.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "invert-kv": "^2.0.0"
          }
        },
        "locate-path": {
          "version": "3.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "p-locate": "^3.0.0",
            "path-exists": "^3.0.0"
          }
        },
        "map-age-cleaner": {
          "version": "0.1.3",
          "bundled": true,
          "dev": true,
          "requires": {
            "p-defer": "^1.0.0"
          }
        },
        "md5.js": {
          "version": "1.3.5",
          "bundled": true,
          "dev": true,
          "requires": {
            "hash-base": "^3.0.0",
            "inherits": "^2.0.1",
            "safe-buffer": "^5.1.2"
          }
        },
        "mem": {
          "version": "4.3.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "map-age-cleaner": "^0.1.1",
            "mimic-fn": "^2.0.0",
            "p-is-promise": "^2.0.0"
          }
        },
        "mimic-fn": {
          "version": "2.1.0",
          "bundled": true,
          "dev": true
        },
        "minimalistic-assert": {
          "version": "1.0.1",
          "bundled": true,
          "dev": true
        },
        "minimalistic-crypto-utils": {
          "version": "1.0.1",
          "bundled": true,
          "dev": true
        },
        "nice-try": {
          "version": "1.0.5",
          "bundled": true,
          "dev": true
        },
        "node-addon-api": {
          "version": "2.0.2",
          "bundled": true,
          "dev": true
        },
        "node-gyp-build": {
          "version": "4.2.3",
          "bundled": true,
          "dev": true
        },
        "npm-run-path": {
          "version": "2.0.2",
          "bundled": true,
          "dev": true,
          "requires": {
            "path-key": "^2.0.0"
          }
        },
        "once": {
          "version": "1.4.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "wrappy": "1"
          }
        },
        "os-locale": {
          "version": "3.1.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "execa": "^1.0.0",
            "lcid": "^2.0.0",
            "mem": "^4.0.0"
          }
        },
        "p-defer": {
          "version": "1.0.0",
          "bundled": true,
          "dev": true
        },
        "p-finally": {
          "version": "1.0.0",
          "bundled": true,
          "dev": true
        },
        "p-is-promise": {
          "version": "2.1.0",
          "bundled": true,
          "dev": true
        },
        "p-limit": {
          "version": "2.3.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "p-try": "^2.0.0"
          }
        },
        "p-locate": {
          "version": "3.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "p-limit": "^2.0.0"
          }
        },
        "p-try": {
          "version": "2.2.0",
          "bundled": true,
          "dev": true
        },
        "path-exists": {
          "version": "3.0.0",
          "bundled": true,
          "dev": true
        },
        "path-key": {
          "version": "2.0.1",
          "bundled": true,
          "dev": true
        },
        "pbkdf2": {
          "version": "3.1.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "create-hash": "^1.1.2",
            "create-hmac": "^1.1.4",
            "ripemd160": "^2.0.1",
            "safe-buffer": "^5.0.1",
            "sha.js": "^2.4.8"
          }
        },
        "pump": {
          "version": "3.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "end-of-stream": "^1.1.0",
            "once": "^1.3.1"
          }
        },
        "randombytes": {
          "version": "2.1.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "safe-buffer": "^5.1.0"
          }
        },
        "readable-stream": {
          "version": "3.6.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "inherits": "^2.0.3",
            "string_decoder": "^1.1.1",
            "util-deprecate": "^1.0.1"
          }
        },
        "require-directory": {
          "version": "2.1.1",
          "bundled": true,
          "dev": true
        },
        "require-main-filename": {
          "version": "2.0.0",
          "bundled": true,
          "dev": true
        },
        "ripemd160": {
          "version": "2.0.2",
          "bundled": true,
          "dev": true,
          "requires": {
            "hash-base": "^3.0.0",
            "inherits": "^2.0.1"
          }
        },
        "rlp": {
          "version": "2.2.6",
          "bundled": true,
          "dev": true,
          "requires": {
            "bn.js": "^4.11.1"
          }
        },
        "safe-buffer": {
          "version": "5.2.1",
          "bundled": true,
          "dev": true
        },
        "scrypt-js": {
          "version": "3.0.1",
          "bundled": true,
          "dev": true
        },
        "secp256k1": {
          "version": "4.0.2",
          "bundled": true,
          "dev": true,
          "requires": {
            "elliptic": "^6.5.2",
            "node-addon-api": "^2.0.0",
            "node-gyp-build": "^4.2.0"
          }
        },
        "semver": {
          "version": "5.7.1",
          "bundled": true,
          "dev": true
        },
        "set-blocking": {
          "version": "2.0.0",
          "bundled": true,
          "dev": true
        },
        "setimmediate": {
          "version": "1.0.5",
          "bundled": true,
          "dev": true
        },
        "sha.js": {
          "version": "2.4.11",
          "bundled": true,
          "dev": true,
          "requires": {
            "inherits": "^2.0.1",
            "safe-buffer": "^5.0.1"
          }
        },
        "shebang-command": {
          "version": "1.2.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "shebang-regex": "^1.0.0"
          }
        },
        "shebang-regex": {
          "version": "1.0.0",
          "bundled": true,
          "dev": true
        },
        "signal-exit": {
          "version": "3.0.3",
          "bundled": true,
          "dev": true
        },
        "source-map": {
          "version": "0.6.1",
          "bundled": true,
          "dev": true
        },
        "source-map-support": {
          "version": "0.5.12",
          "bundled": true,
          "dev": true,
          "requires": {
            "buffer-from": "^1.0.0",
            "source-map": "^0.6.0"
          }
        },
        "string-width": {
          "version": "3.1.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "emoji-regex": "^7.0.1",
            "is-fullwidth-code-point": "^2.0.0",
            "strip-ansi": "^5.1.0"
          }
        },
        "string_decoder": {
          "version": "1.3.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "safe-buffer": "~5.2.0"
          }
        },
        "strip-ansi": {
          "version": "5.2.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "ansi-regex": "^4.1.0"
          }
        },
        "strip-eof": {
          "version": "1.0.0",
          "bundled": true,
          "dev": true
        },
        "strip-hex-prefix": {
          "version": "1.0.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "is-hex-prefixed": "1.0.0"
          }
        },
        "util-deprecate": {
          "version": "1.0.2",
          "bundled": true,
          "dev": true
        },
        "which": {
          "version": "1.3.1",
          "bundled": true,
          "dev": true,
          "requires": {
            "isexe": "^2.0.0"
          }
        },
        "which-module": {
          "version": "2.0.0",
          "bundled": true,
          "dev": true
        },
        "wrap-ansi": {
          "version": "5.1.0",
          "bundled": true,
          "dev": true,
          "requires": {
            "ansi-styles": "^3.2.0",
            "string-width": "^3.0.0",
            "strip-ansi": "^5.0.0"
          }
        },
        "wrappy": {
          "version": "1.0.2",
          "bundled": true,
          "dev": true
        },
        "y18n": {
          "version": "4.0.0",
          "bundled": true,
          "dev": true
        },
        "yargs": {
          "version": "13.2.4",
          "bundled": true,
          "dev": true,
          "requires": {
            "cliui": "^5.0.0",
            "find-up": "^3.0.0",
            "get-caller-file": "^2.0.1",
            "os-locale": "^3.1.0",
            "require-directory": "^2.1.1",
            "require-main-filename": "^2.0.0",
            "set-blocking": "^2.0.0",
            "string-width": "^3.0.0",
            "which-module": "^2.0.0",
            "y18n": "^4.0.0",
            "yargs-parser": "^13.1.0"
          }
        },
        "yargs-parser": {
          "version": "13.1.2",
          "bundled": true,
          "dev": true,
          "requires": {
            "camelcase": "^5.0.0",
            "decamelize": "^1.2.0"
          }
        }
      }
    },
    "ganache-core": {
      "version": "2.13.1",
      "resolved": "https://registry.npmjs.org/ganache-core/-/ganache-core-2.13.1.tgz",
      "integrity": "sha512-Ewg+kNcDqXtOohe7jCcP+ZUv9EMzOx2MoqOYYP3BCfxrDh3KjBXXaKK+Let7li0TghAs9lxmBgevZku35j5YzA==",
      "dev": true,
      "requires": {
        "abstract-leveldown": "3.0.0",
        "async": "2.6.2",
        "bip39": "2.5.0",
        "cachedown": "1.0.0",
        "clone": "2.1.2",
        "debug": "3.2.6",
        "encoding-down": "5.0.4",
        "eth-sig-util": "^2.0.0",
        "ethereumjs-abi": "0.6.8",
        "ethereumjs-account": "3.0.0",
        "ethereumjs-block": "2.2.2",
        "ethereumjs-common": "1.5.0",
        "ethereumjs-tx": "2.1.2",
        "ethereumjs-util": "6.2.1",
        "ethereumjs-vm": "4.2.0",
        "ethereumjs-wallet": "0.6.5",
        "heap": "0.2.6",
        "keccak": "3.0.1",
        "level-sublevel": "6.6.4",
        "levelup": "3.1.1",
        "lodash": "4.17.20",
        "lru-cache": "5.1.1",
        "merkle-patricia-tree": "3.0.0",
        "patch-package": "6.2.2",
        "seedrandom": "3.0.1",
        "source-map-support": "0.5.12",
        "tmp": "0.1.0",
        "web3": "1.2.11",
        "web3-provider-engine": "14.2.1",
        "websocket": "1.0.32"
      },
      "dependencies": {
        "@ethersproject/abi": {
          "version": "5.0.0-beta.153",
          "resolved": "https://registry.npmjs.org/@ethersproject/abi/-/abi-5.0.0-beta.153.tgz",
          "integrity": "sha512-aXweZ1Z7vMNzJdLpR1CZUAIgnwjrZeUSvN9syCwlBaEBUFJmFY+HHnfuTI5vIhVs/mRkfJVrbEyl51JZQqyjAg==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/address": ">=5.0.0-beta.128",
            "@ethersproject/bignumber": ">=5.0.0-beta.130",
            "@ethersproject/bytes": ">=5.0.0-beta.129",
            "@ethersproject/constants": ">=5.0.0-beta.128",
            "@ethersproject/hash": ">=5.0.0-beta.128",
            "@ethersproject/keccak256": ">=5.0.0-beta.127",
            "@ethersproject/logger": ">=5.0.0-beta.129",
            "@ethersproject/properties": ">=5.0.0-beta.131",
            "@ethersproject/strings": ">=5.0.0-beta.130"
          }
        },
        "@ethersproject/address": {
          "version": "5.0.5",
          "resolved": "https://registry.npmjs.org/@ethersproject/address/-/address-5.0.5.tgz",
          "integrity": "sha512-DpkQ6rwk9jTefrRsJzEm6nhRiJd9pvhn1xN0rw5N/jswXG5r7BLk/GVA0mMAVWAsYfvi2xSc5L41FMox43RYEA==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bignumber": "^5.0.7",
            "@ethersproject/bytes": "^5.0.4",
            "@ethersproject/keccak256": "^5.0.3",
            "@ethersproject/logger": "^5.0.5",
            "@ethersproject/rlp": "^5.0.3",
            "bn.js": "^4.4.0"
          }
        },
        "@ethersproject/bignumber": {
          "version": "5.0.8",
          "resolved": "https://registry.npmjs.org/@ethersproject/bignumber/-/bignumber-5.0.8.tgz",
          "integrity": "sha512-KXFVAFKS1jdTXYN8BE5Oj+ZfPMh28iRdFeNGBVT6cUFdtiPVqeXqc0ggvBqA3A1VoFFGgM7oAeaagA393aORHA==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bytes": "^5.0.4",
            "@ethersproject/logger": "^5.0.5",
            "bn.js": "^4.4.0"
          }
        },
        "@ethersproject/bytes": {
          "version": "5.0.5",
          "resolved": "https://registry.npmjs.org/@ethersproject/bytes/-/bytes-5.0.5.tgz",
          "integrity": "sha512-IEj9HpZB+ACS6cZ+QQMTqmu/cnUK2fYNE6ms/PVxjoBjoxc6HCraLpam1KuRvreMy0i523PLmjN8OYeikRdcUQ==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/logger": "^5.0.5"
          }
        },
        "@ethersproject/constants": {
          "version": "5.0.5",
          "resolved": "https://registry.npmjs.org/@ethersproject/constants/-/constants-5.0.5.tgz",
          "integrity": "sha512-foaQVmxp2+ik9FrLUCtVrLZCj4M3Ibgkqvh+Xw/vFRSerkjVSYePApaVE5essxhoSlF1U9oXfWY09QI2AXtgKA==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bignumber": "^5.0.7"
          }
        },
        "@ethersproject/hash": {
          "version": "5.0.5",
          "resolved": "https://registry.npmjs.org/@ethersproject/hash/-/hash-5.0.5.tgz",
          "integrity": "sha512-GpI80/h2HDpfNKpCZoxQJCjOQloGnlD5hM1G+tZe8FQDJhEvFjJoPDuWv+NaYjJfOciKS2Axqc4Q4WamdLoUgg==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bytes": "^5.0.4",
            "@ethersproject/keccak256": "^5.0.3",
            "@ethersproject/logger": "^5.0.5",
            "@ethersproject/strings": "^5.0.4"
          }
        },
        "@ethersproject/keccak256": {
          "version": "5.0.4",
          "resolved": "https://registry.npmjs.org/@ethersproject/keccak256/-/keccak256-5.0.4.tgz",
          "integrity": "sha512-GNpiOUm9PGUxFNqOxYKDQBM0u68bG9XC9iOulEQ8I0tOx/4qUpgVzvgXL6ugxr0RY554Gz/NQsVqknqPzUcxpQ==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bytes": "^5.0.4",
            "js-sha3": "0.5.7"
          }
        },
        "@ethersproject/logger": {
          "version": "5.0.6",
          "resolved": "https://registry.npmjs.org/@ethersproject/logger/-/logger-5.0.6.tgz",
          "integrity": "sha512-FrX0Vnb3JZ1md/7GIZfmJ06XOAA8r3q9Uqt9O5orr4ZiksnbpXKlyDzQtlZ5Yv18RS8CAUbiKH9vwidJg1BPmQ==",
          "dev": true,
          "optional": true
        },
        "@ethersproject/properties": {
          "version": "5.0.4",
          "resolved": "https://registry.npmjs.org/@ethersproject/properties/-/properties-5.0.4.tgz",
          "integrity": "sha512-UdyX3GqBxFt15B0uSESdDNmhvEbK3ACdDXl2soshoPcneXuTswHDeA0LoPlnaZzhbgk4p6jqb4GMms5C26Qu6A==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/logger": "^5.0.5"
          }
        },
        "@ethersproject/rlp": {
          "version": "5.0.4",
          "resolved": "https://registry.npmjs.org/@ethersproject/rlp/-/rlp-5.0.4.tgz",
          "integrity": "sha512-5qrrZad7VTjofxSsm7Zg/7Dr4ZOln4S2CqiDdOuTv6MBKnXj0CiBojXyuDy52M8O3wxH0CyE924hXWTDV1PQWQ==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bytes": "^5.0.4",
            "@ethersproject/logger": "^5.0.5"
          }
        },
        "@ethersproject/signing-key": {
          "version": "5.0.5",
          "resolved": "https://registry.npmjs.org/@ethersproject/signing-key/-/signing-key-5.0.5.tgz",
          "integrity": "sha512-Z1wY7JC1HVO4CvQWY2TyTTuAr8xK3bJijZw1a9G92JEmKdv1j255R/0YLBBcFTl2J65LUjtXynNJ2GbArPGi5g==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bytes": "^5.0.4",
            "@ethersproject/logger": "^5.0.5",
            "@ethersproject/properties": "^5.0.3",
            "elliptic": "6.5.3"
          }
        },
        "@ethersproject/strings": {
          "version": "5.0.5",
          "resolved": "https://registry.npmjs.org/@ethersproject/strings/-/strings-5.0.5.tgz",
          "integrity": "sha512-JED6WaIV00xM/gvj8vSnd+0VWtDYdidTmavFRCTQakqfz+4tDo6Jz5LHgG+dd45h7ah7ykCHW0C7ZXWEDROCXQ==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/bytes": "^5.0.4",
            "@ethersproject/constants": "^5.0.4",
            "@ethersproject/logger": "^5.0.5"
          }
        },
        "@ethersproject/transactions": {
          "version": "5.0.6",
          "resolved": "https://registry.npmjs.org/@ethersproject/transactions/-/transactions-5.0.6.tgz",
          "integrity": "sha512-htsFhOD+NMBxx676A8ehSuwVV49iqpSB+CkjPZ02tpNew0K6p8g0CZ46Z1ZP946gIHAU80xQ0NACHYrjIUaCFA==",
          "dev": true,
          "optional": true,
          "requires": {
            "@ethersproject/address": "^5.0.4",
            "@ethersproject/bignumber": "^5.0.7",
            "@ethersproject/bytes": "^5.0.4",
            "@ethersproject/constants": "^5.0.4",
            "@ethersproject/keccak256": "^5.0.3",
            "@ethersproject/logger": "^5.0.5",
            "@ethersproject/properties": "^5.0.3",
            "@ethersproject/rlp": "^5.0.3",
            "@ethersproject/signing-key": "^5.0.4"
          }
        },
        "@sindresorhus/is": {
          "version": "0.14.0",
          "resolved": "https://registry.npmjs.org/@sindresorhus/is/-/is-0.14.0.tgz",
          "integrity": "sha512-9NET910DNaIPngYnLLPeg+Ogzqsi9uM4mSboU5y6p8S5DzMTVEsJZrawi+BoDNUVBa2DhJqQYUFvMDfgU062LQ==",
          "dev": true,
          "optional": true
        },
        "@szmarczak/http-timer": {
          "version": "1.1.2",
          "resolved": "https://registry.npmjs.org/@szmarczak/http-timer/-/http-timer-1.1.2.tgz",
          "integrity": "sha512-XIB2XbzHTN6ieIjfIMV9hlVcfPU26s2vafYWQcZHWXHOxiaRZYEDKEwdl129Zyg50+foYV2jCgtrqSA6qNuNSA==",
          "dev": true,
          "optional": true,
          "requires": {
            "defer-to-connect": "^1.0.1"
          }
        },
          "version": "14.11.8",
          "resolved": "https://registry.npmjs.org/@types/node/-/node-14.11.8.tgz",
          "integrity": "sha512-KPcKqKm5UKDkaYPTuXSx8wEP7vE9GnuaXIZKijwRYcePpZFDVuy2a57LarFKiORbHOuTOOwYzxVxcUzsh2P2Pw==",
        "@types/secp256k1": {
          "version": "4.0.1",
          "resolved": "https://registry.npmjs.org/@types/secp256k1/-/secp256k1-4.0.1.tgz",
          "integrity": "sha512-+ZjSA8ELlOp8SlKi0YLB2tz9d5iPNEmOBd+8Rz21wTMdaXQIa9b6TEnD6l5qKOCypE7FSyPyck12qZJxSDNoog==",
          "dev": true,
          "requires": {
            "@types/node": "*"
          }
        },
        "@yarnpkg/lockfile": {
          "version": "1.1.0",
          "resolved": "https://registry.npmjs.org/@yarnpkg/lockfile/-/lockfile-1.1.0.tgz",
          "integrity": "sha512-GpSwvyXOcOOlV70vbnzjj4fW5xW/FdUF6nQEt1ENy7m4ZCczi1+/buVUPAqmGfqznsORNFzUMjctTIp8a9tuCQ==",
          "dev": true
        },
        "abstract-leveldown": {
          "version": "3.0.0",
          "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-3.0.0.tgz",
          "integrity": "sha512-KUWx9UWGQD12zsmLNj64/pndaz4iJh/Pj7nopgkfDG6RlCcbMZvT6+9l7dchK4idog2Is8VdC/PvNbFuFmalIQ==",
          "dev": true,
          "requires": {
            "xtend": "~4.0.0"
          }
        },
        "accepts": {
          "version": "1.3.7",
          "resolved": "https://registry.npmjs.org/accepts/-/accepts-1.3.7.tgz",
          "integrity": "sha512-Il80Qs2WjYlJIBNzNkK6KYqlVMTbZLXgHx2oT0pU/fjRHyEp+PEfEPY0R3WCwAGVOtauxh1hOxNgIf5bv7dQpA==",
          "dev": true,
          "optional": true,
          "requires": {
            "mime-types": "~2.1.24",
            "negotiator": "0.6.2"
          }
        },
        "aes-js": {
          "version": "3.1.2",
          "resolved": "https://registry.npmjs.org/aes-js/-/aes-js-3.1.2.tgz",
          "integrity": "sha512-e5pEa2kBnBOgR4Y/p20pskXI74UEz7de8ZGVo58asOtvSVG5YAbJeELPZxOmt+Bnz3rX753YKhfIn4X4l1PPRQ==",
          "dev": true,
          "optional": true
        },
        "ajv": {
          "version": "6.12.5",
          "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.12.5.tgz",
          "integrity": "sha512-lRF8RORchjpKG50/WFf8xmg7sgCLFiYNNnqdKflk63whMQcWR5ngGjiSXkL9bjxy6B2npOK2HSMN49jEBMSkag==",
          "dev": true,
          "requires": {
            "fast-deep-equal": "^3.1.1",
            "fast-json-stable-stringify": "^2.0.0",
            "json-schema-traverse": "^0.4.1",
            "uri-js": "^4.2.2"
          }
        },
        "ansi-styles": {
          "version": "3.2.1",
          "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-3.2.1.tgz",
          "integrity": "sha512-VT0ZI6kZRdTh8YyJw3SMbYm/u+NqfsAxEpWO0Pf9sq8/e94WxxOpPKx9FR1FlyCtOVDNOQ+8ntlqFxiRc+r5qA==",
          "dev": true,
          "requires": {
            "color-convert": "^1.9.0"
          }
        },
        "arr-diff": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/arr-diff/-/arr-diff-4.0.0.tgz",
          "integrity": "sha1-1kYQdP6/7HHn4VI1dhoyml3HxSA=",
          "dev": true
        },
        "arr-flatten": {
          "version": "1.1.0",
          "resolved": "https://registry.npmjs.org/arr-flatten/-/arr-flatten-1.1.0.tgz",
          "integrity": "sha512-L3hKV5R/p5o81R7O02IGnwpDmkp6E982XhtbuwSe3O4qOtMMMtodicASA1Cny2U+aCXcNpml+m4dPsvsJ3jatg==",
          "dev": true
        },
        "arr-union": {
          "version": "3.1.0",
          "resolved": "https://registry.npmjs.org/arr-union/-/arr-union-3.1.0.tgz",
          "integrity": "sha1-45sJrqne+Gao8gbiiK9jkZuuOcQ=",
          "dev": true
        },
        "array-flatten": {
          "version": "1.1.1",
          "resolved": "https://registry.npmjs.org/array-flatten/-/array-flatten-1.1.1.tgz",
          "integrity": "sha1-ml9pkFGx5wczKPKgCJaLZOopVdI=",
          "dev": true,
          "optional": true
        },
        "array-unique": {
          "version": "0.3.2",
          "resolved": "https://registry.npmjs.org/array-unique/-/array-unique-0.3.2.tgz",
          "integrity": "sha1-qJS3XUvE9s1nnvMkSp/Y9Gri1Cg=",
          "dev": true
        },
        "asn1": {
          "version": "0.2.4",
          "resolved": "https://registry.npmjs.org/asn1/-/asn1-0.2.4.tgz",
          "integrity": "sha512-jxwzQpLQjSmWXgwaCZE9Nz+glAG01yF1QnWgbhGwHI5A6FRIEY6IVqtHhIepHqI7/kyEyQEagBC5mBEFlIYvdg==",
          "dev": true,
          "requires": {
            "safer-buffer": "~2.1.0"
          }
        },
        "asn1.js": {
          "version": "5.4.1",
          "resolved": "https://registry.npmjs.org/asn1.js/-/asn1.js-5.4.1.tgz",
          "integrity": "sha512-+I//4cYPccV8LdmBLiX8CYvf9Sp3vQsrqu2QNXRcrbiWvcx/UdlFiqUJJzxRQxgsZmvhXhn4cSKeSmoFjVdupA==",
          "dev": true,
          "optional": true,
          "requires": {
            "bn.js": "^4.0.0",
            "inherits": "^2.0.1",
            "minimalistic-assert": "^1.0.0",
            "safer-buffer": "^2.1.0"
          }
        },
        "assert-plus": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/assert-plus/-/assert-plus-1.0.0.tgz",
          "integrity": "sha1-8S4PPF13sLHN2RRpQuTpbB5N1SU=",
          "dev": true
        },
        "assign-symbols": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/assign-symbols/-/assign-symbols-1.0.0.tgz",
          "integrity": "sha1-WWZ/QfrdTyDMvCu5a41Pf3jsA2c=",
          "dev": true
        },
        "async": {
          "version": "2.6.2",
          "resolved": "https://registry.npmjs.org/async/-/async-2.6.2.tgz",
          "integrity": "sha512-H1qVYh1MYhEEFLsP97cVKqCGo7KfCyTt6uEWqsTBr9SO84oK9Uwbyd/yCW+6rKJLHksBNUVWZDAjfS+Ccx0Bbg==",
          "dev": true,
          "requires": {
            "lodash": "^4.17.11"
          }
        },
        "async-eventemitter": {
          "version": "0.2.4",
          "resolved": "https://registry.npmjs.org/async-eventemitter/-/async-eventemitter-0.2.4.tgz",
          "integrity": "sha512-pd20BwL7Yt1zwDFy+8MX8F1+WCT8aQeKj0kQnTrH9WaeRETlRamVhD0JtRPmrV4GfOJ2F9CvdQkZeZhnh2TuHw==",
          "dev": true,
          "requires": {
            "async": "^2.4.0"
          }
        },
        "async-limiter": {
          "version": "1.0.1",
          "resolved": "https://registry.npmjs.org/async-limiter/-/async-limiter-1.0.1.tgz",
          "integrity": "sha512-csOlWGAcRFJaI6m+F2WKdnMKr4HhdhFVBk0H/QbJFMCr+uO2kwohwXQPxw/9OCxp05r5ghVBFSyioixx3gfkNQ==",
          "dev": true
        },
        "asynckit": {
          "version": "0.4.0",
          "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
          "integrity": "sha1-x57Zf380y48robyXkLzDZkdLS3k=",
          "dev": true
        },
        "atob": {
          "version": "2.1.2",
          "resolved": "https://registry.npmjs.org/atob/-/atob-2.1.2.tgz",
          "integrity": "sha512-Wm6ukoaOGJi/73p/cl2GvLjTI5JM1k/O14isD73YML8StrH/7/lRFgmg8nICZgD3bZZvjwCGxtMOD3wWNAu8cg==",
          "dev": true
        },
        "aws-sign2": {
          "version": "0.7.0",
          "resolved": "https://registry.npmjs.org/aws-sign2/-/aws-sign2-0.7.0.tgz",
          "integrity": "sha1-tG6JCTSpWR8tL2+G1+ap8bP+dqg=",
          "dev": true
        },
        "aws4": {
          "version": "1.10.1",
          "resolved": "https://registry.npmjs.org/aws4/-/aws4-1.10.1.tgz",
          "integrity": "sha512-zg7Hz2k5lI8kb7U32998pRRFin7zJlkfezGJjUc2heaD4Pw2wObakCDVzkKztTm/Ln7eiVvYsjqak0Ed4LkMDA==",
          "dev": true
        },
        "babel-code-frame": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-code-frame/-/babel-code-frame-6.26.0.tgz",
          "integrity": "sha1-Y/1D99weO7fONZR9uP42mj9Yx0s=",
          "dev": true,
          "requires": {
            "chalk": "^1.1.3",
            "esutils": "^2.0.2",
            "js-tokens": "^3.0.2"
          },
          "dependencies": {
            "ansi-regex": {
              "version": "2.1.1",
              "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-2.1.1.tgz",
              "integrity": "sha1-w7M6te42DYbg5ijwRorn7yfWVN8=",
              "dev": true
            },
            "ansi-styles": {
              "version": "2.2.1",
              "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-2.2.1.tgz",
              "integrity": "sha1-tDLdM1i2NM914eRmQ2gkBTPB3b4=",
              "dev": true
            },
            "chalk": {
              "version": "1.1.3",
              "resolved": "https://registry.npmjs.org/chalk/-/chalk-1.1.3.tgz",
              "integrity": "sha1-qBFcVeSnAv5NFQq9OHKCKn4J/Jg=",
              "dev": true,
              "requires": {
                "ansi-styles": "^2.2.1",
                "escape-string-regexp": "^1.0.2",
                "has-ansi": "^2.0.0",
                "strip-ansi": "^3.0.0",
                "supports-color": "^2.0.0"
              }
            },
            "js-tokens": {
              "version": "3.0.2",
              "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-3.0.2.tgz",
              "integrity": "sha1-mGbfOVECEw449/mWvOtlRDIJwls=",
              "dev": true
            },
            "strip-ansi": {
              "version": "3.0.1",
              "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-3.0.1.tgz",
              "integrity": "sha1-ajhfuIU9lS1f8F0Oiq+UJ43GPc8=",
              "dev": true,
              "requires": {
                "ansi-regex": "^2.0.0"
              }
            },
            "supports-color": {
              "version": "2.0.0",
              "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-2.0.0.tgz",
              "integrity": "sha1-U10EXOa2Nj+kARcIRimZXp3zJMc=",
              "dev": true
            }
          }
        },
        "babel-core": {
          "version": "6.26.3",
          "resolved": "https://registry.npmjs.org/babel-core/-/babel-core-6.26.3.tgz",
          "integrity": "sha512-6jyFLuDmeidKmUEb3NM+/yawG0M2bDZ9Z1qbZP59cyHLz8kYGKYwpJP0UwUKKUiTRNvxfLesJnTedqczP7cTDA==",
          "dev": true,
          "requires": {
            "babel-code-frame": "^6.26.0",
            "babel-generator": "^6.26.0",
            "babel-helpers": "^6.24.1",
            "babel-messages": "^6.23.0",
            "babel-register": "^6.26.0",
            "babel-runtime": "^6.26.0",
            "babel-template": "^6.26.0",
            "babel-traverse": "^6.26.0",
            "babel-types": "^6.26.0",
            "babylon": "^6.18.0",
            "convert-source-map": "^1.5.1",
            "debug": "^2.6.9",
            "json5": "^0.5.1",
            "lodash": "^4.17.4",
            "minimatch": "^3.0.4",
            "path-is-absolute": "^1.0.1",
            "private": "^0.1.8",
            "slash": "^1.0.0",
            "source-map": "^0.5.7"
          },
          "dependencies": {
            "debug": {
              "version": "2.6.9",
              "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
              "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
              "dev": true,
              "requires": {
                "ms": "2.0.0"
              }
            },
            "json5": {
              "version": "0.5.1",
              "resolved": "https://registry.npmjs.org/json5/-/json5-0.5.1.tgz",
              "integrity": "sha1-Hq3nrMASA0rYTiOWdn6tn6VJWCE=",
              "dev": true
            },
            "ms": {
              "version": "2.0.0",
              "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
              "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
              "dev": true
            },
            "slash": {
              "version": "1.0.0",
              "resolved": "https://registry.npmjs.org/slash/-/slash-1.0.0.tgz",
              "integrity": "sha1-xB8vbDn8FtHNF61LXYlhFK5HDVU=",
              "dev": true
            }
          }
        },
        "babel-generator": {
          "version": "6.26.1",
          "resolved": "https://registry.npmjs.org/babel-generator/-/babel-generator-6.26.1.tgz",
          "integrity": "sha512-HyfwY6ApZj7BYTcJURpM5tznulaBvyio7/0d4zFOeMPUmfxkCjHocCuoLa2SAGzBI8AREcH3eP3758F672DppA==",
          "dev": true,
          "requires": {
            "babel-messages": "^6.23.0",
            "babel-runtime": "^6.26.0",
            "babel-types": "^6.26.0",
            "detect-indent": "^4.0.0",
            "jsesc": "^1.3.0",
            "lodash": "^4.17.4",
            "source-map": "^0.5.7",
            "trim-right": "^1.0.1"
          },
          "dependencies": {
            "jsesc": {
              "version": "1.3.0",
              "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-1.3.0.tgz",
              "integrity": "sha1-RsP+yMGJKxKwgz25vHYiF226s0s=",
              "dev": true
            }
          }
        },
        "babel-helper-builder-binary-assignment-operator-visitor": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-builder-binary-assignment-operator-visitor/-/babel-helper-builder-binary-assignment-operator-visitor-6.24.1.tgz",
          "integrity": "sha1-zORReto1b0IgvK6KAsKzRvmlZmQ=",
          "dev": true,
          "requires": {
            "babel-helper-explode-assignable-expression": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-call-delegate": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-call-delegate/-/babel-helper-call-delegate-6.24.1.tgz",
          "integrity": "sha1-7Oaqzdx25Bw0YfiL/Fdb0Nqi340=",
          "dev": true,
          "requires": {
            "babel-helper-hoist-variables": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-traverse": "^6.24.1",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-define-map": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-helper-define-map/-/babel-helper-define-map-6.26.0.tgz",
          "integrity": "sha1-pfVtq0GiX5fstJjH66ypgZ+Vvl8=",
          "dev": true,
          "requires": {
            "babel-helper-function-name": "^6.24.1",
            "babel-runtime": "^6.26.0",
            "babel-types": "^6.26.0",
            "lodash": "^4.17.4"
          }
        },
        "babel-helper-explode-assignable-expression": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-explode-assignable-expression/-/babel-helper-explode-assignable-expression-6.24.1.tgz",
          "integrity": "sha1-8luCz33BBDPFX3BZLVdGQArCLKo=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-traverse": "^6.24.1",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-function-name": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-function-name/-/babel-helper-function-name-6.24.1.tgz",
          "integrity": "sha1-00dbjAPtmCQqJbSDUasYOZ01gKk=",
          "dev": true,
          "requires": {
            "babel-helper-get-function-arity": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1",
            "babel-traverse": "^6.24.1",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-get-function-arity": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-get-function-arity/-/babel-helper-get-function-arity-6.24.1.tgz",
          "integrity": "sha1-j3eCqpNAfEHTqlCQj4mwMbG2hT0=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-hoist-variables": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-hoist-variables/-/babel-helper-hoist-variables-6.24.1.tgz",
          "integrity": "sha1-HssnaJydJVE+rbyZFKc/VAi+enY=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-optimise-call-expression": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-optimise-call-expression/-/babel-helper-optimise-call-expression-6.24.1.tgz",
          "integrity": "sha1-96E0J7qfc/j0+pk8VKl4gtEkQlc=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-regex": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-helper-regex/-/babel-helper-regex-6.26.0.tgz",
          "integrity": "sha1-MlxZ+QL4LyS3T6zu0DY5VPZJXnI=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.26.0",
            "babel-types": "^6.26.0",
            "lodash": "^4.17.4"
          }
        },
        "babel-helper-remap-async-to-generator": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-remap-async-to-generator/-/babel-helper-remap-async-to-generator-6.24.1.tgz",
          "integrity": "sha1-XsWBgnrXI/7N04HxySg5BnbkVRs=",
          "dev": true,
          "requires": {
            "babel-helper-function-name": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1",
            "babel-traverse": "^6.24.1",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helper-replace-supers": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helper-replace-supers/-/babel-helper-replace-supers-6.24.1.tgz",
          "integrity": "sha1-v22/5Dk40XNpohPKiov3S2qQqxo=",
          "dev": true,
          "requires": {
            "babel-helper-optimise-call-expression": "^6.24.1",
            "babel-messages": "^6.23.0",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1",
            "babel-traverse": "^6.24.1",
            "babel-types": "^6.24.1"
          }
        },
        "babel-helpers": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-helpers/-/babel-helpers-6.24.1.tgz",
          "integrity": "sha1-NHHenK7DiOXIUOWX5Yom3fN2ArI=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1"
          }
        },
        "babel-messages": {
          "version": "6.23.0",
          "resolved": "https://registry.npmjs.org/babel-messages/-/babel-messages-6.23.0.tgz",
          "integrity": "sha1-8830cDhYA1sqKVHG7F7fbGLyYw4=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-check-es2015-constants": {
          "version": "6.22.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-check-es2015-constants/-/babel-plugin-check-es2015-constants-6.22.0.tgz",
          "integrity": "sha1-NRV7EBQm/S/9PaP3XH0ekYNbv4o=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-syntax-async-functions": {
          "version": "6.13.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-syntax-async-functions/-/babel-plugin-syntax-async-functions-6.13.0.tgz",
          "integrity": "sha1-ytnK0RkbWtY0vzCuCHI5HgZHvpU=",
          "dev": true
        },
        "babel-plugin-syntax-exponentiation-operator": {
          "version": "6.13.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-syntax-exponentiation-operator/-/babel-plugin-syntax-exponentiation-operator-6.13.0.tgz",
          "integrity": "sha1-nufoM3KQ2pUoggGmpX9BcDF4MN4=",
          "dev": true
        },
        "babel-plugin-syntax-trailing-function-commas": {
          "version": "6.22.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-syntax-trailing-function-commas/-/babel-plugin-syntax-trailing-function-commas-6.22.0.tgz",
          "integrity": "sha1-ugNgk3+NBuQBgKQ/4NVhb/9TLPM=",
          "dev": true
        },
        "babel-plugin-transform-async-to-generator": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-async-to-generator/-/babel-plugin-transform-async-to-generator-6.24.1.tgz",
          "integrity": "sha1-ZTbjeK/2yx1VF6wOQOs+n8jQh2E=",
          "dev": true,
          "requires": {
            "babel-helper-remap-async-to-generator": "^6.24.1",
            "babel-plugin-syntax-async-functions": "^6.8.0",
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-arrow-functions": {
          "version": "6.22.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-arrow-functions/-/babel-plugin-transform-es2015-arrow-functions-6.22.0.tgz",
          "integrity": "sha1-RSaSy3EdX3ncf4XkQM5BufJE0iE=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-block-scoped-functions": {
          "version": "6.22.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-block-scoped-functions/-/babel-plugin-transform-es2015-block-scoped-functions-6.22.0.tgz",
          "integrity": "sha1-u8UbSflk1wy42OC5ToICRs46YUE=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-block-scoping": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-block-scoping/-/babel-plugin-transform-es2015-block-scoping-6.26.0.tgz",
          "integrity": "sha1-1w9SmcEwjQXBL0Y4E7CgnnOxiV8=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.26.0",
            "babel-template": "^6.26.0",
            "babel-traverse": "^6.26.0",
            "babel-types": "^6.26.0",
            "lodash": "^4.17.4"
          }
        },
        "babel-plugin-transform-es2015-classes": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-classes/-/babel-plugin-transform-es2015-classes-6.24.1.tgz",
          "integrity": "sha1-WkxYpQyclGHlZLSyo7+ryXolhNs=",
          "dev": true,
          "requires": {
            "babel-helper-define-map": "^6.24.1",
            "babel-helper-function-name": "^6.24.1",
            "babel-helper-optimise-call-expression": "^6.24.1",
            "babel-helper-replace-supers": "^6.24.1",
            "babel-messages": "^6.23.0",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1",
            "babel-traverse": "^6.24.1",
            "babel-types": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-computed-properties": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-computed-properties/-/babel-plugin-transform-es2015-computed-properties-6.24.1.tgz",
          "integrity": "sha1-b+Ko0WiV1WNPTNmZttNICjCBWbM=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-destructuring": {
          "version": "6.23.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-destructuring/-/babel-plugin-transform-es2015-destructuring-6.23.0.tgz",
          "integrity": "sha1-mXux8auWf2gtKwh2/jWNYOdlxW0=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-duplicate-keys": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-duplicate-keys/-/babel-plugin-transform-es2015-duplicate-keys-6.24.1.tgz",
          "integrity": "sha1-c+s9MQypaePvnskcU3QabxV2Qj4=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-for-of": {
          "version": "6.23.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-for-of/-/babel-plugin-transform-es2015-for-of-6.23.0.tgz",
          "integrity": "sha1-9HyVsrYT3x0+zC/bdXNiPHUkhpE=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-function-name": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-function-name/-/babel-plugin-transform-es2015-function-name-6.24.1.tgz",
          "integrity": "sha1-g0yJhTvDaxrw86TF26qU/Y6sqos=",
          "dev": true,
          "requires": {
            "babel-helper-function-name": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-literals": {
          "version": "6.22.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-literals/-/babel-plugin-transform-es2015-literals-6.22.0.tgz",
          "integrity": "sha1-T1SgLWzWbPkVKAAZox0xklN3yi4=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-modules-amd": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-modules-amd/-/babel-plugin-transform-es2015-modules-amd-6.24.1.tgz",
          "integrity": "sha1-Oz5UAXI5hC1tGcMBHEvS8AoA0VQ=",
          "dev": true,
          "requires": {
            "babel-plugin-transform-es2015-modules-commonjs": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-modules-commonjs": {
          "version": "6.26.2",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-modules-commonjs/-/babel-plugin-transform-es2015-modules-commonjs-6.26.2.tgz",
          "integrity": "sha512-CV9ROOHEdrjcwhIaJNBGMBCodN+1cfkwtM1SbUHmvyy35KGT7fohbpOxkE2uLz1o6odKK2Ck/tz47z+VqQfi9Q==",
          "dev": true,
          "requires": {
            "babel-plugin-transform-strict-mode": "^6.24.1",
            "babel-runtime": "^6.26.0",
            "babel-template": "^6.26.0",
            "babel-types": "^6.26.0"
          }
        },
        "babel-plugin-transform-es2015-modules-systemjs": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-modules-systemjs/-/babel-plugin-transform-es2015-modules-systemjs-6.24.1.tgz",
          "integrity": "sha1-/4mhQrkRmpBhlfXxBuzzBdlAfSM=",
          "dev": true,
          "requires": {
            "babel-helper-hoist-variables": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-modules-umd": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-modules-umd/-/babel-plugin-transform-es2015-modules-umd-6.24.1.tgz",
          "integrity": "sha1-rJl+YoXNGO1hdq22B9YCNErThGg=",
          "dev": true,
          "requires": {
            "babel-plugin-transform-es2015-modules-amd": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-object-super": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-object-super/-/babel-plugin-transform-es2015-object-super-6.24.1.tgz",
          "integrity": "sha1-JM72muIcuDp/hgPa0CH1cusnj40=",
          "dev": true,
          "requires": {
            "babel-helper-replace-supers": "^6.24.1",
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-parameters": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-parameters/-/babel-plugin-transform-es2015-parameters-6.24.1.tgz",
          "integrity": "sha1-V6w1GrScrxSpfNE7CfZv3wpiXys=",
          "dev": true,
          "requires": {
            "babel-helper-call-delegate": "^6.24.1",
            "babel-helper-get-function-arity": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-template": "^6.24.1",
            "babel-traverse": "^6.24.1",
            "babel-types": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-shorthand-properties": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-shorthand-properties/-/babel-plugin-transform-es2015-shorthand-properties-6.24.1.tgz",
          "integrity": "sha1-JPh11nIch2YbvZmkYi5R8U3jiqA=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-spread": {
          "version": "6.22.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-spread/-/babel-plugin-transform-es2015-spread-6.22.0.tgz",
          "integrity": "sha1-1taKmfia7cRTbIGlQujdnxdG+NE=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-sticky-regex": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-sticky-regex/-/babel-plugin-transform-es2015-sticky-regex-6.24.1.tgz",
          "integrity": "sha1-AMHNsaynERLN8M9hJsLta0V8zbw=",
          "dev": true,
          "requires": {
            "babel-helper-regex": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-plugin-transform-es2015-template-literals": {
          "version": "6.22.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-template-literals/-/babel-plugin-transform-es2015-template-literals-6.22.0.tgz",
          "integrity": "sha1-qEs0UPfp+PH2g51taH2oS7EjbY0=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-typeof-symbol": {
          "version": "6.23.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-typeof-symbol/-/babel-plugin-transform-es2015-typeof-symbol-6.23.0.tgz",
          "integrity": "sha1-3sCfHN3/lLUqxz1QXITfWdzOs3I=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-es2015-unicode-regex": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-es2015-unicode-regex/-/babel-plugin-transform-es2015-unicode-regex-6.24.1.tgz",
          "integrity": "sha1-04sS9C6nMj9yk4fxinxa4frrNek=",
          "dev": true,
          "requires": {
            "babel-helper-regex": "^6.24.1",
            "babel-runtime": "^6.22.0",
            "regexpu-core": "^2.0.0"
          }
        },
        "babel-plugin-transform-exponentiation-operator": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-exponentiation-operator/-/babel-plugin-transform-exponentiation-operator-6.24.1.tgz",
          "integrity": "sha1-KrDJx/MJj6SJB3cruBP+QejeOg4=",
          "dev": true,
          "requires": {
            "babel-helper-builder-binary-assignment-operator-visitor": "^6.24.1",
            "babel-plugin-syntax-exponentiation-operator": "^6.8.0",
            "babel-runtime": "^6.22.0"
          }
        },
        "babel-plugin-transform-regenerator": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-regenerator/-/babel-plugin-transform-regenerator-6.26.0.tgz",
          "integrity": "sha1-4HA2lvveJ/Cj78rPi03KL3s6jy8=",
          "dev": true,
          "requires": {
            "regenerator-transform": "^0.10.0"
          }
        },
        "babel-plugin-transform-strict-mode": {
          "version": "6.24.1",
          "resolved": "https://registry.npmjs.org/babel-plugin-transform-strict-mode/-/babel-plugin-transform-strict-mode-6.24.1.tgz",
          "integrity": "sha1-1fr3qleKZbvlkc9e2uBKDGcCB1g=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.22.0",
            "babel-types": "^6.24.1"
          }
        },
        "babel-preset-env": {
          "version": "1.7.0",
          "resolved": "https://registry.npmjs.org/babel-preset-env/-/babel-preset-env-1.7.0.tgz",
          "integrity": "sha512-9OR2afuKDneX2/q2EurSftUYM0xGu4O2D9adAhVfADDhrYDaxXV0rBbevVYoY9n6nyX1PmQW/0jtpJvUNr9CHg==",
          "dev": true,
          "requires": {
            "babel-plugin-check-es2015-constants": "^6.22.0",
            "babel-plugin-syntax-trailing-function-commas": "^6.22.0",
            "babel-plugin-transform-async-to-generator": "^6.22.0",
            "babel-plugin-transform-es2015-arrow-functions": "^6.22.0",
            "babel-plugin-transform-es2015-block-scoped-functions": "^6.22.0",
            "babel-plugin-transform-es2015-block-scoping": "^6.23.0",
            "babel-plugin-transform-es2015-classes": "^6.23.0",
            "babel-plugin-transform-es2015-computed-properties": "^6.22.0",
            "babel-plugin-transform-es2015-destructuring": "^6.23.0",
            "babel-plugin-transform-es2015-duplicate-keys": "^6.22.0",
            "babel-plugin-transform-es2015-for-of": "^6.23.0",
            "babel-plugin-transform-es2015-function-name": "^6.22.0",
            "babel-plugin-transform-es2015-literals": "^6.22.0",
            "babel-plugin-transform-es2015-modules-amd": "^6.22.0",
            "babel-plugin-transform-es2015-modules-commonjs": "^6.23.0",
            "babel-plugin-transform-es2015-modules-systemjs": "^6.23.0",
            "babel-plugin-transform-es2015-modules-umd": "^6.23.0",
            "babel-plugin-transform-es2015-object-super": "^6.22.0",
            "babel-plugin-transform-es2015-parameters": "^6.23.0",
            "babel-plugin-transform-es2015-shorthand-properties": "^6.22.0",
            "babel-plugin-transform-es2015-spread": "^6.22.0",
            "babel-plugin-transform-es2015-sticky-regex": "^6.22.0",
            "babel-plugin-transform-es2015-template-literals": "^6.22.0",
            "babel-plugin-transform-es2015-typeof-symbol": "^6.23.0",
            "babel-plugin-transform-es2015-unicode-regex": "^6.22.0",
            "babel-plugin-transform-exponentiation-operator": "^6.22.0",
            "babel-plugin-transform-regenerator": "^6.22.0",
            "browserslist": "^3.2.6",
            "invariant": "^2.2.2",
            "semver": "^5.3.0"
          },
          "dependencies": {
            "semver": {
              "version": "5.7.1",
              "resolved": "https://registry.npmjs.org/semver/-/semver-5.7.1.tgz",
              "integrity": "sha512-sauaDf/PZdVgrLTNYHRtpXa1iRiKcaebiKQ1BJdpQlWH2lCvexQdX55snPFyK7QzpudqbCI0qXFfOasHdyNDGQ==",
              "dev": true
            }
          }
        },
        "babel-register": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-register/-/babel-register-6.26.0.tgz",
          "integrity": "sha1-btAhFz4vy0htestFxgCahW9kcHE=",
          "dev": true,
          "requires": {
            "babel-core": "^6.26.0",
            "babel-runtime": "^6.26.0",
            "core-js": "^2.5.0",
            "home-or-tmp": "^2.0.0",
            "lodash": "^4.17.4",
            "mkdirp": "^0.5.1",
            "source-map-support": "^0.4.15"
          },
          "dependencies": {
            "source-map-support": {
              "version": "0.4.18",
              "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.4.18.tgz",
              "integrity": "sha512-try0/JqxPLF9nOjvSta7tVondkP5dwgyLDjVoyMDlmjugT2lRZ1OfsrYTkCd2hkDnJTKRbO/Rl3orm8vlsUzbA==",
              "dev": true,
              "requires": {
                "source-map": "^0.5.6"
              }
            }
          }
        },
        "babel-runtime": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-runtime/-/babel-runtime-6.26.0.tgz",
          "integrity": "sha1-llxwWGaOgrVde/4E/yM3vItWR/4=",
          "dev": true,
          "requires": {
            "core-js": "^2.4.0",
            "regenerator-runtime": "^0.11.0"
          }
        },
        "babel-template": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-template/-/babel-template-6.26.0.tgz",
          "integrity": "sha1-3gPi0WOWsGn0bdn/+FIfsaDjXgI=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.26.0",
            "babel-traverse": "^6.26.0",
            "babel-types": "^6.26.0",
            "babylon": "^6.18.0",
            "lodash": "^4.17.4"
          }
        },
        "babel-traverse": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-traverse/-/babel-traverse-6.26.0.tgz",
          "integrity": "sha1-RqnL1+3MYsjlwGTi0tjQ9ANXZu4=",
          "dev": true,
          "requires": {
            "babel-code-frame": "^6.26.0",
            "babel-messages": "^6.23.0",
            "babel-runtime": "^6.26.0",
            "babel-types": "^6.26.0",
            "babylon": "^6.18.0",
            "debug": "^2.6.8",
            "globals": "^9.18.0",
            "invariant": "^2.2.2",
            "lodash": "^4.17.4"
          },
          "dependencies": {
            "debug": {
              "version": "2.6.9",
              "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
              "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
              "dev": true,
              "requires": {
                "ms": "2.0.0"
              }
            },
            "globals": {
              "version": "9.18.0",
              "resolved": "https://registry.npmjs.org/globals/-/globals-9.18.0.tgz",
              "integrity": "sha512-S0nG3CLEQiY/ILxqtztTWH/3iRRdyBLw6KMDxnKMchrtbj2OFmehVh0WUCfW3DUrIgx/qFrJPICrq4Z4sTR9UQ==",
              "dev": true
            },
            "ms": {
              "version": "2.0.0",
              "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
              "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
              "dev": true
            }
          }
        },
        "babel-types": {
          "version": "6.26.0",
          "resolved": "https://registry.npmjs.org/babel-types/-/babel-types-6.26.0.tgz",
          "integrity": "sha1-o7Bz+Uq0nrb6Vc1lInozQ4BjJJc=",
          "dev": true,
          "requires": {
            "babel-runtime": "^6.26.0",
            "esutils": "^2.0.2",
            "lodash": "^4.17.4",
            "to-fast-properties": "^1.0.3"
          },
          "dependencies": {
            "to-fast-properties": {
              "version": "1.0.3",
              "resolved": "https://registry.npmjs.org/to-fast-properties/-/to-fast-properties-1.0.3.tgz",
              "integrity": "sha1-uDVx+k2MJbguIxsG46MFXeTKGkc=",
              "dev": true
            }
          }
        },
        "babelify": {
          "version": "7.3.0",
          "resolved": "https://registry.npmjs.org/babelify/-/babelify-7.3.0.tgz",
          "integrity": "sha1-qlau3nBn/XvVSWZu4W3ChQh+iOU=",
          "dev": true,
          "requires": {
            "babel-core": "^6.0.14",
            "object-assign": "^4.0.0"
          }
        },
        "babylon": {
          "version": "6.18.0",
          "resolved": "https://registry.npmjs.org/babylon/-/babylon-6.18.0.tgz",
          "integrity": "sha512-q/UEjfGJ2Cm3oKV71DJz9d25TPnq5rhBVL2Q4fA5wcC3jcrdn7+SssEybFIxwAvvP+YCsCYNKughoF33GxgycQ==",
          "dev": true
        },
        "backoff": {
          "version": "2.5.0",
          "resolved": "https://registry.npmjs.org/backoff/-/backoff-2.5.0.tgz",
          "integrity": "sha1-9hbtqdPktmuMp/ynn2lXIsX44m8=",
          "dev": true,
          "requires": {
            "precond": "0.2"
          }
        },
        "balanced-match": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.0.tgz",
          "integrity": "sha1-ibTRmasr7kneFk6gK4nORi1xt2c=",
          "dev": true
        },
        "base": {
          "version": "0.11.2",
          "resolved": "https://registry.npmjs.org/base/-/base-0.11.2.tgz",
          "integrity": "sha512-5T6P4xPgpp0YDFvSWwEZ4NoE3aM4QBQXDzmVbraCkFj8zHM+mba8SyqB5DbZWyR7mYHo6Y7BdQo3MoA4m0TeQg==",
          "dev": true,
          "requires": {
            "cache-base": "^1.0.1",
            "class-utils": "^0.3.5",
            "component-emitter": "^1.2.1",
            "define-property": "^1.0.0",
            "isobject": "^3.0.1",
            "mixin-deep": "^1.2.0",
            "pascalcase": "^0.1.1"
          },
          "dependencies": {
            "define-property": {
              "version": "1.0.0",
              "resolved": "https://registry.npmjs.org/define-property/-/define-property-1.0.0.tgz",
              "integrity": "sha1-dp66rz9KY6rTr56NMEybvnm/sOY=",
              "dev": true,
              "requires": {
                "is-descriptor": "^1.0.0"
              }
            }
          }
        },
        "base-x": {
          "version": "3.0.8",
          "resolved": "https://registry.npmjs.org/base-x/-/base-x-3.0.8.tgz",
          "integrity": "sha512-Rl/1AWP4J/zRrk54hhlxH4drNxPJXYUaKffODVI53/dAsV4t9fBxyxYKAVPU1XBHxYwOWP9h9H0hM2MVw4YfJA==",
          "dev": true,
          "requires": {
            "safe-buffer": "^5.0.1"
          }
        },
        "base64-js": {
          "version": "1.3.1",
          "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.3.1.tgz",
          "integrity": "sha512-mLQ4i2QO1ytvGWFWmcngKO//JXAQueZvwEKtjgQFM4jIK0kU+ytMfplL8j+n5mspOfjHwoAg+9yhb7BwAHm36g==",
          "dev": true
        },
        "bcrypt-pbkdf": {
          "version": "1.0.2",
          "resolved": "https://registry.npmjs.org/bcrypt-pbkdf/-/bcrypt-pbkdf-1.0.2.tgz",
          "integrity": "sha1-pDAdOJtqQ/m2f/PKEaP2Y342Dp4=",
          "dev": true,
          "requires": {
            "tweetnacl": "^0.14.3"
          },
          "dependencies": {
            "tweetnacl": {
              "version": "0.14.5",
              "resolved": "https://registry.npmjs.org/tweetnacl/-/tweetnacl-0.14.5.tgz",
              "integrity": "sha1-WuaBd/GS1EViadEIr6k/+HQ/T2Q=",
              "dev": true
            }
          }
        },
        "bignumber.js": {
          "version": "9.0.1",
          "resolved": "https://registry.npmjs.org/bignumber.js/-/bignumber.js-9.0.1.tgz",
          "integrity": "sha512-IdZR9mh6ahOBv/hYGiXyVuyCetmGJhtYkqLBpTStdhEGjegpPlUawydyaF3pbIOFynJTpllEs+NP+CS9jKFLjA==",
          "dev": true,
          "optional": true
        },
        "bip39": {
          "version": "2.5.0",
          "resolved": "https://registry.npmjs.org/bip39/-/bip39-2.5.0.tgz",
          "integrity": "sha512-xwIx/8JKoT2+IPJpFEfXoWdYwP7UVAoUxxLNfGCfVowaJE7yg1Y5B1BVPqlUNsBq5/nGwmFkwRJ8xDW4sX8OdA==",
          "dev": true,
          "requires": {
            "create-hash": "^1.1.0",
            "pbkdf2": "^3.0.9",
            "randombytes": "^2.0.1",
            "safe-buffer": "^5.0.1",
            "unorm": "^1.3.3"
          }
        },
        "blakejs": {
          "version": "1.1.0",
          "resolved": "https://registry.npmjs.org/blakejs/-/blakejs-1.1.0.tgz",
          "integrity": "sha1-ad+S75U6qIylGjLfarHFShVfx6U=",
          "dev": true
        },
        "bluebird": {
          "version": "3.7.2",
          "resolved": "https://registry.npmjs.org/bluebird/-/bluebird-3.7.2.tgz",
          "integrity": "sha512-XpNj6GDQzdfW+r2Wnn7xiSAd7TM3jzkxGXBGTtWKuSXv1xUV+azxAm8jdWZN06QTQk+2N2XB9jRDkvbmQmcRtg==",
          "dev": true,
          "optional": true
        },
        "bn.js": {
          "version": "4.11.9",
          "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-4.11.9.tgz",
          "integrity": "sha512-E6QoYqCKZfgatHTdHzs1RRKP7ip4vvm+EyRUeE2RF0NblwVvb0p6jSVeNTOFxPn26QXN2o6SMfNxKp6kU8zQaw==",
          "dev": true
        },
        "body-parser": {
          "version": "1.19.0",
          "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-1.19.0.tgz",
          "integrity": "sha512-dhEPs72UPbDnAQJ9ZKMNTP6ptJaionhP5cBb541nXPlW60Jepo9RV/a4fX4XWW9CuFNK22krhrj1+rgzifNCsw==",
          "dev": true,
          "optional": true,
          "requires": {
            "bytes": "3.1.0",
            "content-type": "~1.0.4",
            "debug": "2.6.9",
            "depd": "~1.1.2",
            "http-errors": "1.7.2",
            "iconv-lite": "0.4.24",
            "on-finished": "~2.3.0",
            "qs": "6.7.0",
            "raw-body": "2.4.0",
            "type-is": "~1.6.17"
          },
          "dependencies": {
            "debug": {
              "version": "2.6.9",
              "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
              "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
              "dev": true,
              "optional": true,
              "requires": {
                "ms": "2.0.0"
              }
            },
            "ms": {
              "version": "2.0.0",
              "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
              "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
              "dev": true,
              "optional": true
            },
            "qs": {
              "version": "6.7.0",
              "resolved": "https://registry.npmjs.org/qs/-/qs-6.7.0.tgz",
              "integrity": "sha512-VCdBRNFTX1fyE7Nb6FYoURo/SPe62QCaAyzJvUjwRaIsc+NePBEniHlvxFmmX56+HZphIGtV0XeCirBtpDrTyQ==",
              "dev": true,
              "optional": true
            }
          }
        },
        "brace-expansion": {
          "version": "1.1.11",
          "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
          "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
          "dev": true,
          "requires": {
            "balanced-match": "^1.0.0",
            "concat-map": "0.0.1"
          }
        },
        "brorand": {
          "version": "1.1.0",
          "resolved": "https://registry.npmjs.org/brorand/-/brorand-1.1.0.tgz",
          "integrity": "sha1-EsJe/kCkXjwyPrhnWgoM5XsiNx8=",
          "dev": true
        },
        "browserify-aes": {
          "version": "1.2.0",
          "resolved": "https://registry.npmjs.org/browserify-aes/-/browserify-aes-1.2.0.tgz",
          "integrity": "sha512-+7CHXqGuspUn/Sl5aO7Ea0xWGAtETPXNSAjHo48JfLdPWcMng33Xe4znFvQweqc/uzk5zSOI3H52CYnjCfb5hA==",
          "dev": true,
          "requires": {
            "buffer-xor": "^1.0.3",
            "cipher-base": "^1.0.0",
            "create-hash": "^1.1.0",
            "evp_bytestokey": "^1.0.3",
        "browserify-cipher": {
          "version": "1.0.1",
          "resolved": "https://registry.npmjs.org/browserify-cipher/-/browserify-cipher-1.0.1.tgz",
          "integrity": "sha512-sPhkz0ARKbf4rRQt2hTpAHqn47X3llLkUGn+xEJzLjwY8LRs2p0v7ljvI5EyoRO/mexrNunNECisZs+gw2zz1w==",
          "dev": true,
          "optional": true,
          "requires": {
            "browserify-aes": "^1.0.4",
            "browserify-des": "^1.0.0",
            "evp_bytestokey": "^1.0.0"
          }
        },
        "browserify-des": {
          "version": "1.0.2",
          "resolved": "https://registry.npmjs.org/browserify-des/-/browserify-des-1.0.2.tgz",
          "integrity": "sha512-BioO1xf3hFwz4kc6iBhI3ieDFompMhrMlnDFC4/0/vd5MokpuAc3R+LYbwTA9A5Yc9pq9UYPqffKpW2ObuwX5A==",
          "dev": true,
          "optional": true,
          "requires": {
            "cipher-base": "^1.0.1",
            "des.js": "^1.0.0",
            "inherits": "^2.0.1",
            "safe-buffer": "^5.1.2"
          }
        },
        "browserify-rsa": {
          "version": "4.0.1",
          "resolved": "https://registry.npmjs.org/browserify-rsa/-/browserify-rsa-4.0.1.tgz",
          "integrity": "sha1-IeCr+vbyApzy+vsTNWenAdQTVSQ=",
          "dev": true,
          "optional": true,
          "requires": {
            "bn.js": "^4.1.0",
            "randombytes": "^2.0.1"
          }
        },
        "browserify-sign": {
          "version": "4.2.1",
          "resolved": "https://registry.npmjs.org/browserify-sign/-/browserify-sign-4.2.1.tgz",
          "integrity": "sha512-/vrA5fguVAKKAVTNJjgSm1tRQDHUU6DbwO9IROu/0WAzC8PKhucDSh18J0RMvVeHAn5puMd+QHC2erPRNf8lmg==",
          "dev": true,
          "optional": true,
          "requires": {
            "bn.js": "^5.1.1",
            "browserify-rsa": "^4.0.1",
            "create-hash": "^1.2.0",
            "create-hmac": "^1.1.7",
            "elliptic": "^6.5.3",
            "inherits": "^2.0.4",
            "parse-asn1": "^5.1.5",
            "readable-stream": "^3.6.0",
            "safe-buffer": "^5.2.0"
          },
          "dependencies": {
            "bn.js": {
              "version": "5.1.3",
              "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-5.1.3.tgz",
              "integrity": "sha512-GkTiFpjFtUzU9CbMeJ5iazkCzGL3jrhzerzZIuqLABjbwRaFt33I9tUdSNryIptM+RxDet6OKm2WnLXzW51KsQ==",
              "dev": true,
              "optional": true
            },
            "readable-stream": {
              "version": "3.6.0",
              "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.0.tgz",
              "integrity": "sha512-BViHy7LKeTz4oNnkcLJ+lVSL6vpiFeX6/d3oSH8zCW7UxP2onchk+vTGB143xuFjHS3deTgkKoXXymXqymiIdA==",
              "dev": true,
              "optional": true,
              "requires": {
                "inherits": "^2.0.3",
                "string_decoder": "^1.1.1",
                "util-deprecate": "^1.0.1"
              }
            }
          }
        },
        "browserslist": {
          "version": "3.2.8",
          "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-3.2.8.tgz",
          "integrity": "sha512-WHVocJYavUwVgVViC0ORikPHQquXwVh939TaelZ4WDqpWgTX/FsGhl/+P4qBUAGcRvtOgDgC+xftNWWp2RUTAQ==",
          "dev": true,
          "requires": {
            "caniuse-lite": "^1.0.30000844",
            "electron-to-chromium": "^1.3.47"
          }
        },
        "bs58": {
          "version": "4.0.1",
          "resolved": "https://registry.npmjs.org/bs58/-/bs58-4.0.1.tgz",
          "integrity": "sha1-vhYedsNU9veIrkBx9j806MTwpCo=",
          "dev": true,
          "requires": {
            "base-x": "^3.0.2"
          }
        },
        "bs58check": {
          "version": "2.1.2",
          "resolved": "https://registry.npmjs.org/bs58check/-/bs58check-2.1.2.tgz",
          "integrity": "sha512-0TS1jicxdU09dwJMNZtVAfzPi6Q6QeN0pM1Fkzrjn+XYHvzMKPU3pHVpva+769iNVSfIYWf7LJ6WR+BuuMf8cA==",
          "dev": true,
          "requires": {
            "bs58": "^4.0.0",
            "create-hash": "^1.1.0",
            "safe-buffer": "^5.1.2"
          }
        },
        "buffer": {
          "version": "5.6.0",
          "resolved": "https://registry.npmjs.org/buffer/-/buffer-5.6.0.tgz",
          "integrity": "sha512-/gDYp/UtU0eA1ys8bOs9J6a+E/KWIY+DZ+Q2WESNUA0jFRsJOc0SNUO6xJ5SGA1xueg3NL65W6s+NY5l9cunuw==",
          "dev": true,
          "requires": {
            "base64-js": "^1.0.2",
            "ieee754": "^1.1.4"
          }
        },
        "buffer-from": {
          "version": "1.1.1",
          "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.1.tgz",
          "integrity": "sha512-MQcXEUbCKtEo7bhqEs6560Hyd4XaovZlO/k9V3hjVUF/zwW7KBVdSK4gIt/bzwS9MbR5qob+F5jusZsb0YQK2A==",
          "dev": true
        },
        "buffer-to-arraybuffer": {
          "version": "0.0.5",
          "resolved": "https://registry.npmjs.org/buffer-to-arraybuffer/-/buffer-to-arraybuffer-0.0.5.tgz",
          "integrity": "sha1-YGSkD6dutDxyOrqe+PbhIW0QURo=",
          "dev": true,
          "optional": true
        },
        "buffer-xor": {
          "version": "1.0.3",
          "resolved": "https://registry.npmjs.org/buffer-xor/-/buffer-xor-1.0.3.tgz",
          "integrity": "sha1-JuYe0UIvtw3ULm42cp7VHYVf6Nk=",
          "dev": true
        },
        "bufferutil": {
          "version": "4.0.1",
          "resolved": "https://registry.npmjs.org/bufferutil/-/bufferutil-4.0.1.tgz",
          "integrity": "sha512-xowrxvpxojqkagPcWRQVXZl0YXhRhAtBEIq3VoER1NH5Mw1n1o0ojdspp+GS2J//2gCVyrzQDApQ4unGF+QOoA==",
          "dev": true,
          "requires": {
            "node-gyp-build": "~3.7.0"
          },
          "dependencies": {
            "node-gyp-build": {
              "version": "3.7.0",
              "resolved": "https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-3.7.0.tgz",
              "integrity": "sha512-L/Eg02Epx6Si2NXmedx+Okg+4UHqmaf3TNcxd50SF9NQGcJaON3AtU++kax69XV7YWz4tUspqZSAsVofhFKG2w==",
              "dev": true
            }
          }
        },
        "bytes": {
          "version": "3.1.0",
          "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.0.tgz",
          "integrity": "sha512-zauLjrfCG+xvoyaqLoV8bLVXXNGC4JqlxFCutSDWA6fJrTo2ZuvLYTqZ7aHBLZSMOopbzwv8f+wZcVzfVTI2Dg==",
          "dev": true,
          "optional": true
        },
        "bytewise": {
          "version": "1.1.0",
          "resolved": "https://registry.npmjs.org/bytewise/-/bytewise-1.1.0.tgz",
          "integrity": "sha1-HRPL/3F65xWAlKqIGzXQgbOHJT4=",
          "dev": true,
          "requires": {
            "bytewise-core": "^1.2.2",
            "typewise": "^1.0.3"
          }
        },
        "bytewise-core": {
          "version": "1.2.3",
          "resolved": "https://registry.npmjs.org/bytewise-core/-/bytewise-core-1.2.3.tgz",
          "integrity": "sha1-P7QQx+kVWOsasiqCg0V3qmvWHUI=",
          "dev": true,
          "requires": {
            "typewise-core": "^1.2"
          }
        },
        "cache-base": {
          "version": "1.0.1",
          "resolved": "https://registry.npmjs.org/cache-base/-/cache-base-1.0.1.tgz",
          "integrity": "sha512-AKcdTnFSWATd5/GCPRxr2ChwIJ85CeyrEyjRHlKxQ56d4XJMGym0uAiKn0xbLOGOl3+yRpOTi484dVCEc5AUzQ==",
          "dev": true,
          "requires": {
            "collection-visit": "^1.0.0",
            "component-emitter": "^1.2.1",
            "get-value": "^2.0.6",
            "has-value": "^1.0.0",
            "isobject": "^3.0.1",
            "set-value": "^2.0.0",
            "to-object-path": "^0.3.0",
            "union-value": "^1.0.0",
            "unset-value": "^1.0.0"
          }
        },
        "cacheable-request": {
          "version": "6.1.0",
          "resolved": "https://registry.npmjs.org/cacheable-request/-/cacheable-request-6.1.0.tgz",
          "integrity": "sha512-Oj3cAGPCqOZX7Rz64Uny2GYAZNliQSqfbePrgAQ1wKAihYmCUnraBtJtKcGR4xz7wF+LoJC+ssFZvv5BgF9Igg==",
          "dev": true,
          "optional": true,
          "requires": {
            "clone-response": "^1.0.2",
            "get-stream": "^5.1.0",
            "http-cache-semantics": "^4.0.0",
            "keyv": "^3.0.0",
            "lowercase-keys": "^2.0.0",
            "normalize-url": "^4.1.0",
            "responselike": "^1.0.2"
          },
          "dependencies": {
            "lowercase-keys": {
              "version": "2.0.0",
              "resolved": "https://registry.npmjs.org/lowercase-keys/-/lowercase-keys-2.0.0.tgz",
              "integrity": "sha512-tqNXrS78oMOE73NMxK4EMLQsQowWf8jKooH9g7xPavRT706R6bkQJ6DY2Te7QukaZsulxa30wQ7bk0pm4XiHmA==",
              "dev": true,
              "optional": true
            }
          }
        },
        "cachedown": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/cachedown/-/cachedown-1.0.0.tgz",
          "integrity": "sha1-1D8DbkUQaWsxJG19sx6/D3rDLRU=",
          "dev": true,
          "requires": {
            "abstract-leveldown": "^2.4.1",
            "lru-cache": "^3.2.0"
          },
          "dependencies": {
            "abstract-leveldown": {
              "version": "2.7.2",
              "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-2.7.2.tgz",
              "integrity": "sha512-+OVvxH2rHVEhWLdbudP6p0+dNMXu8JA1CbhP19T8paTYAcX7oJ4OVjT+ZUVpv7mITxXHqDMej+GdqXBmXkw09w==",
              "dev": true,
              "requires": {
                "xtend": "~4.0.0"
              }
            },
            "lru-cache": {
              "version": "3.2.0",
              "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-3.2.0.tgz",
              "integrity": "sha1-cXibO39Tmb7IVl3aOKow0qCX7+4=",
              "dev": true,
              "requires": {
                "pseudomap": "^1.0.1"
              }
            }
          }
        },
        "caniuse-lite": {
          "version": "1.0.30001146",
          "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001146.tgz",
          "integrity": "sha512-VAy5RHDfTJhpxnDdp2n40GPPLp3KqNrXz1QqFv4J64HvArKs8nuNMOWkB3ICOaBTU/Aj4rYAo/ytdQDDFF/Pug==",
          "dev": true
        },
        "caseless": {
          "version": "0.12.0",
          "resolved": "https://registry.npmjs.org/caseless/-/caseless-0.12.0.tgz",
          "integrity": "sha1-G2gcIf+EAzyCZUMJBolCDRhxUdw=",
          "dev": true
        },
        "chalk": {
          "version": "2.4.2",
          "resolved": "https://registry.npmjs.org/chalk/-/chalk-2.4.2.tgz",
          "integrity": "sha512-Mti+f9lpJNcwF4tWV8/OrTTtF1gZi+f8FqlyAdouralcFWFQWF2+NgCHShjkCb+IFBLq9buZwE1xckQU4peSuQ==",
          "dev": true,
          "requires": {
            "ansi-styles": "^3.2.1",
            "escape-string-regexp": "^1.0.5",
            "supports-color": "^5.3.0"
          }
        },
        "checkpoint-store": {
          "version": "1.1.0",
          "resolved": "https://registry.npmjs.org/checkpoint-store/-/checkpoint-store-1.1.0.tgz",
          "integrity": "sha1-BOTLUWuRQziTWB5tRgGnjpVS6gY=",
          "dev": true,
          "requires": {
            "functional-red-black-tree": "^1.0.1"
          }
        },
        "chownr": {
          "version": "1.1.4",
          "resolved": "https://registry.npmjs.org/chownr/-/chownr-1.1.4.tgz",
          "integrity": "sha512-jJ0bqzaylmJtVnNgzTeSOs8DPavpbYgEr/b0YL8/2GO3xJEhInFmhKMUnEJQjZumK7KXGFhUy89PrsJWlakBVg==",
          "dev": true,
          "optional": true
        },
        "ci-info": {
          "version": "2.0.0",
          "resolved": "https://registry.npmjs.org/ci-info/-/ci-info-2.0.0.tgz",
          "integrity": "sha512-5tK7EtrZ0N+OLFMthtqOj4fI2Jeb88C4CAZPu25LDVUgXJ0A3Js4PMGqrn0JU1W0Mh1/Z8wZzYPxqUrXeBboCQ==",
          "dev": true
        },
        "cids": {
          "version": "0.7.5",
          "resolved": "https://registry.npmjs.org/cids/-/cids-0.7.5.tgz",
          "integrity": "sha512-zT7mPeghoWAu+ppn8+BS1tQ5qGmbMfB4AregnQjA/qHY3GC1m1ptI9GkWNlgeu38r7CuRdXB47uY2XgAYt6QVA==",
          "dev": true,
          "optional": true,
          "requires": {
            "buffer": "^5.5.0",
            "class-is": "^1.1.0",
            "multibase": "~0.6.0",
            "multicodec": "^1.0.0",
            "multihashes": "~0.4.15"
          },
          "dependencies": {
            "multicodec": {
              "version": "1.0.4",
              "resolved": "https://registry.npmjs.org/multicodec/-/multicodec-1.0.4.tgz",
              "integrity": "sha512-NDd7FeS3QamVtbgfvu5h7fd1IlbaC4EQ0/pgU4zqE2vdHCmBGsUa0TiM8/TdSeG6BMPC92OOCf8F1ocE/Wkrrg==",
              "dev": true,
              "optional": true,
              "requires": {
                "buffer": "^5.6.0",
                "varint": "^5.0.0"
              }
            }
          }
        },
        "cipher-base": {
          "version": "1.0.4",
          "resolved": "https://registry.npmjs.org/cipher-base/-/cipher-base-1.0.4.tgz",
          "integrity": "sha512-Kkht5ye6ZGmwv40uUDZztayT2ThLQGfnj/T71N/XzeZeo3nf8foyW7zGTsPYkEya3m5f3cAypH+qe7YOrM1U2Q==",
          "dev": true,
          "requires": {
            "inherits": "^2.0.1",
            "safe-buffer": "^5.0.1"
          }
        },
        "class-is": {
          "version": "1.1.0",
          "resolved": "https://registry.npmjs.org/class-is/-/class-is-1.1.0.tgz",
          "integrity": "sha512-rhjH9AG1fvabIDoGRVH587413LPjTZgmDF9fOFCbFJQV4yuocX1mHxxvXI4g3cGwbVY9wAYIoKlg1N79frJKQw==",
          "dev": true,
          "optional": true
        },
        "class-utils": {
          "version": "0.3.6",
          "resolved": "https://registry.npmjs.org/class-utils/-/class-utils-0.3.6.tgz",
          "integrity": "sha512-qOhPa/Fj7s6TY8H8esGu5QNpMMQxz79h+urzrNYN6mn+9BnxlDGf5QZ+XeCDsxSjPqsSR56XOZOJmpeurnLMeg==",
          "dev": true,
          "requires": {
            "arr-union": "^3.1.0",
            "define-property": "^0.2.5",
            "isobject": "^3.0.0",
            "static-extend": "^0.1.1"
          },
          "dependencies": {
            "define-property": {
              "version": "0.2.5",
              "resolved": "https://registry.npmjs.org/define-property/-/define-property-0.2.5.tgz",
              "integrity": "sha1-w1se+RjsPJkPmlvFe+BKrOxcgRY=",
              "dev": true,
              "requires": {
                "is-descriptor": "^0.1.0"
              }
            },
            "is-accessor-descriptor": {
              "version": "0.1.6",
              "resolved": "https://registry.npmjs.org/is-accessor-descriptor/-/is-accessor-descriptor-0.1.6.tgz",
              "integrity": "sha1-qeEss66Nh2cn7u84Q/igiXtcmNY=",
              "dev": true,
              "requires": {
                "kind-of": "^3.0.2"
              },
              "dependencies": {
                "kind-of": {
                  "version": "3.2.2",
                  "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-3.2.2.tgz",
                  "integrity": "sha1-MeohpzS6ubuw8yRm2JOupR5KPGQ=",
                  "dev": true,
                  "requires": {
                    "is-buffer": "^1.1.5"
                  }
                }
              }
            },
            "is-buffer": {
              "version": "1.1.6",
              "resolved": "https://registry.npmjs.org/is-buffer/-/is-buffer-1.1.6.tgz",
              "integrity": "sha512-NcdALwpXkTm5Zvvbk7owOUSvVvBKDgKP5/ewfXEznmQFfs4ZRmanOeKBTjRVjka3QFoN6XJ+9F3USqfHqTaU5w==",
              "dev": true
            },
            "is-data-descriptor": {
              "version": "0.1.4",
              "resolved": "https://registry.npmjs.org/is-data-descriptor/-/is-data-descriptor-0.1.4.tgz",
              "integrity": "sha1-C17mSDiOLIYCgueT8YVv7D8wG1Y=",
              "dev": true,
              "requires": {
                "kind-of": "^3.0.2"
              },
              "dependencies": {
                "kind-of": {
                  "version": "3.2.2",
                  "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-3.2.2.tgz",
                  "integrity": "sha1-MeohpzS6ubuw8yRm2JOupR5KPGQ=",
                  "dev": true,
                  "requires": {
                    "is-buffer": "^1.1.5"
                  }
                }
              }
            },
            "is-descriptor": {
              "version": "0.1.6",
              "resolved": "https://registry.npmjs.org/is-descriptor/-/is-descriptor-0.1.6.tgz",
              "integrity": "sha512-avDYr0SB3DwO9zsMov0gKCESFYqCnE4hq/4z3TdUlukEy5t9C0YRq7HLrsN52NAcqXKaepeCD0n+B0arnVG3Hg==",
              "dev": true,
              "requires": {
                "is-accessor-descriptor": "^0.1.6",
                "is-data-descriptor": "^0.1.4",
                "kind-of": "^5.0.0"
              }
            },
            "kind-of": {
              "version": "5.1.0",
              "resolved": "https://registry.npmjs.org/kind-of/-/kind-of-5.1.0.tgz",
              "integrity": "sha512-NGEErnH6F2vUuXDh+OlbcKW7/wOcfdRHaZ7VWtqCztfHri/++YKmP51OdWeGPuqCOba6kk2OTe5d02VmTB80Pw==",
              "dev": true
            }
          }
        },
        "clone": {
          "version": "2.1.2",
          "resolved": "https://registry.npmjs.org/clone/-/clone-2.1.2.tgz",
          "integrity": "sha1-G39Ln1kfHo+DZwQBYANFoCiHQ18=",
          "dev": true
        },
        "clone-response": {
          "version": "1.0.2",
          "resolved": "https://registry.npmjs.org/clone-response/-/clone-response-1.0.2.tgz",
          "integrity": "sha1-0dyXOSAxTfZ/vrlCI7TuNQI56Ws=",
          "dev": true,
          "optional": true,
          "requires": {
            "mimic-response": "^1.0.0"
          }
        },
        "collection-visit": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/collection-visit/-/collection-visit-1.0.0.tgz",
          "integrity": "sha1-S8A3PBZLwykbTTaMgpzxqApZ3KA=",
          "dev": true,
          "requires": {
            "map-visit": "^1.0.0",
            "object-visit": "^1.0.0"
          }
        },
        "color-convert": {
          "version": "1.9.3",
          "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-1.9.3.tgz",
          "integrity": "sha512-QfAUtd+vFdAtFQcC8CCyYt1fYWxSqAiK2cSD6zDB8N3cpsEBAvRxp9zOGg6G/SHHJYAT88/az/IuDGALsNVbGg==",
          "dev": true,
          "requires": {
            "color-name": "1.1.3"
          }
        },
        "color-name": {
          "version": "1.1.3",
          "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.3.tgz",
          "integrity": "sha1-p9BVi9icQveV3UIyj3QIMcpTvCU=",
          "dev": true
        },
        "combined-stream": {
          "version": "1.0.8",
          "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
          "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
          "dev": true,
          "requires": {
            "delayed-stream": "~1.0.0"
          }
        },
        "component-emitter": {
          "version": "1.3.0",
          "resolved": "https://registry.npmjs.org/component-emitter/-/component-emitter-1.3.0.tgz",
          "integrity": "sha512-Rd3se6QB+sO1TwqZjscQrurpEPIfO0/yYnSin6Q/rD3mOutHvUrCAhJub3r90uNb+SESBuE0QYoB90YdfatsRg==",
          "dev": true
        },
        "concat-map": {
          "version": "0.0.1",
          "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
          "integrity": "sha1-2Klr13/Wjfd5OnMDajug1UBdR3s=",
          "dev": true
        },
        "concat-stream": {
          "version": "1.6.2",
          "resolved": "https://registry.npmjs.org/concat-stream/-/concat-stream-1.6.2.tgz",
          "integrity": "sha512-27HBghJxjiZtIk3Ycvn/4kbJk/1uZuJFfuPEns6LaEvpvG1f0hTea8lilrouyo9mVc2GWdcEZ8OLoGmSADlrCw==",
          "dev": true,
          "requires": {
            "buffer-from": "^1.0.0",
            "inherits": "^2.0.3",
            "readable-stream": "^2.2.2",
            "typedarray": "^0.0.6"
          }
        },
        "content-disposition": {
          "version": "0.5.3",
          "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-0.5.3.tgz",
          "integrity": "sha512-ExO0774ikEObIAEV9kDo50o+79VCUdEB6n6lzKgGwupcVeRlhrj3qGAfwq8G6uBJjkqLrhT0qEYFcWng8z1z0g==",
          "dev": true,
          "optional": true,
          "requires": {
            "safe-buffer": "5.1.2"
          },
          "dependencies": {
            "safe-buffer": {
              "version": "5.1.2",
              "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
              "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
              "dev": true,
              "optional": true
            }
          }
        },
        "content-hash": {
          "version": "2.5.2",
          "resolved": "https://registry.npmjs.org/content-hash/-/content-hash-2.5.2.tgz",
          "integrity": "sha512-FvIQKy0S1JaWV10sMsA7TRx8bpU+pqPkhbsfvOJAdjRXvYxEckAwQWGwtRjiaJfh+E0DvcWUGqcdjwMGFjsSdw==",
          "dev": true,
          "optional": true,
          "requires": {
            "cids": "^0.7.1",
            "multicodec": "^0.5.5",
            "multihashes": "^0.4.15"
          }
        },
        "content-type": {
          "version": "1.0.4",
          "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.4.tgz",
          "integrity": "sha512-hIP3EEPs8tB9AT1L+NUqtwOAps4mk2Zob89MWXMHjHWg9milF/j4osnnQLXBCBFBk/tvIG/tUc9mOUJiPBhPXA==",
          "dev": true,
          "optional": true
        },
        "convert-source-map": {
          "version": "1.7.0",
          "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-1.7.0.tgz",
          "integrity": "sha512-4FJkXzKXEDB1snCFZlLP4gpC3JILicCpGbzG9f9G7tGqGCzETQ2hWPrcinA9oU4wtf2biUaEH5065UnMeR33oA==",
          "dev": true,
          "requires": {
            "safe-buffer": "~5.1.1"
          },
          "dependencies": {
            "safe-buffer": {
              "version": "5.1.2",
              "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
              "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
              "dev": true
            }
          }
        },
        "cookie": {
          "version": "0.4.0",
          "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.4.0.tgz",
          "integrity": "sha512-+Hp8fLp57wnUSt0tY0tHEXh4voZRDnoIrZPqlo3DPiI4y9lwg/jqx+1Om94/W6ZaPDOUbnjOt/99w66zk+l1Xg==",
          "dev": true,
          "optional": true
        },
        "cookie-signature": {
          "version": "1.0.6",
          "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.0.6.tgz",
          "integrity": "sha1-4wOogrNCzD7oylE6eZmXNNqzriw=",
          "dev": true,
          "optional": true
        },
        "cookiejar": {
          "version": "2.1.2",
          "resolved": "https://registry.npmjs.org/cookiejar/-/cookiejar-2.1.2.tgz",
          "integrity": "sha512-Mw+adcfzPxcPeI+0WlvRrr/3lGVO0bD75SxX6811cxSh1Wbxx7xZBGK1eVtDf6si8rg2lhnUjsVLMFMfbRIuwA==",
          "dev": true,
          "optional": true
        },
        "copy-descriptor": {
          "version": "0.1.1",
          "resolved": "https://registry.npmjs.org/copy-descriptor/-/copy-descriptor-0.1.1.tgz",
          "integrity": "sha1-Z29us8OZl8LuGsOpJP1hJHSPV40=",
          "dev": true
        },
        "core-js": {
          "version": "2.6.11",
          "resolved": "https://registry.npmjs.org/core-js/-/core-js-2.6.11.tgz",
          "integrity": "sha512-5wjnpaT/3dV+XB4borEsnAYQchn00XSgTAWKDkEqv+K8KevjbzmofK6hfJ9TZIlpj2N0xQpazy7PiRQiWHqzWg==",
          "dev": true
        },
        "core-js-pure": {
          "version": "3.6.5",
          "resolved": "https://registry.npmjs.org/core-js-pure/-/core-js-pure-3.6.5.tgz",
          "integrity": "sha512-lacdXOimsiD0QyNf9BC/mxivNJ/ybBGJXQFKzRekp1WTHoVUWsUHEn+2T8GJAzzIhyOuXA+gOxCVN3l+5PLPUA==",
          "dev": true
        },
        "core-util-is": {
          "version": "1.0.2",
          "resolved": "https://registry.npmjs.org/core-util-is/-/core-util-is-1.0.2.tgz",
          "integrity": "sha1-tf1UIgqivFq1eqtxQMlAdUUDwac=",
          "dev": true
        },
        "cors": {
          "version": "2.8.5",
          "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.5.tgz",
          "integrity": "sha512-KIHbLJqu73RGr/hnbrO9uBeixNGuvSQjul/jdFvS/KFSIH1hWVd1ng7zOHx+YrEfInLG7q4n6GHQ9cDtxv/P6g==",
          "dev": true,
          "optional": true,
          "requires": {
            "object-assign": "^4",
            "vary": "^1"
          }
        },
        "create-ecdh": {
          "version": "4.0.4",
          "resolved": "https://registry.npmjs.org/create-ecdh/-/create-ecdh-4.0.4.tgz",
          "integrity": "sha512-mf+TCx8wWc9VpuxfP2ht0iSISLZnt0JgWlrOKZiNqyUZWnjIaCIVNQArMHnCZKfEYRg6IM7A+NeJoN8gf/Ws0A==",
          "dev": true,
          "optional": true,
          "requires": {
            "bn.js": "^4.1.0",
            "elliptic": "^6.5.3"
          }
        },
        "create-hash": {
          "version": "1.2.0",
          "resolved": "https://registry.npmjs.org/create-hash/-/create-hash-1.2.0.tgz",
          "integrity": "sha512-z00bCGNHDG8mHAkP7CtT1qVu+bFQUPjYq/4Iv3C3kWjTFV10zIjfSoeqXo9Asws8gwSHDGj/hl2u4OGIjapeCg==",
          "dev": true,
          "requires": {
            "cipher-base": "^1.0.1",
            "inherits": "^2.0.1",
            "md5.js": "^1.3.4",
            "ripemd160": "^2.0.1",
            "sha.js": "^2.4.0"
          }
        },
        "create-hmac": {
          "version": "1.1.7",
          "resolved": "https://registry.npmjs.org/create-hmac/-/create-hmac-1.1.7.tgz",
          "integrity": "sha512-MJG9liiZ+ogc4TzUwuvbER1JRdgvUFSB5+VR/g5h82fGaIRWMWddtKBHi7/sVhfjQZ6SehlyhvQYrcYkaUIpLg==",
          "dev": true,
          "requires": {
            "cipher-base": "^1.0.3",
            "create-hash": "^1.1.0",
            "inherits": "^2.0.1",
            "ripemd160": "^2.0.0",
            "safe-buffer": "^5.0.1",
            "sha.js": "^2.4.8"
          }
        },
        "cross-fetch": {
          "version": "2.2.3",
          "resolved": "https://registry.npmjs.org/cross-fetch/-/cross-fetch-2.2.3.tgz",
          "integrity": "sha512-PrWWNH3yL2NYIb/7WF/5vFG3DCQiXDOVf8k3ijatbrtnwNuhMWLC7YF7uqf53tbTFDzHIUD8oITw4Bxt8ST3Nw==",
          "dev": true,
          "requires": {
            "node-fetch": "2.1.2",
            "whatwg-fetch": "2.0.4"
          }
        },
        "crypto-browserify": {
          "version": "3.12.0",
          "resolved": "https://registry.npmjs.org/crypto-browserify/-/crypto-browserify-3.12.0.tgz",
          "integrity": "sha512-fz4spIh+znjO2VjL+IdhEpRJ3YN6sMzITSBijk6FK2UvTqruSQW+/cCZTSNsMiZNvUeq0CqurF+dAbyiGOY6Wg==",
          "dev": true,
          "optional": true,
          "requires": {
            "browserify-cipher": "^1.0.0",
            "browserify-sign": "^4.0.0",
            "create-ecdh": "^4.0.0",
            "create-hash": "^1.1.0",
            "create-hmac": "^1.1.0",
            "diffie-hellman": "^5.0.0",
            "inherits": "^2.0.1",
            "pbkdf2": "^3.0.3",
            "public-encrypt": "^4.0.0",
            "randombytes": "^2.0.0",
            "randomfill": "^1.0.3"
          }
        },
        "d": {
          "version": "1.0.1",
          "resolved": "https://registry.npmjs.org/d/-/d-1.0.1.tgz",
          "integrity": "sha512-m62ShEObQ39CfralilEQRjH6oAMtNCV1xJyEx5LpRYUVN+EviphDgUc/F3hnYbADmkiNs67Y+3ylmlG7Lnu+FA==",
          "dev": true,
          "requires": {
            "es5-ext": "^0.10.50",
            "type": "^1.0.1"
          }
        },
        "dashdash": {
          "version": "1.14.1",
          "resolved": "https://registry.npmjs.org/dashdash/-/dashdash-1.14.1.tgz",
          "integrity": "sha1-hTz6D3y+L+1d4gMmuN1YEDX24vA=",
          "dev": true,
          "requires": {
            "assert-plus": "^1.0.0"
          }
        },
        "debug": {
          "version": "3.2.6",
          "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.6.tgz",
          "integrity": "sha512-mel+jf7nrtEl5Pn1Qx46zARXKDpBbvzezse7p7LqINmdoIk8PYP5SySaxEmYv6TZ0JyEKA1hsCId6DIhgITtWQ==",
          "dev": true,
          "requires": {
            "ms": "^2.1.1"
          }
        },
        "decode-uri-component": {
          "version": "0.2.0",
          "resolved": "https://registry.npmjs.org/decode-uri-component/-/decode-uri-component-0.2.0.tgz",
          "integrity": "sha1-6zkTMzRYd1y4TNGh+uBiEGu4dUU=",
          "dev": true
        },
        "decompress-response": {
          "version": "3.3.0",
          "resolved": "https://registry.npmjs.org/decompress-response/-/decompress-response-3.3.0.tgz",
          "integrity": "sha1-gKTdMjdIOEv6JICDYirt7Jgq3/M=",
          "dev": true,
          "optional": true,
          "requires": {
            "mimic-response": "^1.0.0"
          }
        },
        "deep-equal": {
          "version": "1.1.1",
          "resolved": "https://registry.npmjs.org/deep-equal/-/deep-equal-1.1.1.tgz",
          "integrity": "sha512-yd9c5AdiqVcR+JjcwUQb9DkhJc8ngNr0MahEBGvDiJw8puWab2yZlh+nkasOnZP+EGTAP6rRp2JzJhJZzvNF8g==",
          "dev": true,
          "requires": {
            "is-arguments": "^1.0.4",
            "is-date-object": "^1.0.1",
            "is-regex": "^1.0.4",
            "object-is": "^1.0.1",
            "object-keys": "^1.1.1",
            "regexp.prototype.flags": "^1.2.0"
          }
        },
        "defer-to-connect": {
          "version": "1.1.3",
          "resolved": "https://registry.npmjs.org/defer-to-connect/-/defer-to-connect-1.1.3.tgz",
          "integrity": "sha512-0ISdNousHvZT2EiFlZeZAHBUvSxmKswVCEf8hW7KWgG4a8MVEu/3Vb6uWYozkjylyCxe0JBIiRB1jV45S70WVQ==",
          "dev": true,
          "optional": true
        },
        "deferred-leveldown": {
          "version": "4.0.2",
          "resolved": "https://registry.npmjs.org/deferred-leveldown/-/deferred-leveldown-4.0.2.tgz",
          "integrity": "sha512-5fMC8ek8alH16QiV0lTCis610D1Zt1+LA4MS4d63JgS32lrCjTFDUFz2ao09/j2I4Bqb5jL4FZYwu7Jz0XO1ww==",
          "dev": true,
          "requires": {
            "abstract-leveldown": "~5.0.0",
            "inherits": "^2.0.3"
          },
          "dependencies": {
            "abstract-leveldown": {
              "version": "5.0.0",
              "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-5.0.0.tgz",
              "integrity": "sha512-5mU5P1gXtsMIXg65/rsYGsi93+MlogXZ9FA8JnwKurHQg64bfXwGYVdVdijNTVNOlAsuIiOwHdvFFD5JqCJQ7A==",
              "dev": true,
              "requires": {
                "xtend": "~4.0.0"
              }
            }
          }
        },
        "define-properties": {
          "version": "1.1.3",
          "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.1.3.tgz",
          "integrity": "sha512-3MqfYKj2lLzdMSf8ZIZE/V+Zuy+BgD6f164e8K2w7dgnpKArBDerGYpM46IYYcjnkdPNMjPk9A6VFB8+3SKlXQ==",
          "dev": true,
          "requires": {
            "object-keys": "^1.0.12"
          }
        },
        "define-property": {
          "version": "2.0.2",
          "resolved": "https://registry.npmjs.org/define-property/-/define-property-2.0.2.tgz",
          "integrity": "sha512-jwK2UV4cnPpbcG7+VRARKTZPUWowwXA8bzH5NP6ud0oeAxyYPuGZUAC7hMugpCdz4BeSZl2Dl9k66CHJ/46ZYQ==",
          "dev": true,
          "requires": {
            "is-descriptor": "^1.0.2",
            "isobject": "^3.0.1"
          }
        },
        "defined": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/defined/-/defined-1.0.0.tgz",
          "integrity": "sha1-yY2bzvdWdBiOEQlpFRGZ45sfppM=",
          "dev": true
        },
        "delayed-stream": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
          "integrity": "sha1-3zrhmayt+31ECqrgsp4icrJOxhk=",
          "dev": true
        },
        "depd": {
          "version": "1.1.2",
          "resolved": "https://registry.npmjs.org/depd/-/depd-1.1.2.tgz",
          "integrity": "sha1-m81S4UwJd2PnSbJ0xDRu0uVgtak=",
          "dev": true,
          "optional": true
        },
        "des.js": {
          "version": "1.0.1",
          "resolved": "https://registry.npmjs.org/des.js/-/des.js-1.0.1.tgz",
          "integrity": "sha512-Q0I4pfFrv2VPd34/vfLrFOoRmlYj3OV50i7fskps1jZWK1kApMWWT9G6RRUeYedLcBDIhnSDaUvJMb3AhUlaEA==",
          "dev": true,
          "optional": true,
          "requires": {
            "inherits": "^2.0.1",
            "minimalistic-assert": "^1.0.0"
          }
        },
        "destroy": {
          "version": "1.0.4",
          "resolved": "https://registry.npmjs.org/destroy/-/destroy-1.0.4.tgz",
          "integrity": "sha1-l4hXRCxEdJ5CBmE+N5RiBYJqvYA=",
          "dev": true,
          "optional": true
        },
        "detect-indent": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/detect-indent/-/detect-indent-4.0.0.tgz",
          "integrity": "sha1-920GQ1LN9Docts5hnE7jqUdd4gg=",
          "dev": true,
          "requires": {
            "repeating": "^2.0.0"
          }
        },
        "diffie-hellman": {
          "version": "5.0.3",
          "resolved": "https://registry.npmjs.org/diffie-hellman/-/diffie-hellman-5.0.3.tgz",
          "integrity": "sha512-kqag/Nl+f3GwyK25fhUMYj81BUOrZ9IuJsjIcDE5icNM9FJHAVm3VcUDxdLPoQtTuUylWm6ZIknYJwwaPxsUzg==",
          "dev": true,
          "optional": true,
          "requires": {
            "bn.js": "^4.1.0",
            "miller-rabin": "^4.0.0",
            "randombytes": "^2.0.0"
          }
        },
        "dom-walk": {
          "version": "0.1.2",
          "resolved": "https://registry.npmjs.org/dom-walk/-/dom-walk-0.1.2.tgz",
          "integrity": "sha512-6QvTW9mrGeIegrFXdtQi9pk7O/nSK6lSdXW2eqUspN5LWD7UTji2Fqw5V2YLjBpHEoU9Xl/eUWNpDeZvoyOv2w==",
          "dev": true
        },
        "dotignore": {
          "version": "0.1.2",
          "resolved": "https://registry.npmjs.org/dotignore/-/dotignore-0.1.2.tgz",
          "integrity": "sha512-UGGGWfSauusaVJC+8fgV+NVvBXkCTmVv7sk6nojDZZvuOUNGUy0Zk4UpHQD6EDjS0jpBwcACvH4eofvyzBcRDw==",
          "dev": true,
          "requires": {
            "minimatch": "^3.0.4"
          }
        },
        "duplexer3": {
          "version": "0.1.4",
          "resolved": "https://registry.npmjs.org/duplexer3/-/duplexer3-0.1.4.tgz",
          "integrity": "sha1-7gHdHKwO08vH/b6jfcCo8c4ALOI=",
          "dev": true,
          "optional": true
        },
        "ecc-jsbn": {
          "version": "0.1.2",
          "resolved": "https://registry.npmjs.org/ecc-jsbn/-/ecc-jsbn-0.1.2.tgz",
          "integrity": "sha1-OoOpBOVDUyh4dMVkt1SThoSamMk=",
          "dev": true,
          "requires": {
            "jsbn": "~0.1.0",
            "safer-buffer": "^2.1.0"
          }
        },
        "ee-first": {
          "version": "1.1.1",
          "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
          "integrity": "sha1-WQxhFWsK4vTwJVcyoViyZrxWsh0=",
          "dev": true,
          "optional": true
        },
        "electron-to-chromium": {
          "version": "1.3.578",
          "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.3.578.tgz",
          "integrity": "sha512-z4gU6dA1CbBJsAErW5swTGAaU2TBzc2mPAonJb00zqW1rOraDo2zfBMDRvaz9cVic+0JEZiYbHWPw/fTaZlG2Q==",
          "dev": true
        },
        "elliptic": {
          "version": "6.5.3",
          "resolved": "https://registry.npmjs.org/elliptic/-/elliptic-6.5.3.tgz",
          "integrity": "sha512-IMqzv5wNQf+E6aHeIqATs0tOLeOTwj1QKbRcS3jBbYkl5oLAserA8yJTT7/VyHUYG91PRmPyeQDObKLPpeS4dw==",
          "dev": true,
          "requires": {
            "bn.js": "^4.4.0",
            "brorand": "^1.0.1",
            "hash.js": "^1.0.0",
            "hmac-drbg": "^1.0.0",
            "inherits": "^2.0.1",
            "minimalistic-assert": "^1.0.0",
            "minimalistic-crypto-utils": "^1.0.0"
          }
        },
        "encodeurl": {
          "version": "1.0.2",
          "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-1.0.2.tgz",
          "integrity": "sha1-rT/0yG7C0CkyL1oCw6mmBslbP1k=",
          "dev": true,
          "optional": true
        },
        "encoding": {
          "version": "0.1.13",
          "resolved": "https://registry.npmjs.org/encoding/-/encoding-0.1.13.tgz",
          "integrity": "sha512-ETBauow1T35Y/WZMkio9jiM0Z5xjHHmJ4XmjZOq1l/dXz3lr2sRn87nJy20RupqSh1F2m3HHPSp8ShIPQJrJ3A==",
          "dev": true,
          "requires": {
            "iconv-lite": "^0.6.2"
          },
          "dependencies": {
            "iconv-lite": {
              "version": "0.6.2",
              "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.2.tgz",
              "integrity": "sha512-2y91h5OpQlolefMPmUlivelittSWy0rP+oYVpn6A7GwVHNE8AWzoYOBNmlwks3LobaJxgHCYZAnyNo2GgpNRNQ==",
              "dev": true,
              "requires": {
                "safer-buffer": ">= 2.1.2 < 3.0.0"
              }
            }
          }
        },
        "encoding-down": {
          "version": "5.0.4",
          "resolved": "https://registry.npmjs.org/encoding-down/-/encoding-down-5.0.4.tgz",
          "integrity": "sha512-8CIZLDcSKxgzT+zX8ZVfgNbu8Md2wq/iqa1Y7zyVR18QBEAc0Nmzuvj/N5ykSKpfGzjM8qxbaFntLPwnVoUhZw==",
          "dev": true,
          "requires": {
            "abstract-leveldown": "^5.0.0",
            "inherits": "^2.0.3",
            "level-codec": "^9.0.0",
            "level-errors": "^2.0.0",
            "xtend": "^4.0.1"
          },
          "dependencies": {
            "abstract-leveldown": {
              "version": "5.0.0",
              "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-5.0.0.tgz",
              "integrity": "sha512-5mU5P1gXtsMIXg65/rsYGsi93+MlogXZ9FA8JnwKurHQg64bfXwGYVdVdijNTVNOlAsuIiOwHdvFFD5JqCJQ7A==",
              "dev": true,
              "requires": {
                "xtend": "~4.0.0"
              }
            }
          }
        },
        "end-of-stream": {
          "version": "1.4.4",
          "resolved": "https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.4.tgz",
          "integrity": "sha512-+uw1inIHVPQoaVuHzRyXd21icM+cnt4CzD5rW+NC1wjOUSTOs+Te7FOv7AhN7vS9x/oIyhLP5PR1H+phQAHu5Q==",
          "dev": true,
          "requires": {
            "once": "^1.4.0"
          }
        },
        "errno": {
          "version": "0.1.7",
          "resolved": "https://registry.npmjs.org/errno/-/errno-0.1.7.tgz",
          "integrity": "sha512-MfrRBDWzIWifgq6tJj60gkAwtLNb6sQPlcFrSOflcP1aFmmruKQ2wRnze/8V6kgyz7H3FF8Npzv78mZ7XLLflg==",
          "dev": true,
          "requires": {
            "prr": "~1.0.1"
          }
        },
        "es-abstract": {
          "version": "1.17.7",
          "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.17.7.tgz",
          "integrity": "sha512-VBl/gnfcJ7OercKA9MVaegWsBHFjV492syMudcnQZvt/Dw8ezpcOHYZXa/J96O8vx+g4x65YKhxOwDUh63aS5g==",
          "dev": true,
          "requires": {
            "es-to-primitive": "^1.2.1",
            "function-bind": "^1.1.1",
            "has": "^1.0.3",
            "has-symbols": "^1.0.1",
            "is-callable": "^1.2.2",
            "is-regex": "^1.1.1",
            "object-inspect": "^1.8.0",
            "object-keys": "^1.1.1",
            "object.assign": "^4.1.1",
            "string.prototype.trimend": "^1.0.1",
            "string.prototype.trimstart": "^1.0.1"
          }
        },
        "es-to-primitive": {
          "version": "1.2.1",
          "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.2.1.tgz",
          "integrity": "sha512-QCOllgZJtaUo9miYBcLChTUaHNjJF3PYs1VidD7AwiEj1kYxKeQTctLAezAOH5ZKRH0g2IgPn6KwB4IT8iRpvA==",
          "dev": true,
          "requires": {
            "is-callable": "^1.1.4",
            "is-date-object": "^1.0.1",
            "is-symbol": "^1.0.2"
          }
        },
        "es5-ext": {
          "version": "0.10.53",
          "resolved": "https://registry.npmjs.org/es5-ext/-/es5-ext-0.10.53.tgz",
          "integrity": "sha512-Xs2Stw6NiNHWypzRTY1MtaG/uJlwCk8kH81920ma8mvN8Xq1gsfhZvpkImLQArw8AHnv8MT2I45J3c0R8slE+Q==",
          "dev": true,
          "requires": {
            "es6-iterator": "~2.0.3",
            "es6-symbol": "~3.1.3",
            "next-tick": "~1.0.0"
          }
        },
        "es6-iterator": {
          "version": "2.0.3",
          "resolved": "https://registry.npmjs.org/es6-iterator/-/es6-iterator-2.0.3.tgz",
          "integrity": "sha1-p96IkUGgWpSwhUQDstCg+/qY87c=",
          "dev": true,
          "requires": {
            "d": "1",
            "es5-ext": "^0.10.35",
            "es6-symbol": "^3.1.1"
          }
        },
        "es6-symbol": {
          "version": "3.1.3",
          "resolved": "https://registry.npmjs.org/es6-symbol/-/es6-symbol-3.1.3.tgz",
          "integrity": "sha512-NJ6Yn3FuDinBaBRWl/q5X/s4koRHBrgKAu+yGI6JCBeiu3qrcbJhwT2GeR/EXVfylRk8dpQVJoLEFhK+Mu31NA==",
          "dev": true,
          "requires": {
            "d": "^1.0.1",
            "ext": "^1.1.2"
          }
        },
        "escape-html": {
          "version": "1.0.3",
          "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
          "integrity": "sha1-Aljq5NPQwJdN4cFpGI7wBR0dGYg=",
          "dev": true,
          "optional": true
        },
        "escape-string-regexp": {
          "version": "1.0.5",
          "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
          "integrity": "sha1-G2HAViGQqN/2rjuyzwIAyhMLhtQ=",
          "dev": true
        },
        "esutils": {
          "version": "2.0.3",
          "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
          "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
          "dev": true
        },
        "etag": {
          "version": "1.8.1",
          "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
          "integrity": "sha1-Qa4u62XvpiJorr/qg6x9eSmbCIc=",
          "dev": true,
          "optional": true
        },
        "eth-block-tracker": {
          "version": "3.0.1",
          "resolved": "https://registry.npmjs.org/eth-block-tracker/-/eth-block-tracker-3.0.1.tgz",
          "integrity": "sha512-WUVxWLuhMmsfenfZvFO5sbl1qFY2IqUlw/FPVmjjdElpqLsZtSG+wPe9Dz7W/sB6e80HgFKknOmKk2eNlznHug==",
          "dev": true,
          "requires": {
            "eth-query": "^2.1.0",
            "ethereumjs-tx": "^1.3.3",
            "ethereumjs-util": "^5.1.3",
            "ethjs-util": "^0.1.3",
            "json-rpc-engine": "^3.6.0",
            "pify": "^2.3.0",
            "tape": "^4.6.3"
          },
          "dependencies": {
            "ethereumjs-tx": {
              "version": "1.3.7",
              "resolved": "https://registry.npmjs.org/ethereumjs-tx/-/ethereumjs-tx-1.3.7.tgz",
              "integrity": "sha512-wvLMxzt1RPhAQ9Yi3/HKZTn0FZYpnsmQdbKYfUUpi4j1SEIcbkd9tndVjcPrufY3V7j2IebOpC00Zp2P/Ay2kA==",
              "dev": true,
              "requires": {
                "ethereum-common": "^0.0.18",
                "ethereumjs-util": "^5.0.0"
              }
            },
            "ethereumjs-util": {
              "version": "5.2.1",
              "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
              "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
              "dev": true,
              "requires": {
                "bn.js": "^4.11.0",
                "create-hash": "^1.1.2",
                "elliptic": "^6.5.2",
                "ethereum-cryptography": "^0.1.3",
                "ethjs-util": "^0.1.3",
                "rlp": "^2.0.0",
                "safe-buffer": "^5.1.1"
              }
            },
            "pify": {
              "version": "2.3.0",
              "resolved": "https://registry.npmjs.org/pify/-/pify-2.3.0.tgz",
              "integrity": "sha1-7RQaasBDqEnqWISY59yosVMw6Qw=",
              "dev": true
            }
          }
        },
        "eth-ens-namehash": {
          "version": "2.0.8",
          "resolved": "https://registry.npmjs.org/eth-ens-namehash/-/eth-ens-namehash-2.0.8.tgz",
          "integrity": "sha1-IprEbsqG1S4MmR58sq74P/D2i88=",
          "dev": true,
          "optional": true,
          "requires": {
            "idna-uts46-hx": "^2.3.1",
            "js-sha3": "^0.5.7"
          }
        },
        "eth-json-rpc-infura": {
          "version": "3.2.1",
          "resolved": "https://registry.npmjs.org/eth-json-rpc-infura/-/eth-json-rpc-infura-3.2.1.tgz",
          "integrity": "sha512-W7zR4DZvyTn23Bxc0EWsq4XGDdD63+XPUCEhV2zQvQGavDVC4ZpFDK4k99qN7bd7/fjj37+rxmuBOBeIqCA5Mw==",
          "dev": true,
          "requires": {
            "cross-fetch": "^2.1.1",
            "eth-json-rpc-middleware": "^1.5.0",
            "json-rpc-engine": "^3.4.0",
            "json-rpc-error": "^2.0.0"
          }
        },
        "eth-json-rpc-middleware": {
          "version": "1.6.0",
          "resolved": "https://registry.npmjs.org/eth-json-rpc-middleware/-/eth-json-rpc-middleware-1.6.0.tgz",
          "integrity": "sha512-tDVCTlrUvdqHKqivYMjtFZsdD7TtpNLBCfKAcOpaVs7orBMS/A8HWro6dIzNtTZIR05FAbJ3bioFOnZpuCew9Q==",
          "dev": true,
          "requires": {
            "async": "^2.5.0",
            "eth-query": "^2.1.2",
            "eth-tx-summary": "^3.1.2",
            "ethereumjs-block": "^1.6.0",
            "ethereumjs-tx": "^1.3.3",
            "ethereumjs-util": "^5.1.2",
            "ethereumjs-vm": "^2.1.0",
            "fetch-ponyfill": "^4.0.0",
            "json-rpc-engine": "^3.6.0",
            "json-rpc-error": "^2.0.0",
            "json-stable-stringify": "^1.0.1",
            "promise-to-callback": "^1.0.0",
            "tape": "^4.6.3"
          },
          "dependencies": {
            "abstract-leveldown": {
              "version": "2.6.3",
              "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-2.6.3.tgz",
              "integrity": "sha512-2++wDf/DYqkPR3o5tbfdhF96EfMApo1GpPfzOsR/ZYXdkSmELlvOOEAl9iKkRsktMPHdGjO4rtkBpf2I7TiTeA==",
              "dev": true,
              "requires": {
                "xtend": "~4.0.0"
              }
            },
            "deferred-leveldown": {
              "version": "1.2.2",
              "resolved": "https://registry.npmjs.org/deferred-leveldown/-/deferred-leveldown-1.2.2.tgz",
              "integrity": "sha512-uukrWD2bguRtXilKt6cAWKyoXrTSMo5m7crUdLfWQmu8kIm88w3QZoUL+6nhpfKVmhHANER6Re3sKoNoZ3IKMA==",
              "dev": true,
              "requires": {
                "abstract-leveldown": "~2.6.0"
              }
            },
            "ethereumjs-account": {
              "version": "2.0.5",
              "resolved": "https://registry.npmjs.org/ethereumjs-account/-/ethereumjs-account-2.0.5.tgz",
              "integrity": "sha512-bgDojnXGjhMwo6eXQC0bY6UK2liSFUSMwwylOmQvZbSl/D7NXQ3+vrGO46ZeOgjGfxXmgIeVNDIiHw7fNZM4VA==",
              "dev": true,
              "requires": {
                "ethereumjs-util": "^5.0.0",
                "rlp": "^2.0.0",
                "safe-buffer": "^5.1.1"
              }
            },
            "ethereumjs-block": {
              "version": "1.7.1",
              "resolved": "https://registry.npmjs.org/ethereumjs-block/-/ethereumjs-block-1.7.1.tgz",
              "integrity": "sha512-B+sSdtqm78fmKkBq78/QLKJbu/4Ts4P2KFISdgcuZUPDm9x+N7qgBPIIFUGbaakQh8bzuquiRVbdmvPKqbILRg==",
              "dev": true,
              "requires": {
                "async": "^2.0.1",
                "ethereum-common": "0.2.0",
                "ethereumjs-tx": "^1.2.2",
                "ethereumjs-util": "^5.0.0",
                "merkle-patricia-tree": "^2.1.2"
              },
              "dependencies": {
                "ethereum-common": {
                  "version": "0.2.0",
                  "resolved": "https://registry.npmjs.org/ethereum-common/-/ethereum-common-0.2.0.tgz",
                  "integrity": "sha512-XOnAR/3rntJgbCdGhqdaLIxDLWKLmsZOGhHdBKadEr6gEnJLH52k93Ou+TUdFaPN3hJc3isBZBal3U/XZ15abA==",
                  "dev": true
                }
              }
            },
            "ethereumjs-tx": {
              "version": "1.3.7",
              "resolved": "https://registry.npmjs.org/ethereumjs-tx/-/ethereumjs-tx-1.3.7.tgz",
              "integrity": "sha512-wvLMxzt1RPhAQ9Yi3/HKZTn0FZYpnsmQdbKYfUUpi4j1SEIcbkd9tndVjcPrufY3V7j2IebOpC00Zp2P/Ay2kA==",
              "dev": true,
              "requires": {
                "ethereum-common": "^0.0.18",
                "ethereumjs-util": "^5.0.0"
              }
            },
            "ethereumjs-util": {
              "version": "5.2.1",
              "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
              "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
              "dev": true,
              "requires": {
                "bn.js": "^4.11.0",
                "create-hash": "^1.1.2",
                "elliptic": "^6.5.2",
                "ethereum-cryptography": "^0.1.3",
                "ethjs-util": "^0.1.3",
                "rlp": "^2.0.0",
                "safe-buffer": "^5.1.1"
              }
            },
            "ethereumjs-vm": {
              "version": "2.6.0",
              "resolved": "https://registry.npmjs.org/ethereumjs-vm/-/ethereumjs-vm-2.6.0.tgz",
              "integrity": "sha512-r/XIUik/ynGbxS3y+mvGnbOKnuLo40V5Mj1J25+HEO63aWYREIqvWeRO/hnROlMBE5WoniQmPmhiaN0ctiHaXw==",
              "dev": true,
              "requires": {
                "async": "^2.1.2",
                "async-eventemitter": "^0.2.2",
                "ethereumjs-account": "^2.0.3",
                "ethereumjs-block": "~2.2.0",
                "ethereumjs-common": "^1.1.0",
                "ethereumjs-util": "^6.0.0",
                "fake-merkle-patricia-tree": "^1.0.1",
                "functional-red-black-tree": "^1.0.1",
                "merkle-patricia-tree": "^2.3.2",
                "rustbn.js": "~0.2.0",
                "safe-buffer": "^5.1.1"
              },
              "dependencies": {
                "ethereumjs-block": {
                  "version": "2.2.2",
                  "resolved": "https://registry.npmjs.org/ethereumjs-block/-/ethereumjs-block-2.2.2.tgz",
                  "integrity": "sha512-2p49ifhek3h2zeg/+da6XpdFR3GlqY3BIEiqxGF8j9aSRIgkb7M1Ky+yULBKJOu8PAZxfhsYA+HxUk2aCQp3vg==",
                  "dev": true,
                  "requires": {
                    "async": "^2.0.1",
                    "ethereumjs-common": "^1.5.0",
                    "ethereumjs-tx": "^2.1.1",
                    "ethereumjs-util": "^5.0.0",
                    "merkle-patricia-tree": "^2.1.2"
                  },
                  "dependencies": {
                    "ethereumjs-util": {
                      "version": "5.2.1",
                      "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
                      "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
                      "dev": true,
                      "requires": {
                        "bn.js": "^4.11.0",
                        "create-hash": "^1.1.2",
                        "elliptic": "^6.5.2",
                        "ethereum-cryptography": "^0.1.3",
                        "ethjs-util": "^0.1.3",
                        "rlp": "^2.0.0",
                        "safe-buffer": "^5.1.1"
                      }
                    }
                  }
                },
                "ethereumjs-tx": {
                  "version": "2.1.2",
                  "resolved": "https://registry.npmjs.org/ethereumjs-tx/-/ethereumjs-tx-2.1.2.tgz",
                  "integrity": "sha512-zZEK1onCeiORb0wyCXUvg94Ve5It/K6GD1K+26KfFKodiBiS6d9lfCXlUKGBBdQ+bv7Day+JK0tj1K+BeNFRAw==",
                  "dev": true,
                  "requires": {
                    "ethereumjs-common": "^1.5.0",
                    "ethereumjs-util": "^6.0.0"
                  }
                },
                "ethereumjs-util": {
                  "version": "6.2.1",
                  "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-6.2.1.tgz",
                  "integrity": "sha512-W2Ktez4L01Vexijrm5EB6w7dg4n/TgpoYU4avuT5T3Vmnw/eCRtiBrJfQYS/DCSvDIOLn2k57GcHdeBcgVxAqw==",
                  "dev": true,
                  "requires": {
                    "@types/bn.js": "^4.11.3",
                    "bn.js": "^4.11.0",
                    "create-hash": "^1.1.2",
                    "elliptic": "^6.5.2",
                    "ethereum-cryptography": "^0.1.3",
                    "ethjs-util": "0.1.6",
                    "rlp": "^2.2.3"
                  }
                }
              }
            },
            "isarray": {
              "version": "0.0.1",
              "resolved": "https://registry.npmjs.org/isarray/-/isarray-0.0.1.tgz",
              "integrity": "sha1-ihis/Kmo9Bd+Cav8YDiTmwXR7t8=",
              "dev": true
            },
            "level-codec": {
              "version": "7.0.1",
              "resolved": "https://registry.npmjs.org/level-codec/-/level-codec-7.0.1.tgz",
              "integrity": "sha512-Ua/R9B9r3RasXdRmOtd+t9TCOEIIlts+TN/7XTT2unhDaL6sJn83S3rUyljbr6lVtw49N3/yA0HHjpV6Kzb2aQ==",
              "dev": true
            },
            "level-errors": {
              "version": "1.0.5",
              "resolved": "https://registry.npmjs.org/level-errors/-/level-errors-1.0.5.tgz",
              "integrity": "sha512-/cLUpQduF6bNrWuAC4pwtUKA5t669pCsCi2XbmojG2tFeOr9j6ShtdDCtFFQO1DRt+EVZhx9gPzP9G2bUaG4ig==",
              "dev": true,
              "requires": {
                "errno": "~0.1.1"
              }
            },
            "level-iterator-stream": {
              "version": "1.3.1",
              "resolved": "https://registry.npmjs.org/level-iterator-stream/-/level-iterator-stream-1.3.1.tgz",
              "integrity": "sha1-5Dt4sagUPm+pek9IXrjqUwNS8u0=",
              "dev": true,
              "requires": {
                "inherits": "^2.0.1",
                "level-errors": "^1.0.3",
                "readable-stream": "^1.0.33",
                "xtend": "^4.0.0"
              },
              "dependencies": {
                "readable-stream": {
                  "version": "1.1.14",
                  "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-1.1.14.tgz",
                  "integrity": "sha1-fPTFTvZI44EwhMY23SB54WbAgdk=",
                  "dev": true,
                  "requires": {
                    "core-util-is": "~1.0.0",
                    "inherits": "~2.0.1",
                    "isarray": "0.0.1",
                    "string_decoder": "~0.10.x"
                  }
                }
              }
            },
            "level-ws": {
              "version": "0.0.0",
              "resolved": "https://registry.npmjs.org/level-ws/-/level-ws-0.0.0.tgz",
              "integrity": "sha1-Ny5RIXeSSgBCSwtDrvK7QkltIos=",
              "dev": true,
              "requires": {
                "readable-stream": "~1.0.15",
                "xtend": "~2.1.1"
              },
              "dependencies": {
                "readable-stream": {
                  "version": "1.0.34",
                  "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-1.0.34.tgz",
                  "integrity": "sha1-Elgg40vIQtLyqq+v5MKRbuMsFXw=",
                  "dev": true,
                  "requires": {
                    "core-util-is": "~1.0.0",
                    "inherits": "~2.0.1",
                    "isarray": "0.0.1",
                    "string_decoder": "~0.10.x"
                  }
                },
                "xtend": {
                  "version": "2.1.2",
                  "resolved": "https://registry.npmjs.org/xtend/-/xtend-2.1.2.tgz",
                  "integrity": "sha1-bv7MKk2tjmlixJAbM3znuoe10os=",
                  "dev": true,
                  "requires": {
                    "object-keys": "~0.4.0"
                  }
                }
              }
            },
            "levelup": {
              "version": "1.3.9",
              "resolved": "https://registry.npmjs.org/levelup/-/levelup-1.3.9.tgz",
              "integrity": "sha512-VVGHfKIlmw8w1XqpGOAGwq6sZm2WwWLmlDcULkKWQXEA5EopA8OBNJ2Ck2v6bdk8HeEZSbCSEgzXadyQFm76sQ==",
              "dev": true,
              "requires": {
                "deferred-leveldown": "~1.2.1",
                "level-codec": "~7.0.0",
                "level-errors": "~1.0.3",
                "level-iterator-stream": "~1.3.0",
                "prr": "~1.0.1",
                "semver": "~5.4.1",
                "xtend": "~4.0.0"
              }
            },
            "ltgt": {
              "version": "2.2.1",
              "resolved": "https://registry.npmjs.org/ltgt/-/ltgt-2.2.1.tgz",
              "integrity": "sha1-81ypHEk/e3PaDgdJUwTxezH4fuU=",
              "dev": true
            },
            "memdown": {
              "version": "1.4.1",
              "resolved": "https://registry.npmjs.org/memdown/-/memdown-1.4.1.tgz",
              "integrity": "sha1-tOThkhdGZP+65BNhqlAPMRnv4hU=",
              "dev": true,
              "requires": {
                "abstract-leveldown": "~2.7.1",
                "functional-red-black-tree": "^1.0.1",
                "immediate": "^3.2.3",
                "inherits": "~2.0.1",
                "ltgt": "~2.2.0",
                "safe-buffer": "~5.1.1"
              },
              "dependencies": {
                "abstract-leveldown": {
                  "version": "2.7.2",
                  "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-2.7.2.tgz",
                  "integrity": "sha512-+OVvxH2rHVEhWLdbudP6p0+dNMXu8JA1CbhP19T8paTYAcX7oJ4OVjT+ZUVpv7mITxXHqDMej+GdqXBmXkw09w==",
                  "dev": true,
                  "requires": {
                    "xtend": "~4.0.0"
                  }
                }
              }
            },
            "merkle-patricia-tree": {
              "version": "2.3.2",
              "resolved": "https://registry.npmjs.org/merkle-patricia-tree/-/merkle-patricia-tree-2.3.2.tgz",
              "integrity": "sha512-81PW5m8oz/pz3GvsAwbauj7Y00rqm81Tzad77tHBwU7pIAtN+TJnMSOJhxBKflSVYhptMMb9RskhqHqrSm1V+g==",
              "dev": true,
              "requires": {
                "async": "^1.4.2",
                "ethereumjs-util": "^5.0.0",
                "level-ws": "0.0.0",
                "levelup": "^1.2.1",
                "memdown": "^1.0.0",
                "readable-stream": "^2.0.0",
                "rlp": "^2.0.0",
                "semaphore": ">=1.0.1"
              },
              "dependencies": {
                "async": {
                  "version": "1.5.2",
                  "resolved": "https://registry.npmjs.org/async/-/async-1.5.2.tgz",
                  "integrity": "sha1-7GphrlZIDAw8skHJVhjiCJL5Zyo=",
                  "dev": true
                }
              }
            },
            "object-keys": {
              "version": "0.4.0",
              "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-0.4.0.tgz",
              "integrity": "sha1-KKaq50KN0sOpLz2V8hM13SBOAzY=",
              "dev": true
            },
            "safe-buffer": {
              "version": "5.1.2",
              "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
              "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
              "dev": true
            },
            "semver": {
              "version": "5.4.1",
              "resolved": "https://registry.npmjs.org/semver/-/semver-5.4.1.tgz",
              "integrity": "sha512-WfG/X9+oATh81XtllIo/I8gOiY9EXRdv1cQdyykeXK17YcUW3EXUAi2To4pcH6nZtJPr7ZOpM5OMyWJZm+8Rsg==",
              "dev": true
            },
            "string_decoder": {
              "version": "0.10.31",
              "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-0.10.31.tgz",
              "integrity": "sha1-YuIDvEF2bGwoyfyEMB2rHFMQ+pQ=",
              "dev": true
            }
          }
        },
        "eth-lib": {
          "version": "0.1.29",
          "resolved": "https://registry.npmjs.org/eth-lib/-/eth-lib-0.1.29.tgz",
          "integrity": "sha512-bfttrr3/7gG4E02HoWTDUcDDslN003OlOoBxk9virpAZQ1ja/jDgwkWB8QfJF7ojuEowrqy+lzp9VcJG7/k5bQ==",
          "dev": true,
          "optional": true,
          "requires": {
            "bn.js": "^4.11.6",
            "elliptic": "^6.4.0",
            "nano-json-stream-parser": "^0.1.2",
            "servify": "^0.1.12",
            "ws": "^3.0.0",
            "xhr-request-promise": "^0.1.2"
          }
        },
        "eth-query": {
          "version": "2.1.2",
          "resolved": "https://registry.npmjs.org/eth-query/-/eth-query-2.1.2.tgz",
          "integrity": "sha1-1nQdkAAQa1FRDHLbktY2VFam2l4=",
          "dev": true,
          "requires": {
            "json-rpc-random-id": "^1.0.0",
            "xtend": "^4.0.1"
                "bn.js": "^4.10.0",
                "ethereumjs-util": "^4.3.0"
              },
              "dependencies": {
                "ethereumjs-util": {
                  "version": "4.5.1",
                  "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-4.5.1.tgz",
                  "integrity": "sha512-WrckOZ7uBnei4+AKimpuF1B3Fv25OmoRgmYCpGsP7u8PFxXAmAgiJSYT2kRWnt6fVIlKaQlZvuwXp7PIrmn3/w==",
                  "dev": true,
                  "requires": {
                    "bn.js": "^4.8.0",
                    "create-hash": "^1.1.2",
                    "elliptic": "^6.5.2",
                    "ethereum-cryptography": "^0.1.3",
                    "rlp": "^2.0.0"
                  }
                }
              }
            },
            "ethereumjs-util": {
              "version": "5.2.1",
              "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
              "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
              "dev": true,
              "requires": {
                "bn.js": "^4.11.0",
                "create-hash": "^1.1.2",
                "elliptic": "^6.5.2",
                "ethereum-cryptography": "^0.1.3",
                "ethjs-util": "^0.1.3",
                "rlp": "^2.0.0",
                "safe-buffer": "^5.1.1"
              }
            }
          }
        },
        "eth-tx-summary": {
          "version": "3.2.4",
          "resolved": "https://registry.npmjs.org/eth-tx-summary/-/eth-tx-summary-3.2.4.tgz",
          "integrity": "sha512-NtlDnaVZah146Rm8HMRUNMgIwG/ED4jiqk0TME9zFheMl1jOp6jL1m0NKGjJwehXQ6ZKCPr16MTr+qspKpEXNg==",
          "dev": true,
          "requires": {
            "async": "^2.1.2",
            "clone": "^2.0.0",
            "concat-stream": "^1.5.1",
            "end-of-stream": "^1.1.0",
            "eth-query": "^2.0.2",
            "ethereumjs-block": "^1.4.1",
            "ethereumjs-tx": "^1.1.1",
            "ethereumjs-util": "^5.0.1",
            "ethereumjs-vm": "^2.6.0",
            "through2": "^2.0.3"
          },
          "dependencies": {
            "abstract-leveldown": {
              "version": "2.6.3",
              "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-2.6.3.tgz",
              "integrity": "sha512-2++wDf/DYqkPR3o5tbfdhF96EfMApo1GpPfzOsR/ZYXdkSmELlvOOEAl9iKkRsktMPHdGjO4rtkBpf2I7TiTeA==",
              "dev": true,
              "requires": {
                "xtend": "~4.0.0"
              }
            },
            "deferred-leveldown": {
              "version": "1.2.2",
              "resolved": "https://registry.npmjs.org/deferred-leveldown/-/deferred-leveldown-1.2.2.tgz",
              "integrity": "sha512-uukrWD2bguRtXilKt6cAWKyoXrTSMo5m7crUdLfWQmu8kIm88w3QZoUL+6nhpfKVmhHANER6Re3sKoNoZ3IKMA==",
              "dev": true,
              "requires": {
                "abstract-leveldown": "~2.6.0"
              }
            },
            "ethereumjs-account": {
              "version": "2.0.5",
              "resolved": "https://registry.npmjs.org/ethereumjs-account/-/ethereumjs-account-2.0.5.tgz",
              "integrity": "sha512-bgDojnXGjhMwo6eXQC0bY6UK2liSFUSMwwylOmQvZbSl/D7NXQ3+vrGO46ZeOgjGfxXmgIeVNDIiHw7fNZM4VA==",
              "dev": true,
              "requires": {
                "ethereumjs-util": "^5.0.0",
                "rlp": "^2.0.0",
                "safe-buffer": "^5.1.1"
              }
            },
            "ethereumjs-block": {
              "version": "1.7.1",
              "resolved": "https://registry.npmjs.org/ethereumjs-block/-/ethereumjs-block-1.7.1.tgz",
              "integrity": "sha512-B+sSdtqm78fmKkBq78/QLKJbu/4Ts4P2KFISdgcuZUPDm9x+N7qgBPIIFUGbaakQh8bzuquiRVbdmvPKqbILRg==",
              "dev": true,
              "requires": {
                "async": "^2.0.1",
                "ethereum-common": "0.2.0",
                "ethereumjs-tx": "^1.2.2",
                "ethereumjs-util": "^5.0.0",
                "merkle-patricia-tree": "^2.1.2"
              },
              "dependencies": {
                "ethereum-common": {
                  "version": "0.2.0",
                  "resolved": "https://registry.npmjs.org/ethereum-common/-/ethereum-common-0.2.0.tgz",
                  "integrity": "sha512-XOnAR/3rntJgbCdGhqdaLIxDLWKLmsZOGhHdBKadEr6gEnJLH52k93Ou+TUdFaPN3hJc3isBZBal3U/XZ15abA==",
                  "dev": true
                }
              }
            },
            "ethereumjs-tx": {
              "version": "1.3.7",
              "resolved": "https://registry.npmjs.org/ethereumjs-tx/-/ethereumjs-tx-1.3.7.tgz",
              "integrity": "sha512-wvLMxzt1RPhAQ9Yi3/HKZTn0FZYpnsmQdbKYfUUpi4j1SEIcbkd9tndVjcPrufY3V7j2IebOpC00Zp2P/Ay2kA==",
              "dev": true,
              "requires": {
                "ethereum-common": "^0.0.18",
                "ethereumjs-util": "^5.0.0"
              }
            },
            "ethereumjs-util": {
              "version": "5.2.1",
              "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
              "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
              "dev": true,
              "requires": {
                "bn.js": "^4.11.0",
                "create-hash": "^1.1.2",
                "elliptic": "^6.5.2",
                "ethereum-cryptography": "^0.1.3",
                "ethjs-util": "^0.1.3",
                "rlp": "^2.0.0",
                "safe-buffer": "^5.1.1"
              }
            },
            "ethereumjs-vm": {
              "version": "2.6.0",
              "resolved": "https://registry.npmjs.org/ethereumjs-vm/-/ethereumjs-vm-2.6.0.tgz",
              "integrity": "sha512-r/XIUik/ynGbxS3y+mvGnbOKnuLo40V5Mj1J25+HEO63aWYREIqvWeRO/hnROlMBE5WoniQmPmhiaN0ctiHaXw==",
              "dev": true,
              "requires": {
                "async": "^2.1.2",
                "async-eventemitter": "^0.2.2",
                "ethereumjs-account": "^2.0.3",
                "ethereumjs-block": "~2.2.0",
                "ethereumjs-common": "^1.1.0",
                "ethereumjs-util": "^6.0.0",
                "fake-merkle-patricia-tree": "^1.0.1",
                "functional-red-black-tree": "^1.0.1",
                "merkle-patricia-tree": "^2.3.2",
                "rustbn.js": "~0.2.0",
                "safe-buffer": "^5.1.1"
              },
              "dependencies": {
                "ethereumjs-block": {
                  "version": "2.2.2",
                  "resolved": "https://registry.npmjs.org/ethereumjs-block/-/ethereumjs-block-2.2.2.tgz",
                  "integrity": "sha512-2p49ifhek3h2zeg/+da6XpdFR3GlqY3BIEiqxGF8j9aSRIgkb7M1Ky+yULBKJOu8PAZxfhsYA+HxUk2aCQp3vg==",
                  "dev": true,
                  "requires": {
                    "async": "^2.0.1",
                    "ethereumjs-common": "^1.5.0",
                    "ethereumjs-tx": "^2.1.1",
                    "ethereumjs-util": "^5.0.0",
                    "merkle-patricia-tree": "^2.1.2"
                  },
                  "dependencies": {
                    "ethereumjs-util": {
                      "version": "5.2.1",
                      "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-5.2.1.tgz",
                      "integrity": "sha512-v3kT+7zdyCm1HIqWlLNrHGqHGLpGYIhjeHxQjnDXjLT2FyGJDsd3LWMYUo7pAFRrk86CR3nUJfhC81CCoJNNGQ==",
                      "dev": true,
                      "requires": {
                        "bn.js": "^4.11.0",
                        "create-hash": "^1.1.2",
                        "elliptic": "^6.5.2",
                        "ethereum-cryptography": "^0.1.3",
                        "ethjs-util": "^0.1.3",
                        "rlp": "^2.0.0",
                        "safe-buffer": "^5.1.1"
                      }
                    }
                  }
                },
                "ethereumjs-tx": {
                  "version": "2.1.2",
                  "resolved": "https://registry.npmjs.org/ethereumjs-tx/-/ethereumjs-tx-2.1.2.tgz",
                  "integrity": "sha512-zZEK1onCeiORb0wyCXUvg94Ve5It/K6GD1K+26KfFKodiBiS6d9lfCXlUKGBBdQ+bv7Day+JK0tj1K+BeNFRAw==",
                  "dev": true,
                  "requires": {
                    "ethereumjs-common": "^1.5.0",
                    "ethereumjs-util": "^6.0.0"
                  }
                },
                "ethereumjs-util": {
                  "version": "6.2.1",
                  "resolved": "https://registry.npmjs.org/ethereumjs-util/-/ethereumjs-util-6.2.1.tgz",
                  "integrity": "sha512-W2Ktez4L01Vexijrm5EB6w7dg4n/TgpoYU4avuT5T3Vmnw/eCRtiBrJfQYS/DCSvDIOLn2k57GcHdeBcgVxAqw==",
                  "dev": true,
                  "requires": {
                    "@types/bn.js": "^4.11.3",
                    "bn.js": "^4.11.0",
                    "create-hash": "^1.1.2",
                    "elliptic": "^6.5.2",
                    "ethereum-cryptography": "^0.1.3",
                    "ethjs-util": "0.1.6",
                    "rlp": "^2.2.3"
                  }
                }
              }
            },
            "isarray": {
              "version": "0.0.1",
              "resolved": "https://registry.npmjs.org/isarray/-/isarray-0.0.1.tgz",
              "integrity": "sha1-ihis/Kmo9Bd+Cav8YDiTmwXR7t8=",
              "dev": true
            },
            "level-codec": {
              "version": "7.0.1",
              "resolved": "https://registry.npmjs.org/level-codec/-/level-codec-7.0.1.tgz",
              "integrity": "sha512-Ua/R9B9r3RasXdRmOtd+t9TCOEIIlts+TN/7XTT2unhDaL6sJn83S3rUyljbr6lVtw49N3/yA0HHjpV6Kzb2aQ==",
              "dev": true
            },
            "level-errors": {
              "version": "1.0.5",
              "resolved": "https://registry.npmjs.org/level-errors/-/level-errors-1.0.5.tgz",
              "integrity": "sha512-/cLUpQduF6bNrWuAC4pwtUKA5t669pCsCi2XbmojG2tFeOr9j6ShtdDCtFFQO1DRt+EVZhx9gPzP9G2bUaG4ig==",
              "dev": true,
              "requires": {
                "errno": "~0.1.1"
              }
            },
            "level-iterator-stream": {
              "version": "1.3.1",
              "resolved": "https://registry.npmjs.org/level-iterator-stream/-/level-iterator-stream-1.3.1.tgz",
              "integrity": "sha1-5Dt4sagUPm+pek9IXrjqUwNS8u0=",
              "dev": true,
              "requires": {
                "inherits": "^2.0.1",
                "level-errors": "^1.0.3",
                "readable-stream": "^1.0.33",
                "xtend": "^4.0.0"
              },
              "dependencies": {
                "readable-stream": {
                  "version": "1.1.14",
                  "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-1.1.14.tgz",
                  "integrity": "sha1-fPTFTvZI44EwhMY23SB54WbAgdk=",
                  "dev": true,
                  "requires": {
                    "core-util-is": "~1.0.0",
                    "inherits": "~2.0.1",
                    "isarray": "0.0.1",
                    "string_decoder": "~0.10.x"
                  }
                }
              }
            },
            "level-ws": {
              "version": "0.0.0",
              "resolved": "https://registry.npmjs.org/level-ws/-/level-ws-0.0.0.tgz",
              "integrity": "sha1-Ny5RIXeSSgBCSwtDrvK7QkltIos=",
              "dev": true,
              "requires": {
                "readable-stream": "~1.0.15",
                "xtend": "~2.1.1"
              },
              "dependencies": {
                "readable-stream": {
                  "version": "1.0.34",
                  "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-1.0.34.tgz",
                  "integrity": "sha1-Elgg40vIQtLyqq+v5MKRbuMsFXw=",
                  "dev": true,
                  "requires": {
                    "core-util-is": "~1.0.0",
                    "inherits": "~2.0.1",
                    "isarray": "0.0.1",
                    "string_decoder": "~0.10.x"
                  }
                },
                "xtend": {
                  "version": "2.1.2",
                  "resolved": "https://registry.npmjs.org/xtend/-/xtend-2.1.2.tgz",
                  "integrity": "sha1-bv7MKk2tjmlixJAbM3znuoe10os=",
                  "dev": true,
                  "requires": {
                    "object-keys": "~0.4.0"
                  }
                }
              }
            },
            "levelup": {
              "version": "1.3.9",
              "resolved": "https://registry.npmjs.org/levelup/-/levelup-1.3.9.tgz",
              "integrity": "sha512-VVGHfKIlmw8w1XqpGOAGwq6sZm2WwWLmlDcULkKWQXEA5EopA8OBNJ2Ck2v6bdk8HeEZSbCSEgzXadyQFm76sQ==",
              "dev": true,
              "requires": {
                "deferred-leveldown": "~1.2.1",
                "level-codec": "~7.0.0",
                "level-errors": "~1.0.3",
                "level-iterator-stream": "~1.3.0",
                "prr": "~1.0.1",
                "semver": "~5.4.1",
                "xtend": "~4.0.0"
              }
            },
            "ltgt": {
              "version": "2.2.1",
              "resolved": "https://registry.npmjs.org/ltgt/-/ltgt-2.2.1.tgz",
              "integrity": "sha1-81ypHEk/e3PaDgdJUwTxezH4fuU=",
              "dev": true
            },
            "memdown": {
              "version": "1.4.1",
              "resolved": "https://registry.npmjs.org/memdown/-/memdown-1.4.1.tgz",
              "integrity": "sha1-tOThkhdGZP+65BNhqlAPMRnv4hU=",
              "dev": true,
              "requires": {
                "abstract-leveldown": "~2.7.1",
                "functional-red-black-tree": "^1.0.1",
                "immediate": "^3.2.3",
                "inherits": "~2.0.1",
                "ltgt": "~2.2.0",
                "safe-buffer": "~5.1.1"
              },
              "dependencies": {
                "abstract-leveldown": {
                  "version": "2.7.2",
                  "resolved": "https://registry.npmjs.org/abstract-leveldown/-/abstract-leveldown-2.7.2.tgz",
                  "integrity": "sha512-+OVvxH2rHVEhWLdbudP6p0+dNMXu8JA1CbhP19T8paTYAcX7oJ4OVjT+ZUVpv7mITxXHqDMej+GdqXBmXkw09w==",
                  "dev": true,
                  "requires": {
                    "xtend": "~4.0.0"
            "merkle-patricia-tree": {
              "version": "2.3.2",
              "resolved": "https://registry.npmjs.org/merkle-patricia-tree/-/merkle-patricia-tree-2.3.2.tgz",
              "integrity": "sha512-81PW5m8oz/pz3GvsAwbauj7Y00rqm81Tzad77tHBwU7pIAtN+TJnMSOJhxBKflSVYhptMMb9RskhqHqrSm1V+g==",
              "dev": true,
              "requires": {
                "async": "^1.4.2",
                "ethereumjs-util": "^5.0.0",
                "level-ws": "0.0.0",
                "levelup": "^1.2.1",
                "memdown": "^1.0.0",
                "readable-stream": "^2.0.0",
                "rlp": "^2.0.0",
                "semaphore": ">=1.0.1"
              },
              "dependencies": {
                "async": {
                  "version": "1.5.2",
                  "resolved": "https://registry.npmjs.org/async/-/async-1.5.2.tgz",
                  "integrity": "sha1-7GphrlZIDAw8skHJVhjiCJL5Zyo=",
                  "dev": true
                }
              }
            },
            "object-keys": {
              "version": "0.4.0",
              "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-0.4.0.tgz",
              "integrity": "sha1-KKaq50KN0sOpLz2V8hM13SBOAzY=",
              "dev": true
            },
            "safe-buffer": {
              "version": "5.1.2",
              "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
              "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
              "dev": true
            },
            "semver": {
              "version": "5.4.1",
              "resolved": "https://registry.npmjs.org/semver/-/semver-5.4.1.tgz",
              "integrity": "sha512-WfG/X9+oATh81XtllIo/I8gOiY9EXRdv1cQdyykeXK17YcUW3EXUAi2To4pcH6nZtJPr7ZOpM5OMyWJZm+8Rsg==",
              "dev": true
            },
            "string_decoder": {
              "version": "0.10.31",
              "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-0.10.31.tgz",
              "integrity": "sha1-YuIDvEF2bGwoyfyEMB2rHFMQ+pQ=",
              "dev": true
        "ethereum-common": {
          "version": "0.0.18",
          "resolved": "https://registry.npmjs.org/ethereum-common/-/ethereum-common-0.0.18.tgz",
          "integrity": "sha1-L9w1dvIykDNYl26znaeDIT/5Uj8=",
          "dev": true
        },
        "ethereumjs-abi": {
          "version": "0.6.8",
          "resolved": "https://registry.npmjs.org/ethereumjs-abi/-/ethereumjs-abi-0.6.8.tgz",
          "integrity": "sha512-Tx0r/iXI6r+lRsdvkFDlut0N08jWMnKRZ6Gkq+Nmw75lZe4e6o3EkSnkaBP5NF6+m5PTGAr9JP43N3LyeoglsA==",
          "dev": true,
          "requires": {
            "bn.js": "^4.11.8",
            "ethereumjs-util": "^6.0.0"
          }
        },
        "events": {
          "version": "3.2.0",
          "resolved": "https://registry.npmjs.org/events/-/events-3.2.0.tgz",
          "integrity": "sha512-/46HWwbfCX2xTawVfkKLGxMifJYQBWMwY1mjywRtb4c9x8l5NP3KoJtnIOiL1hfdRkIuYhETxQlo62IF8tcnlg==",
          "dev": true
        },
