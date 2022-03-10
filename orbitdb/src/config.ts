import IPFS = require('ipfs')
import { create } from 'ipfs-http-client';
import type { OrbitDB as ODB } from 'orbit-db'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OrbitDB = require('orbit-db')

const ipfsDirectory = './orbitIpfs'
const ipfsOptions = {
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
    "Bootstrap": [],
  },
  EXPERIMENTAL: {
    pubsub: true
  }
}

const orbitDbDirectory = './orbitdb'
const orbitDbName = 'org.hyperledger.blockchain-carbon-accounting'

export const addCommonYargsOptions = (yargs) => {
  return yargs
    .option('bootstrap', {
      type: 'string',
      description: `Set a bootstrap node address when using NodeJS ipfs, eg: /ip4/52.204.157.187/tcp/4001/p2p/12D3KooWPKZ2NrS2wGxCQLV2DsEtdZDNRsPhTzdx18PHNvJDeWrQ`,
    })
    .option('ipfsapi', {
      type: 'string',
      description: 'Connect to this IPFS API endpoint instead of running a NodeJS IPFS node, eg: local, 127.0.0.1, http://127.0.0.1:5001/api/v0',
    })
    .option('ipfsdir', {
      type: 'string',
      description: `Directory of the IPFS data when running a NodeJS IPFS node (default: ${ipfsDirectory})`,
    })
    .option('ipfsport', {
      type: 'string',
      description: `Use a custom port for IPFS when running a NodeJS IPFS node (default: 4001)`,
    })
    .option('orbitdir', {
      type: 'string',
      description: `Directory of the orbit DB (default: ${orbitDbDirectory})`,
    })
    .option('orbitaddress', {
      type: 'string',
      description: `Address of the orbit DB (eg: zdpuAwsVJEKAebXSPJj75UimncxdD11RJ1BbbRPYYVrVdCjed)`,
    })
    .option('orbitcreate', {
      type: 'boolean',
      description: 'Flag to initialize a new OrbitDB',
    })
    .option('orbitdebug', {
      type: 'boolean',
      description: 'Debug orbitdb events',
    })
    .conflicts('orbitcreate', 'orbitaddress')
    .conflicts('bootstrap', 'ipfsapi')
    .conflicts('ipfsport', 'ipfsapi')
    .conflicts('ipfsdir', 'ipfsapi')
    // one of those is required
    .check((argv)=> argv.orbitcreate || argv.orbitaddress)
}

export const parseCommonYargsOptions = (argv) => {
  const ipfsOpts = Object.assign({}, ipfsOptions)
  const opts = {
    ipfsApiUrl: null,
    ipfsDirectory: ipfsDirectory,
    ipfsPort: '4001',
    ipfsBootstrap: null,
    useHttpClient: false,
    ipfsOptions: ipfsOpts,
    orbitDbDirectory: orbitDbDirectory,
    orbitDbName: orbitDbName,
    orbitDbAddress: null,
    orbitDbFullPath: null,
    orbitCreate: false,
    orbitDebug: false,
    createIpfsInstance: async () => await IPFS.create(ipfsOptions),
    createOrbitDbInstance: async (ipfs):Promise<ODB> => await OrbitDB.createInstance(ipfs)
  }
  if (argv['ipfsapi']) {
    opts.useHttpClient = true;
    let url = argv['ipfsapi']
    if (/^\d+\.\d+\.\d+\.\d+$/.test(url)) {
      url = `http://${url}:5001/api/v0`
    } else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(url)) {
      url = `http://${url}/api/v0`
    }
    opts.ipfsApiUrl = url
  }
  if (argv['ipfsdir']) {
    opts.ipfsDirectory = ipfsOpts.repo = argv['ipfsdir']
  }
  if (argv['ipfsport']) {
    opts.ipfsPort = argv['ipfsport']
    ipfsOpts.config.Addresses.Swarm = ipfsOpts.config.Addresses.Swarm.map(a=>a.replace('4001', argv['ipfsport']))
  }
  if (argv['bootstrap']) {
    if ('false' === argv['bootstrap']) {
      opts.ipfsBootstrap = null
      ipfsOpts.config.Bootstrap = []
    } else {
      opts.ipfsBootstrap = argv['bootstrap']
      ipfsOpts.config.Bootstrap = [argv['bootstrap']]
    }
  }
  if (argv['orbitcreate']) {
    opts.orbitCreate = true
  }
  if (argv['orbitdebug']) {
    opts.orbitDebug = true
  }
  if (argv['orbitdir']) {
    opts.orbitDbDirectory = argv['orbitdir']
  }
  if (argv['orbitaddress']) {
    opts.orbitDbAddress = argv['orbitaddress']
    opts.orbitDbFullPath = `/orbitdb/${opts.orbitDbAddress}/${opts.orbitDbName}`
  }

  opts.createIpfsInstance = async () => opts.useHttpClient ? ('local' === opts.ipfsApiUrl ? create() : create({url: opts.ipfsApiUrl})) : await IPFS.create(opts.ipfsOptions)
  opts.createOrbitDbInstance = async (ipfs) => await OrbitDB.createInstance(ipfs, {directory: opts.orbitDbDirectory})
  return opts
}
