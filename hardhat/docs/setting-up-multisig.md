# Setting Up MultiSig Signing for the Net Emissions Tokens Network Contract

You could deploy a contract with a single private key, but that's very risky.  Anybody who gets a hold of your private key has control of your contract.  If you ever lost your private key, then neither you nor anybody else could manage the contract any more.

A better way to do is through a MultiSig wallet, so that several key holders need to sign off on key transactions.  This helps protect your contract from both hacking and lost keys.

In this tutorial, we'll show you how to set up the Net Emissions Tokens Network contract to work with the Gnosis Safe MultiSig wallet.  Gnosis Safe lets you designate several keyholders to sign off on "admin" tasks of your contract.  

## Setting Up a Gnosis Safe MultiSig Wallet

Go to [Gnosis Safe](https://gnosis-safe.io/) and connect your Metamask wallet.  

Create a new safe under Settings.

Add the public addresses of the signing owners under Settings > Owners.  Each time you add a new owner, the existing owners will need to sign with Metamask to confirm.

Set the number of owners who must sign off on transactions under Settings > Policies.

As a test, you can set up a Safe with 3 Goerli accounts with a policy that requires 2 of 3 owners to confirm.

When the Safe is created, it will have its own address like `gor:0x1dF589cfb715C96236234e65C6a929094896d37C`, which is a wallet address on Goerli.

## Connecting the Contract to Gnosis Safe

To connect your contract to the Gnosis Safe, you will need to deploy the contract and then make the Gnosis Safe instead of the original deploying account its admin.

To deploy the contract, follow the instructions from [deployment.md] to a public network such as the Goerli testnet.

Then run

```
$ npx hardhat deploy --network goerli
...
Deploying NetEmissionsTokenNetwork with account: 0xD32E793008B0FbD13C889E291bc049483Da316bA
NetEmissionsTokenNetwork deployed to: 0xE8854ec567b3762046d8f773547f373e6A1A620A
...
```

Once it's deployed, grant the admin role to the Gnosis Safe address:
```
$ npx hardhat grantAdminRole --network goerli  --contract  0xE8854ec567b3762046d8f773547f373e6A1A620A --new-admin 0x1dF589cfb715C96236234e65C6a929094896d37C
Executed grantRole() on 0xE8854ec567b3762046d8f773547f373e6A1A620A. Done.
```

The Gnosis Safe is now an admin of your contract, but so is the original deploying account.  So while the Gnosis Safe could manage your contract if you lost your original private key, someone who hacks into that key would also be able to take over your contract.  To prevent this from happening, you'll need to remove the original private key as the admin.

## Verifying your Contract

Before doing that, let's take one step to verify the contract on etherscan.  That'll make it easier to work with Gnosis Safe.

Edit the `.ethereum-config.js` and `hardhat.config.ts` to set the etherscan API key (if you're using Goerli, you'll need to set up an [infura.io] account -- see instructions from [deployment.md]).

Then verify your contracts with

```
$ npx hardhat etherscan-verify --network goerli
already verified: CarbonTracker (0xDb80143bCf04B53Ed586b7f806C25ff275b5Cc5b), skipping.
verifying CarbonTracker_Implementation (0x2a29a9f714A563C39Ad192F4bB97459dFB1cB799) ...
waiting for result...
 => contract CarbonTracker_Implementation is now verified
already verified: CarbonTracker_Proxy (0xDb80143bCf04B53Ed586b7f806C25ff275b5Cc5b), skipping.
verifying DAOToken (0xA42CF1Ad92DA73DE10B13f24224EE5Bca8644184) ...
waiting for result...
 => contract DAOToken is now verified
verifying DefaultProxyAdmin (0x7444eB48724Ff69514706b1537d7c7bD164B8703) ...
waiting for result...
 => contract DefaultProxyAdmin is now verified
verifying Governor (0x57a4744A34e9F1a8D555319aA7B7F50d7cF0a98E) ...
waiting for result...
 => contract Governor is now verified
verifying NetEmissionsTokenNetwork (0xE8854ec567b3762046d8f773547f373e6A1A620A) ...
waiting for result...
 => contract NetEmissionsTokenNetwork is now verified
verifying NetEmissionsTokenNetwork_Implementation (0x8311b6Efc87311f575267C92D42210D7a725DcD9) ...
waiting for result...
 => contract NetEmissionsTokenNetwork_Implementation is now verified
verifying NetEmissionsTokenNetwork_Proxy (0x45Cd99F9C3b657D092c5BA81C8c39C99a81DA4C4) ...
waiting for result...
 => contract NetEmissionsTokenNetwork_Proxy is now verified
verifying Timelock (0xD6192693F3ff3C35D1C7EAA0b8ddAc1642BAA883) ...
waiting for result...
 => contract Timelock is now verified
```

After this is completed, you can go to Etherscan with the address of your contract such as https://goerli.etherscan.io/address/0xE8854ec567b3762046d8f773547f373e6A1A620A#code  You will see "Contract Source Code Verified" with Code, Read Contract, Write Contract options.

## Using Gnosis Safe

Now go to Gnosis and start New Transaction, paste in the Contract address (`0xE8854ec567b3762046d8f773547f373e6A1A620A` from above.)

If the contract is verified, the ABI automatically appears, along with a list of methods available.  

If the contract is not verified, you will have to manually paste in the ABI.  For Goerli this is in the file `deployments/goerli/NetEmissionsTokenNetwork.json`.  For other networks look for the json file in `deployments/` folder.  Copy everything after `“abi:”`starting with (and including) the `[` and `]`. 

The first thing to run is revokeRole method to remove the original contract owner as the admin.  Choose the revokeRole method 
Then we will need the role parameter in hexadecimal, which can be gotten with

```
$ npx hardhat roles
DEFAULT_ADMIN_ROLE: 0x0000000000000000000000000000000000000000000000000000000000000000
REGISTERED_DEALER: 0xf8890eedd7900ad88da6192fd03dbb69dbeee963b1a0ed738abe49ab3331aaf3
REGISTERED_REC_DEALER: 0x2ab9f1da92e74aaa01eb75a871557505b11dd8d36832a34bb21bbee88b08d860
REGISTERED_OFFSET_DEALER: 0xede6574deba8f02ada7888448a497b08844d62e044ed533343a673be3ffcde5f
REGISTERED_EMISSIONS_AUDITOR: 0xe97dad3dbe5042e7384b1572cf966a15e089576a62b5126c5ef1d184ab18b12c
REGISTERED_CONSUMER: 0x5e1aa547d3dade8c68b013a47ad41c2bcc9b9e4b0765b0fb616780e15786e76a
REGISTERED_INDUSTRY: 0x8305613dd3dbc3e0773e56336f52890c75fc1219c6ed3f363339b8ada04df289
```

Once the transaction is started, every owner of the Multisig wallet will need to connect their Metamask wallet with Gnosis Safe and sign.  

Once enough owners have signed, the transaction goes to “Pending”.  Once it's completed, it'll say "Success".

You can also grant and revoke roles for other accounts through Gnosis Multisig.  Once an account has a role are granted, they could use the network and issue tokens through the dApp using Metamask.	

