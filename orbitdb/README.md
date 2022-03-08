# Orbit DB

## Setup

Run `npm install`

## Usage

Script: `npx ts-node src/replicateDb.ts`


By defaults this starts an IPFS node (stores data in `./orbitIpfs` or another directory set by `--ipfsdir`, and the orbit DB metadata in `./orbitdb` or another directory set by `--orbitdir`).

To use another IPFS node you can use for example `--ipfsapi http://127.0.0.1:5001/api/v0` to point to a local running node such as `ipfs daemon --enable-pubsub-experiment`.
Note: `pubsub` must be enabled on that node.

To use another IPFS node as bootstrap you can use for example `--bootstrap /ip4/127.0.0.1/tcp/4001/p2p/NODEID`, so for a local `ipfs daemon` you can run `ipfs id` to obtain the correct node ID. By default this replicates against the upstream server (`52.204.157.187`).
Note: this is different from which server may run Orbit DB.

To keep the Orbit DB process running use the `--serve` flag, this allows using the node for replicating other nodes (see examples below).


### Examples


Run `npx ts-node src/replicateDb.ts --ipfsapi http://127.0.0.1:5001/api/v0 --serve` to replicate into the local IPFS daemon and keep it running.

Then run `ipfs id` to get the local IPFS node ID. For example:
```
ipfs id

{
        "ID": "12D3KooWDGUDi3vMhdp3gSq2DM3hJoXBQmmkVPEPcRHZGGPGqit3",
        ... 
}

```

Then run `npx ts-node src/replicateDb.ts --orbitdir orbitdb2 --bootstrap /ip4/127.0.0.1/tcp/4001/p2p/12D3KooWDGUDi3vMhdp3gSq2DM3hJoXBQmmkVPEPcRHZGGPGqit3` to replicate against the local node instead of the upstream server.
