export const ipfsDirectory = './orbitIpfs'
export const ipfsRemoteNode = '/ip4/52.204.157.187/tcp/4001/p2p/12D3KooWPKZ2NrS2wGxCQLV2DsEtdZDNRsPhTzdx18PHNvJDeWrQ'
// export const ipfsRemoteNode = '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWDGUDi3vMhdp3gSq2DM3hJoXBQmmkVPEPcRHZGGPGqit3'
export const ipfsOptions = {
  repo: ipfsDirectory,
  config: {
    "Addresses": {
      "Swarm": [
        "/ip4/127.0.0.1/tcp/4001",
      ],
      "Announce": [],
      "NoAnnounce": [],
      "API": "/ip4/127.0.0.1/tcp/5001",
      "Gateway": "/ip4/127.0.0.1/tcp/8082"
    },
    "Bootstrap": [
      ipfsRemoteNode
    ],
  },
  EXPERIMENTAL: {
    pubsub: true
  }
}
// export const ipfsClientUrl = 'http://127.0.0.1:5001/api/v0'
export const ipfsClientUrl = 'http://52.204.157.187:5001/api/v0'

export const orbitDbDirectory = './orbitdb'
export const orbitDbName = 'org.hyperledger.blockchain-carbon-accounting'
export const orbitDbAddress = 'zdpuAwsVJEKAebXSPJj75UimncxdD11RJ1BbbRPYYVrVdCjed'
export const orbitDbFullPath = `/orbitdb/${orbitDbAddress}/${orbitDbName}`
