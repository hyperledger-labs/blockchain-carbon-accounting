# Setup

-----------------------
Install PostgreSQL
-----------------------
Step 1 — Installing PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql.service

sudo -i -u postgres
psql

Create database:
```
createdb blockchain-carbon-accounting
```

In the repository root directory copy `.env.SAMPLE` to `.env` and fill in the configuraiton set up:
- Your PostgreSQL host, port, username, and password.
- The Google API key for the [Google DistanceMatrix API](https://developers.google.com/maps/documentation/distance-matrix/overview) and [Google Geocode API](https://developers.google.com/maps/documentation/geocoding/overview).
- If you have access to the [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US), your UPS username, password, and access key.
- Email sending parameters.
- Smart contract addresses.


Install ipfs and run:
```
Download the Linux binary from dist.ipfs.io (opens new window).

wget https://dist.ipfs.io/go-ipfs/v0.13.1/go-ipfs_v0.13.1_linux-amd64.tar.gz

Unzip the file:
tar -xvzf go-ipfs_v0.13.1_linux-amd64.tar.gz

cd go-ipfs
sudo bash install.sh

> Moved ./ipfs to /usr/local/bin
Test that IPFS has installed correctly:

ipfs --version
> ipfs version 0.13.1

ipfs init
ipfs cat /ipfs/QP..../readme
```
ipfs daemon --enable-pubsub-experiment
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
```

Make sure you're using node version 16.  Check it with this command in every terminal:
Install nvm on Ubuntu
---------------------
sudo apt install curl 
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash

to activate path
source ~/.bashrc

Install Node
---------------------
To Install latest node
nvm install node
nvm ls
nvm ls-remote
nvm install v16.16.0
nvm use v16.16.0

```
node -v
```

If it's not switch to node version 16
```
nvm use 16
```

In the repository root directory run:

```
npm run clean:nodemodules
npm install
npm run loadSeeds
```
