# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) use case in a docker-compose setup.

Running the Code
================

1. Install Prerequisites (https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html)
2. Cd to `docker-compose-setup``
3. Start network: Run `./network.sh up createChannel`
4. Deploy and invoke `emissionscontract` chaincode (JS): Run `./network.sh deployCC`
5. Start blockchain-explorer (http://localhost:8080/, username: exploreradmin, pw: exploreradminpw): Run `./network.sh startBlockchainExplorer`
    