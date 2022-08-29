# Setup


Create database:
```
createdb blockchain-carbon-accounting
```

In the repository root directory copy `.env.SAMPLE` to `.env` and fill in the configuraiton set up:
- Your PostgreSQL host, port, username, and password.
- The Google API key for the [Google DistanceMatrix API](https://developers.google.com/maps/documentation/distance-matrix/overview) and [Google Geocode API](https://developers.google.com/maps/documentation/geocoding/overview), if you have them.  Otherwise for testing, we'll generate random distances for you.
- If you have access to the [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US), your UPS username, password, and access key.
- Email sending parameters.
- Smart contract addresses.


Install ipfs and run:
```
ipfs daemon --enable-pubsub-experiment
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
```

Make sure you're using node version 16.  Check it with this command in every terminal:
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
```

Then follow the steps in [data/README.md](data/README.md) to set up your database.

