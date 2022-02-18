'use strict'

const Bootstrap = require('libp2p-bootstrap')
const KadDHT = require('libp2p-kad-dht')
const MPLEX = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const Libp2p = require('libp2p')
const IPFS = require('ipfs-core')
const TCP = require('libp2p-tcp')
const MulticastDNS = require('libp2p-mdns')



const libp2pBundle = (opts) => {

  const peerId = opts.peerId
  const bootstrapList = opts.config.Bootstrap

  return Libp2p.create({
    peerId,
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0']
    },
   
    connectionManager: {
      minPeers: 25,
      maxPeers: 100,
      pollInterval: 5000
    },
    modules: {
      transport: [
        TCP
      ],
      streamMuxer: [
        MPLEX
      ],
      connEncryption: [
        NOISE
      ],
      peerDiscovery: [
        MulticastDNS,
        Bootstrap
      ],
      dht: KadDHT
    },
    config: {
      peerDiscovery: {
        autoDial: true, 
        mdns: {
          interval: 10000,
          enabled: true
        },
        bootstrap: {
          interval: 30e3,
          enabled: true,
          list: bootstrapList
        }
      },
 
      relay: {
        enabled: true,
        hop: {
          enabled: true,
          active: true
        }
      },
      dht: {
        enabled: true,
        kBucketSize: 20,
        randomWalk: {
          enabled: true,
          interval: 10e3,
          timeout: 2e3 
        }
      },
      pubsub: {
        enabled: true
      }
    },
    metrics: {
      enabled: true,
      computeThrottleMaxQueueSize: 1000,  
      computeThrottleTimeout: 2000,       
      movingAverageIntervals: [           
        60 * 1000, 
        5 * 60 * 1000, 
        15 * 60 * 1000 
      ],
      maxOldPeersRetention: 50         
    }
  })
}

async function createIPFSNode () {

  const node = await IPFS.create({
    libp2p: libp2pBundle
  })

 
  setInterval(async () => {
    try {
      const peers = await node.swarm.peers()
      console.log(`The node now has ${peers.length} peers.`)
    } catch (err) {
      console.log('An error occurred trying to check our peers:', err)
    }
  }, 2000)

  
  setInterval(async () => {
    try {
      const stats = await node.stats.bw()
      console.log(`\nBandwidth Stats: ${JSON.stringify(stats, null, 2)}\n`)
    } catch (err) {
      console.log('An error occurred trying to check our stats:', err)
    }
  }, 4000)
}

createIPFSNode()

