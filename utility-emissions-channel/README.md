# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) use case.

Running the Code
================

First, install [minifabric](https://github.com/litong01/minifabric).  If you're new to minifabric, these [training videos](https://www.youtube.com/playlist?list=PL0MZ85B_96CExhq0YdHLPS5cmSBvSmwyO) are very helpful for getting familiar with it.

Then, copy the file ``spec.yaml`` from this repository to the ``minifabric/`` directory and use minifabric to set up your network and channels:

    $ ./minifab up -o auditor1.com
    $ ./minifab create -c utilityemissions
    $ ./minifab join

You can then check the status of your network with

    $ ./minifab stats

See all your docker contains

    $ docker ps

This will create your channel configuration file in ``./vars/utilityemissions_config.json``

    $ ./minifab channelquery
