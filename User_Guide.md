# User Guide

## Basic Concepts

The Blockchain Carbon Accounting application is a decentralized network for managing and trading in carbon emissions.  It can be used to:
- Issue audited emissions to users
- Transfer emissions in a supply chain, i.e. between suppliers and customers
- Vote on issuing carbon offsets
- Transfer and retire carbon offsets
- Calculate total emissions footprint of users

The members of the network are identified by their crypto wallet, but they are registered and known to the contract owner, who serves as the administrator of the network.  The contract owner/administrator maintains a database of each member's identity which is not stored on chain.  Every member on the network could have the following roles:
- Consumer: A company or individual which could receive tokens of emissions audits and carbon offsets.
- Emissions Auditor: An organization authorized to issue emissions audits.
- Offsets Dealer: An organization authorized to issue carbon offsets.

Audited emissions are records of emissions based on any activity which causes Greenhouse Gas (GHG) emissions.  The emissions are calculated based on the amount of the activity and an emissions factors.  For example, for use of electricity that emissions factor might be 0.2 kgCO2e per 1 KWH of electricity use, so if you used 200 KWH of electricity, then you would receive 40 kgCO2e of emissions in your audit.  The audited emissions is issued to the user as a token on the network.  Once issued to you, it cannot be transferred to someone else.

The network can be deployed on any Solidity compatible blockchain.  Currently we're deploying on the Binance Smart Chain (BSC) Testnet because we believe it has [the lowest energy footprint](https://opentaps.org/2022/03/24/estimating-the-energy-impact-of-the-binance-smart-chain/).

## Workflows

### Getting an Emissions Audit

The consumer would request an emissions audit by specifying the type and amount of activity and then uploading supporting documentation.  The system randomly routes each request to an auditor and encrypts the consumer's documentation using the auditor's public key.  The auditor can decrypt the document to verify that the request is correct.  If so, the auditor would issue an audited emissions token to the consumer. 

## Trying it Out

You can try out the dApp without installing anything.  Just start by going to https://emissions-test.opentaps.org.  You can get an estimate of emissions for an activity, such as a flight, shipment, or utility bill.  Depending on the activity type, you will be asked to enter additional information such as the amount of electricity or natural gas used, the shipping origin and destination or tracking numbers, or the flight information.  

You can then create an account just using your email.  Once you have an account, you can turn that estimate into an audited emission by requesting an audit.  This will require that you upload supporting documentation, which could be a bill or flight boarding pass.  Once you've done all that, click on Request Audit.  Your audit request will be queued.  

Once the audit is completed, you will be issued an emissions audit token.  You can log back into the system, click on Dashboard, and see a token of your emissions audit.  The token will show the auditor, the amount of the emissions, and metadata about it scope and activity type.  There is also a manifest of the supporting documentation which has been encrypted, so that only your auditor could decrypt and view it.

## Connecting to the BSC Testnet

If you used email to create an account, what happened behind the scene is that the system created an account for you on the Binance Smart Chain (BSC) Testnet and stored it for you.  You can import it into your Metamask wallet by following [these instructions](https://medium.com/spartanprotocol/how-to-connect-metamask-to-bsc-testnet-7d89c111ab2) to install Metamask in your browser and connecting it to the BSC testnet.

Then, go to My Roles and click on Export Private Key.  This will export the private key so that you can import into Metamask. **WARNING** Once you do this you will only be able to login with Metamask and not with your email any more. 

You can also use the system with your own testnet account.  Just follow [the same instructions](https://medium.com/spartanprotocol/how-to-connect-metamask-to-bsc-testnet-7d89c111ab2) to create the testnet account and get some test BNB tokens (no cash value.)  Then [contact us on Discord](https://discord.gg/7jmwnTyyQ8) to give us the _public_ key of your account.  We will set it up as a Consumer on the testnet.  

Now you can test it by logging into the dApp and click on the "Request Audit" button to request an emissions audit.  



