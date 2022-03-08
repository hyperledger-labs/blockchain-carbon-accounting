# Orbit DB

This directory contains the common data stored in OrbitDB for emissions calculations.  You can use it to replicate the data from our OrbitDB database, or set up your own.

## Setup

Run `npm install`

## Replicating Data

Script: `npx ts-node src/replicateDb.ts`

By default, this script starts an IPFS node.  You can also use another IPFS node, such as a local node started with `ipfs daemon --enable-pubsub-experiment`.  In that case, make sure you enable `pubsub`.  Then you can use `--ipfsapi http://127.0.0.1:5001/api/v0` to point to your local node.

By default, this script replicates against the upstream server (`52.204.157.187`).  To use another IPFS node as bootstrap, run `ipfs id` to obtain the correct node ID.  This is different from which server may run Orbit DB.  Then you can use `--bootstrap /ip4/IPADDRESS/tcp/4001/p2p/NODEID` to add your bootstrap node.

To keep the Orbit DB process running use the `--serve` flag, this allows using the node for replicating other nodes (see examples below).

This script stores data in `./orbitIpfs` or another directory set by `--ipfsdir` and the orbit DB metadata in `./orbitdb` or another directory set by `--orbitdir`.

Run `npx ts-node src/replicateDb.ts --ipfsapi http://127.0.0.1:5001/api/v0 --serve` to replicate into the local IPFS daemon and keep it running.

When this works, you can run

```
$ ts-node src/getData.ts 
{ emission: { value: 17720, uom: 'kg' }, year: 2021 }
```

Then you can try to replicate from your local instance: Run `ipfs id` to get the local IPFS node ID. For example:
```
ipfs id

{
        "ID": "12D3KooWDGUDi3vMhdp3gSq2DM3hJoXBQmmkVPEPcRHZGGPGqit3",
        ... 
}

```

Then you can run `npx ts-node src/replicateDb.ts --orbitdir orbitdb2 --bootstrap /ip4/127.0.0.1/tcp/4001/p2p/12D3KooWDGUDi3vMhdp3gSq2DM3hJoXBQmmkVPEPcRHZGGPGqit3` to replicate against the local node instead of the upstream server.

## Loading Data

If you want to load your own data, you will need to get your own emissions factors.  For example, you can download the [UK Government Greenhouse gas reporting: conversion factors 2019
](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2019).

Once you download them, use

```
$ npx ts-node src/dataLoader.ts load_utility_emissions conversion-factors-2021-flat-file-automatic-processing.xls
```

It will create an orbitdb address, then parse the worksheet, then load into orbitdb.  Then follow the steps from Replicating Data above to get your node id for replicating it. 