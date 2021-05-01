#!/bin/sh
set -e
echo "Clean ..."
npx hardhat clean
echo "Compile ..."
npx hardhat compile
echo "Copy ABIs to interface constracts ..."
cp -fv artifacts/contracts/Governance/DAOToken.sol/DAOToken.json interface/packages/contracts/src/abis/
cp -fv artifacts//contracts/Governance/Governor.sol/Governor.json interface/packages/contracts/src/abis/
cp -fv artifacts//contracts/NetEmissionsTokenNetwork.sol/NetEmissionsTokenNetwork.json interface/packages/contracts/src/abis/
