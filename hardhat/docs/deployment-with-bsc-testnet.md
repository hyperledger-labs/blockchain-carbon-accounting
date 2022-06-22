# Deployment

## Chain code

### Configuration

You must have `.ethereum-config.js` with all the proper values setup (see `.ethereum-config.js.template`).

Then make sure to edit `hardhat.config.ts`:

This should be uncommented, and the network should be defined at the bottom of the file:
```
const ethereumConfig = require("./.ethereum-config");

...

// Uncomment the following lines if deploying contract to Binance BSC testnet
bsctestnet: {
  url: "https://data-seed-prebsc-1-s1.binance.org:8545",
  chainId: 97,
  gasPrice: 20000000000,
  accounts: [`0x${ethereumConfig.BSC_PRIVATE_KEY}`]
}
```


### Contract deployment to BSC testnet

Initial deployment on the block chain

```
npx hardhat --network bsctestnet deploy --reset
```

This outputs:
```
Nothing to compile
Deploying DAOToken with account: xxxxxxxxxxxxxxxxxxxxxx
DAO Token deployed to: 0x0f3e1c1E898576C2515d07580284d3caDACFBb5f
Deploying DAO with account: xxxxxxxxxxxxxxxxxxxxxx
Timelock deployed to: 0xa37368306FA5A56945B2f65Dd0e38b338463c3e1
Governor deployed to: 0xeb6b1516471b49f508DBE0d989dC5147e96942a4
Initialized Governor address on DAOToken.
Queued setPendingAdmin() on Timelock.
---
Please copy and paste this command after Fri May 06 2022 14:58:57 GMT+0800 (China Standard Time)
to complete the Timelock admin switch:

npx hardhat completeTimelockAdminSwitch --network bsctestnet .......
---
Deploying NetEmissionsTokenNetwork with account: xxxxxxxxxxxxxxxxxxxxxxx
NetEmissionsTokenNetwork deployed to: 0x4FB55d1D6Aab976d527dD5C9700d73b20f155A07
Timelock address set so that the DAO has permission to issue tokens with issueOnBehalf().
Deploying CarbonTracker with account:xxxxxxxxxxxxxxxxxxxxxxx
CarbonTracker deployed to: 0x00fb3250af0eA88ba9279E3bBa7dF5b6Af6E6573
```


## Install dependencies or Update

To make sure all the packages dependencies are up to date:

```
git fetch
git merge origin/main
rm -rf node_modules */node_modules
npm i
```



## Backend


### Prepare the DB

If the DB already exists, delete it first if you want to start from a clean state:
```
dropdb blockchain-carbon-accounting
```

In all cases it must be created:
```
createdb blockchain-carbon-accounting
```

Run the data loader from `data`:

Make sure you have the DB credentials setup in `.env`, for example:
```
DB_USER=opentaps
DB_PASSWORD=opentaps
```

Then:
```
npm run loadSeeds

psql blockchain-carbon-accounting < seeds/*
```


### Build API server

Go to `app/api-server/` and run:

```
npm i
npm run build
```

To synchronize with public networks, we will need an API from Moralis:

* Sign up [Moralis](https://moralis.io/)
* Go to admin page and select `Speedy Nodes` tab.
* Select `Binance Network Endpoints` and switch into `WS`.
* You can use `wss://speedy-nodes-nyc.moralis.io/<API_KEY>/bsc/testnet/ws` as `LEDGER_ETH_WS_URL`.

Alternative:
* Try [GetBlock.io](https://getblock.io/)
* Use `wss://bsc.getblock.io/testnet/?api_key=YOUR_API_KEY_HERE` as `LEDGER_ETH_WS_URL`


Set parameters in the repository root `.env`:
Note:
* contract address must match your previous deployment
* use your Moralis API key in `LEDGER_ETH_WS_URL` and `MORALIS_API_KEY`
* have your UPS and Google credentials setup

```
# API SERVER PORT
API_SERVER_PORT=8002

# needed for the imported modules and SC call
LEDGER_ETH_JSON_RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545"
LEDGER_ETH_WS_URL="wss://speedy-nodes-nyc.moralis.io/<APIKEY>/bsc/testnet/ws"
LEDGER_ETH_NETWORK="bsctestnet"
LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS="0x4FB55d1D6Aab976d527dD5C9700d73b20f155A07"

# Where to find uploaded documents:
DOC_UPLOAD_PATH="./upload/"

# Moralis API_KEY
MORALIS_API_KEY="<APIKEY>"

# For handling qudit requests:
# use live or sandbox
UPS_ENV=live
# credentials
UPS_USER=
UPS_PASSWORD=
UPS_KEY=
# for google APIS, requires the Distance Matrix API
GOOGLE_KEY=

# set credentials to lookup emissions factor in the postgres database
DB_USER=opentaps
DB_PASSWORD=opentaps
```

To manage the process and restart on crash use `pm2`:
```
npm install pm2 -g
```

Start it with (must be from the `api-server` directory):
```
pm2 start "npx ts-node server" --name bca-api-server
```

You can manage with `pm2 list` `pm2 stop X` `pm2 delete X` `pm2 log X` ...

For example to see the app logs:
```
pm2 log bca-api-server
```
or check the files: `~/.pm2/log/bca-api-server.*`

To restart one can do (must be from the `api-server` directory):
```
pm2 restart bca-api-server --update-env
```
or if needed one can clear the pm2 process altogether with:
```
pm2 delete bca-api-server
# which then need to be restarted with
pm2 start "npx ts-node server" --name bca-api-server
```

### Check Web Server config

Note the port used here is 8002 for the API server, so the Apache configuration for the website
proxy `/api/*` to `http://localhost:8002`. (matching the `REACT_APP_API_BASE` setting in the Frontend section).

Deploying the react app build into `/var/www/html/emissionstokens.opentaps.org` (https://emissionstokens.opentaps.org)

The Apache config would look like:
```
<VirtualHost 172.30.1.19:443>
  ServerName emissions-test.opentaps.org

  DocumentRoot "/var/www/html/emissions-test.opentaps.org"
  DirectoryIndex index.html
  ServerAdmin webmaster@opentaps.org
  ErrorLog /var/log/httpd/emissions-test.opentaps.org/error_log
  CustomLog /var/log/httpd/emissions-test.opentaps.org/access_log combined

  <Directory "/var/www/html/emissions-test.opentaps.org/">
     AllowOverride All
     Order allow,deny
     Allow from all
     # Don't rewrite files or directories
     RewriteCond %{REQUEST_FILENAME} -f [OR]
     RewriteCond %{REQUEST_FILENAME} -d
     RewriteRule ^ - [L]
     # Rewrite everything else to index.html to allow html5 state links
     RewriteRule ^ index.html [L]
  </Directory>

  # Proxy for our backend
  ProxyPass /api http://localhost:8002
  ProxyPassReverse /api http://localhost:8002

  # SSL configuration using letsencrypt
  SSLCertificateFile /etc/letsencrypt/live/emissions-test.opentaps.org/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/emissions-test.opentaps.org/privkey.pem
  Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
```


## Frontend

### Build React APP


Goto `app/frontend`

Check the contract address, must point to the BSC testnet contract:

1. In `./packages/contracts/src/addresses.js` at the bottom of the file where
it says `const addresses = networksAndAddresses.hardhat`, replace "hardhat" with "bsctestnet" and check the contract
addresses that are defined in the same file.

Those should match the deployment we did earlier:
```
  bsctestnet: {
    network: "Binance Testnet",
    tokenNetwork: {
      address: "0x4FB55d1D6Aab976d527dD5C9700d73b20f155A07", // deployed 2022-05-04
    },
    carbonTracker: {
      address: "0x00fb3250af0eA88ba9279E3bBa7dF5b6Af6E6573", // deployed 2022-05-04
    },
    dao: {
      governor: {
        address: "0xeb6b1516471b49f508DBE0d989dC5147e96942a4", // deployed 2022-05-04
      },
      daoToken: {
        address: "0x0f3e1c1E898576C2515d07580284d3caDACFBb5f", // deployed 2022-05-04
      }
    }
  },
```

2. Setup the `.env`, make sure to setup the Google credentials:
```
REACT_APP_API_BASE='https://emissionstokens.opentaps.org/api'
REACT_APP_GOOGLE_MAPS_API_KEY=
```

3. Now build it:
```
npm run react-app:build
```

4. Copy the build to the served directory:
```
rm -rf /var/www/html/emissionstokens.opentaps.org/*
cp -af ./packages/react-app/build/* /var/www/html/emissionstokens.opentaps.org/
```


