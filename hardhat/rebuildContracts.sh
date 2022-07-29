#!/bin/sh
set -e
echo "Clean ..."
npx hardhat clean
echo "Compile ..."
npx hardhat compile
echo "Copy ABIs to interface contracts ..."
cp -fv artifacts/solidity/Governance/DAOToken.sol/DAOToken.json ../app/frontend/contracts/src/abis/
cp -fv artifacts/solidity/Governance/Governor.sol/Governor.json ../app/frontend/contracts/src/abis/
cp -fv artifacts/solidity/NetEmissionsTokenNetwork.sol/NetEmissionsTokenNetwork.json ../app/frontend/contracts/src/abis/
echo "Regen ABI from artifacts/solidity/NetEmissionsTokenNetwork.sol/NetEmissionsTokenNetwork.json into ../fabric/typescript_app/src/static/contract-NetEmissionsTokenNetwork.json using jq ..."
jq .abi artifacts/solidity/NetEmissionsTokenNetwork.sol/NetEmissionsTokenNetwork.json > ../fabric/typescript_app/src/static/contract-NetEmissionsTokenNetwork.json
cp ../fabric/typescript_app/src/static/contract-NetEmissionsTokenNetwork.json ../lib/blockchain-gateway/src/static/
