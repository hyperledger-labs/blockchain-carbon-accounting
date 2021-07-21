# Ledger Integration Application

Ledger Integration uses Cactus project to interact with various ledger using in blockchain carbon accounting project. Currently HL fabric and ethereum ledger are being used. One chaincode named `EmissionsChaincode` is installed on fabric and Two smart contract named `NetEmissionsTokenNetwork` & `DAOToken` are installed on ethereum.

## Project Structure

- [src](./src)
    - [blockchain-gateway](./src/blockchain-gateway) : for interacting with various contracts/chaincode install on different ledgers
        - [fabricRegistry.ts](./src/blockchain-gateway/fabricRegistry.ts) : uses cactus-fabric-connector to enroll and register client with fabric-ca
        - [utilityEmissionsChannel.ts](./src/blockchain-gateway/utilityEmissionsChannel.ts) : uses cactus-fabric-connector to invoke utilityEmissionsChannel chaincode
        - [netEmissionsTokenNetwork.ts](./src/blockchain-gateway/netEmissionsTokenNetwork.ts) : uses cactus-xdai-connector to send/call to NetEmissionTokenNetwork contract
        - [I-*] : Defines input/output interface from/to a ledger 
    - [config](./src/config) : ts files responsible for reading configurations and environnement variable for the application
    - [contracts](./src/contracts) : contains complied solidity contracts
    - [routers](./src/routers) : defines express router and register different endpoints
        - [carbonAccounting.ts](./src/routers/carbonAccounting.ts) : endpoints for interacting both ethereum and fabric
        - [fabricRegistry.ts](./src/routers/fabricRegistry.ts) : endpoints for registering and enrolling user with fabric-ca
        - [utilityEmissionsChannel.ts](./src/routers/utilityEmissionsChannel.ts) : endpoints for interacting with utilityEmissionsChannel chaincode installed on fabric
- [app.ts](./app.ts) : main TS file running a express server
- [.env](.env) : contains value of development environment variables
- [config.json](./config.json) : fabric network configuration , pointing to connection proof of different organizations.

## Local Development

### Configure DNS for Development

- Paste following inside ``/etc/hosts`` file

```text
127.0.0.1       auditor1.carbonAccounting.com
127.0.0.1       auditor2.carbonAccounting.com
127.0.0.1       peer1.auditor1.carbonAccounting.com
127.0.0.1       peer1.auditor2.carbonAccounting.com
127.0.0.1       peer1.auditor1.carbonAccounting.com
```

### End-to-End Test

```
  ./utility-emissions-channel/docker-compose-setup/start.sh {local(default)|docker}
  cd net-emissions-token-network && npx hardhat node
  cd utility-emissions-channel/typescript_app && npm run test
```

### Defining environment variables for a ethereum test network

- Create a file `.env.<name_of_network>` eg : `.env.ropsten`
- Copy content from `.env` and change values specific to that network
- Supported network networks
  - LEDGER_ETH_NETWORK=xdai
  - LEDGER_ETH_NETWORK=goerli
  - LEDGER_ETH_NETWORK=ropsten

### Starting the application

- Start local test ethereum node : `cd ../../net-emissions-token-network/ && npx hardhat node --show-accounts`
- Start application with local ethereum network: `npm run dev`
- Start application with `X` ethereum test network : `NODE_ENV=X npm run dev` , eg `NODE_ENV=ropsten npm run dev`

In order to use endpoint after starting the server, firstly Enroll Registrar then only use other endpoints.

- [X] POST /api/v1/carbonAccounting/recordAuditedEmissionsToken : record audited emission tokens
- [X] POST /api/v1/fabricRegistry/registrar : enroll registrar of a given organization
- [X] POST /api/v1/fabricRegistry/user : register and enroll a user from a organization
- [X] POST /api/v1/utilityemissionchannel/emissions : record emission on fabric
- [X] GET  /api/v1/utilityemissionchannel/emissions/:userId/:orgName/:uuid : get emission record with id = uuid
- [X] GET  /api/v1/utilityemissionchannel/allEmissions/:userId/:orgName/:utilityId/:partyId : get emission records with given utilityId and partyId
