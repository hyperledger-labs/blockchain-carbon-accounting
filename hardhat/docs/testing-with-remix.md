# Testing with Remix IDE

Another method for interacting with the contracts in addition to Hardhat Network is using the web-based Remix IDE.

First, the remixd plugin must be installed globally via NPM in order to run a daemon so that Remix can connect to the locally hosted contracts in-browser.

```bash
npm install -g @remix-project/remixd
```

Install the dependencies for the contract in the hardhat directory:

```bash
npm install
```

To start the volume, run the following replacing `/path/to/repo` with the absolute path of this folder on your machine (symbolic links are unsupported):

```bash
remixd -s /path/to/repo/blockchain-carbon-accounting/hardhat --remix-ide https://remix.ethereum.org
```

After installing, navigate to https://remix.ethereum.org/ in your web browser.

Find the "plugins" tab on the left of the IDE user interface. Select remixd and connect. You will now see the entire hardhat folder in the file explorer within remixd.

Under localhost -> contracts, select NetEmissionsTokenNetwork.sol in the file explorer.

Go to the compiler tab, change the compiler version to the same as the Solidity version at the beginning of the contract.  Check the box for "optimize" and compile the contract.

Next, select the "Deploy and run transactions tab", change the gas limit to "9999999", select "NetEmissionsTokenNetwork" from the drop down, and deploy the contract.

You can now interact with the contract's functions via the user interface in Remix.
