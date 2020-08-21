# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) use case.

Running the Code
================

This example uses the Node.js chaincode.  You can change it to the Go version by changing ``node`` to ``go`` in the commands below and copying the code from the right directory.

First, install [minifabric](https://github.com/litong01/minifabric).  If you're new to minifabric, these [training videos](https://www.youtube.com/playlist?list=PL0MZ85B_96CExhq0YdHLPS5cmSBvSmwyO) are very helpful for getting familiar with it.

Then, add the path to minifab to your $PATH, so you can run it from this directory.  You will need to copy your code to the minifab ``vars/`` directory::  

    $ mkdir vars/chaincode/emissions/node
    $ cp -r ~/hyperledger/blockchain-carbon-accounting/utility-emissions-channel/chaincode/node vars/chaincode/emissions/node

Use minifabric to set up your network and channels, install, approve, commit, and initialize your chain code all in one::

    $ minifab up -o auditor1.com -n emissions -l node -c utilityemissions 

You can then check the status of your network with

    $ minifab stats

See all your docker contains

    $ docker ps

This will create your channel configuration file in ``./vars/utilityemissions_config.json``

    $ minifab channelquery

You can start and stop the blockchain explorer (see [minifabric - Hook up Explorer to your fabric network](https://github.com/litong01/minifabric/blob/master/docs/README.md#explorer-your-fabric-network))

    $ minifab explorerup
    $ minifab explorerdown

Then try running it

    $ minifab invoke -p '"recordEmissions", "BigUtility", "MyCompany", "2020-06-01", "2020-06-30", "15000", "KWH"'
    $ minifab invoke -p '"getEmissionsData", "BigUtility", "MyCompany", "2020-06-01", "2020-06-30"
 
 
