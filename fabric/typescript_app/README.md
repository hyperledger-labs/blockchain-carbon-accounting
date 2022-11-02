# Ledger Integration Application

Ledger Integration uses Cactus project to interact with various ledger using in blockchain carbon accounting project. Currently HL fabric and ethereum ledger are being used. One chaincode named `EmissionsChaincode` is installed on fabric and Two smart contract named `NetEmissionsTokenNetwork` & `DAOToken` are installed on ethereum.

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

### Running Tests

1. Start Hardhat ethereum node : `cd hardhat && npx hardhat node`
2. Insert some mock data into test server, configure vault server for the testing : `npm run test:setup`
Above will copy blockchain-gateway-lib files : `./cp-blockchain-gateway-lib.sh` to typecript-app 
3. Run Test Coverage : `npm run coverage`
