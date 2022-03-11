import { SingleBar, Presets } from 'cli-progress';
import { addCommonYargsOptions, parseCommonYargsOptions } from './config'
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

async function main()
{
  const argv = addCommonYargsOptions(yargs(hideBin(process.argv)))
    .option('serve', {
      type: 'boolean',
      description: 'Keep the node running',
    })
    .recommendCommands()
    .strict()
    .showHelpOnFail(true)
    .argv;

  const opts = parseCommonYargsOptions(argv)

  // Create IPFS instance
  if (opts.useHttpClient) {
    console.log(`=== Connecting to IPFS ${opts.ipfsApiUrl}`)
  } else {
    if (opts.ipfsBootstrap) console.log('=== IPFS Bootstrap setting: ', opts.ipfsOptions.config.Bootstrap)
    console.log('=== Starting NodeJS IPFS')
  }
  const ipfs = await opts.createIpfsInstance()

  // Create OrbitDB
  console.log('=== Starting OrbitDB using directory: ', opts.orbitDbDirectory)
  const orbitdb = await opts.createOrbitDbInstance(ipfs)
  const replicationBar = new SingleBar(
    {
      format:
      'Replicating OrbitDB |' +
        '{bar}' +
        '| {percentage}% | ETA: {eta}s | {value}/{total} chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      etaBuffer: 50,
      etaAsynchronousUpdate: true,
    },
    Presets.shades_classic,
  )
  const loadingBar = new SingleBar(
    {
      format:
      'Loading OrbitDB |' +
        '{bar}' +
        '| {percentage}% | ETA: {eta}s | {value}/{total} chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      etaBuffer: 50,
      etaAsynchronousUpdate: true,
    },
    Presets.shades_classic,
  )
  let replicationBarStarted = false;
  let loadingBarStarted = false;

  const stopBars = () => {
    if (replicationBarStarted) replicationBar.stop();
    if (loadingBarStarted) loadingBar.stop();
  }

  console.log('=== Making existing OrbitDB replica')

  const start = async () => {
    const db = await orbitdb.docstore(opts.orbitDbFullPath)
    const done = async () => {
      stopBars();
      console.log('Done');

      if (argv['serve']) {
        console.log('OrbitDB Started ... (press CTRL-C to stop)')
      } else {
        console.log('=== Closing OrbitDB ...')
        await db.close()
        if (!opts.useHttpClient) {
          console.log('=== Stopping IPFS, or press CTRL-C to terminate. ...')
          try {
            await ipfs.stop()
          } catch (err) {
            console.error('== Error stopping IPFS, should not matter.', err)
          }
          console.log('=== All stopped')
        } else {
          console.log('=== All stopped, press CTRL-C to terminate. ...')
        }
      }
    }

    db.events.on('load.progress', async (_address, _hash, _entry, progress, have) => {
      if (!loadingBarStarted) {
        console.log('Loading DB...')
        loadingBar.start(have, progress)
        loadingBarStarted = true
      } else {
        loadingBar.update(progress)
      }
    });
    db.events.on('ready', async () => {
      stopBars()
      console.log('OrbitDB ready')
      const loadedRes = db.get('')
      console.log(`Current number of records: ${loadedRes.length}`)
      // note do not call done if we were also somehow replicating or the number of record is 0
      if (replicationBarStarted || !loadedRes.length) return
      await done()
    });
    db.events.on('load', async (dbname) => {
      console.log('Loading OrbitDB: ', dbname)
    });
    db.events.on('replicate.progress', (_address, _hash, _entry, progress, have) => {
      if (!replicationBarStarted) {
        console.log('Starting replication...')
        replicationBar.start(have, progress)
        replicationBarStarted = true
      } else {
        replicationBar.update(progress)
      }
    });
    db.events.on('replicated', async () => {
      stopBars()
      const loadedRes = db.get('')
      console.log(`Replicated number of records: ${loadedRes.length}`)
      console.log('Reloading ...')
      replicationBarStarted = false
      await db.close()
      await start()
    });
    await db.load()
  }
  await start()
}
main()
