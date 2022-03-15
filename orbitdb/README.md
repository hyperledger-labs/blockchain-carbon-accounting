# Orbit DB

This directory contains the common data stored in OrbitDB for emissions calculations.  You can use it to replicate the data from our OrbitDB database, or set up your own.

## Setup

Run `npm install`.

## Replicating Data

To replicate the data from the upstream server:

```
npx esr src/replicateDb.ts --orbitaddress zdpuAuCqi5pqTjDPXcU2LhAErAy7GSeFX37yGGqtjh1Z3mUo4 --bootstrap /ip4/52.204.157.187/tcp/4001/p2p/12D3KooWPKZ2NrS2wGxCQLV2DsEtdZDNRsPhTzdx18PHNvJDeWrQ
```

By default, this script starts an IPFS node.  You can also use another IPFS node, such as a local node started with `ipfs daemon --enable-pubsub-experiment`.  In that case, make sure you enable `pubsub`.  Then you can use `--ipfsapi local` to point to your local node.

To use another IPFS node as bootstrap, run `ipfs id` to obtain the correct node ID.

To keep the Orbit DB process running use the `--serve` flag, this allows using the node for replicating other nodes (see examples below).

This script stores data in `./orbitIpfs` or another directory set by `--ipfsdir` and the orbit DB metadata in `./orbitdb` or another directory set by `--orbitdir`.

Run `npx esr src/replicateDb.ts --orbitaddress zdpuAuCqi5pqTjDPXcU2LhAErAy7GSeFX37yGGqtjh1Z3mUo4 --ipfsapi local --orbitdir orbitdb_2 --serve` to replicate using the local IPFS daemon and keep it running.

When this works, close the serving script and you can run:
```
$ npx esr src/getData.ts --orbitaddress zdpuAuCqi5pqTjDPXcU2LhAErAy7GSeFX37yGGqtjh1Z3mUo4 test
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

Then you can run `npx esr src/replicateDb.ts --orbitaddress zdpuAuCqi5pqTjDPXcU2LhAErAy7GSeFX37yGGqtjh1Z3mUo4 --orbitdir orbitdb_3 --bootstrap /ip4/127.0.0.1/tcp/4001/p2p/12D3KooWDGUDi3vMhdp3gSq2DM3hJoXBQmmkVPEPcRHZGGPGqit3` to replicate against the local node instead of the upstream server.

## Loading Data

If you want to load your own data, you will need to get your own emissions factors.  For example, you can download the [UK Government Greenhouse gas reporting: conversion factors 2021
](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2021).

Once you download them, use

```
$ npx esr src/dataLoader.ts load_emissions_factors conversion-factors-2021-flat-file-automatic-processing.xls --orbitcreate
```

It will create an orbitdb address, then parse the worksheet, then load into orbitdb.  Then follow the steps from Replicating Data above to get your node id for replicating it.

## Example Usage

### Using the NodeJS IPFS node

Create a DB and load:
```
npx esr src/dataLoader.ts load_utility_emissions conversion-factors-2021-flat-file-automatic-processing.xls --orbitcreate
```

Optionally you can specify `--orbitdir orbitdb1 --ipfsdir orbitipfs1` to use different data folders when creating the DB.
Example output:
```
=== Creating new OrbitDB:  org.hyperledger.blockchain-carbon-accounting
=== OrbitDB address: /orbitdb/zdpuAxZtb1Vy92R1LxVQvzuXvuCEv4aLtGrBdM8bV63ciN4s3/org.hyperledger.blockchain-carbon-accounting
```

The getData script can then be used with (using the same directories parameters if those were given above):
```
npx esr src/getData.ts --orbitaddress zdpuAxZtb1Vy92R1LxVQvzuXvuCEv4aLtGrBdM8bV63ciN4s3 test
```

Then you can `serve` it (using the same directories parameters if those were given above) with:
```
npx esr src/replicateDb.ts --orbitaddress zdpuAxZtb1Vy92R1LxVQvzuXvuCEv4aLtGrBdM8bV63ciN4s3 --serve
```

Replication in another IPFS node, not I added a port parameter since the first node would already use 4001:
```
npx esr src/replicateDb.ts --ipfsdir orbitipfs_2 --orbitdir orbitdb_2 --ipfsport 4002 --orbitaddress zdpuAxZtb1Vy92R1LxVQvzuXvuCEv4aLtGrBdM8bV63ciN4s3
```

This can also be tested for query:
```
npx esr src/getData.ts --orbitaddress zdpuAxZtb1Vy92R1LxVQvzuXvuCEv4aLtGrBdM8bV63ciN4s3 --ipfsdir orbitipfs_2 --orbitdir orbitdb_2 --ipfsport 4002 test
```

## Using a local IPFS node

Instead of using the NodeJS IPFS node, we can also use a daemon (like go-ipfs). This should be started in a terminal or as a service with:
```
ipfs daemon --enable-pubsub-experiment
```

In that case the DB creation can be done with:
```
npx esr src/dataLoader.ts load_utility_emissions conversion-factors-2021-flat-file-automatic-processing.xls --orbitcreate --ipfsapi local --orbitdir orbitdb_local
```

Then query (assuming this created zdpuAsPTgBqwm9W3gff2BA4snv4NJ6TVEZpD1DcFjBxaDvx2m) (note: `--ipfsapi local` is a shortcut for `--ipfsapi http://127.0.0.1:5001/api/v0`, use the later form if your IPFS node is setup with a different API port):
```
npx esr src/getData.ts --orbitaddress zdpuAsPTgBqwm9W3gff2BA4snv4NJ6TVEZpD1DcFjBxaDvx2m --ipfsapi local --orbitdir orbitdb_local test

```

## Querying the database

The script `src/getData.ts` can be used to query the database specific rows of the database, like this:
```
$ npx esr src/getData.ts --ipfsapi local --orbitaddress <your-orbitdb-hash-address> activity-emissions 'scope 1' 'REFRIGERANT & OTHER' 'KYOTO PROTOCOL - STANDARD' 'PERFLUOROBUTANE (PFC-3-1-10)' '' '' 12 'kg'
....
{ emission: { value: 106320, uom: 'kg' }, year: 2021 }

$ npx esr src/getData.ts --orbitaddress <your-orbitdb-hash-address> activity-emissions 'scope 3' 'HOTEL STAY' 'HOTEL STAY' 'ROMANIA' '' '' 4 'Room per night'
....
{ emission: { value: 102, uom: 'kg' }, year: 2021 }

$ npx esr src/getData.ts  --orbitaddress zdpuB21J5YVqyyNKx4isq3QUket12gx2zA1YTUr11Zwp2pArX activity-emissions 'scope 3' 'WTT- business travel- air' 'WTT- flights' 'International, to/from non-UK' 'First class' 'With RF' 2500 'passenger.km'
{ emission: { value: 153.975, uom: 'kg' }, year: 2021 }

$ npx esr src/getData.ts  --orbitaddress zdpuB21J5YVqyyNKx4isq3QUket12gx2zA1YTUr11Zwp2pArX activity-emissions 'scope 3' 'WTT- business travel- air' 'WTT- flights' 'International, to/from non-UK' 'Premium economy class' 'With RF' 2500 'passenger.km
{ emission: { value: 61.599999999999994, uom: 'kg' }, year: 2021 }


```


Substitute your orbitdb's hash address from dataLoader or replicateDb, which would look like `zdpuAuCqi5pqTjDPXcU2LhAErAy7GSeFX37yGGqtjh1Z3mUo4`.  Use the Scope, level 1, 2, 3, 4, and UOM for the rows of the `conversion-factors-2021-flat-file-automatic-processing.xls spreadsheet.
