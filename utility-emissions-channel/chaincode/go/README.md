# utility-emissions-channel [GOLANG version]

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) use case.

Running the Code
================

This example uses the Node.js chaincode.  You can change it to the Go version by changing ``node`` to ``go`` in the commands below and copying the code from the right directory.

First, install [minifabric](https://github.com/litong01/minifabric).  If you're new to minifabric, these [training videos](https://www.youtube.com/playlist?list=PL0MZ85B_96CExhq0YdHLPS5cmSBvSmwyO) are very helpful for getting familiar with it.

Then, add the path to minifab to your $PATH, so you can run it from this directory.  You will need to copy your code to the minifab ``vars/`` directory::  

    $ mkdir vars/chaincode/emissions/go
    $ cp -r ~/hyperledger/blockchain-carbon-accounting/utility-emissions-channel/chaincode/go/ vars/chaincode/emissions/go/

Use minifabric to set up your network and channels, install, approve, commit, and initialize your chain code all in one::

    $ minifab up -o auditor1.com -n emissions -l go -c utilityemissions -s couchdb

You can then check the status of your network with

    $ minifab stats

See all your docker contains

    $ docker ps

This will create your channel configuration file in ``./vars/utilityemissions_config.json``

    $ minifab channelquery


You can start and stop the blockchain explorer (see [minifabric - Hook up Explorer to your fabric network](https://github.com/litong01/minifabric/blob/master/docs/README.md#explorer-your-fabric-network))

    $ minifab explorerup
    $ minifab explorerdown

To install, approve and commit your chaincode

    $minifab install -n emissions -l go -v 1.x

    $minifab approve -n emissions -l go -v 1.x

    $minifab commit -n emissions -l go -v 1.x

TO update your chain, add the higher version of chaincode 1.x (Increase "x" each time you make a change) as follow:

Initialize the chaincode 

    $minifab initialize

Get the Emission Record with specific Utility ID 

    $minifab invoke -p '"getEmissionRecord", "UtilityX"'

"X" can be from 1,2,3 to "n", where n is the sequence of Utility 

To compute the amount of emissions corresponding to each Utility 

    $minifab invoke -p '"compEmissionAmount", "UtilityX"'

The amount of emission is computed as follow: 
    Calculate Emissions = Utility Emissions Factors.CO2_Equivalent_Emissions / Net_Generation * Usage * (Usage_UOM/Net_Generation_UOM) * (CO2_Equivalent_Emissions_UOM / Emissions_UOM)

To get the history of transaction executed with an Utility

    $minifab invoke -p '"getHistory", "UtilityX"'
