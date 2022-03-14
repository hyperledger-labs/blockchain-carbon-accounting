# Setup

Run `npm install`.

Copy the `.env` from the parent directory `supply-chain` here.
Note the `PORT` key is to setup the API server port, by default it will use port 5000.

Run `npm run dev`.


## Usage

API endpoint is `http://127.0.0.1:5000/issue` and accepts POST methods only.

Parameters:

* input: required FILE, the JSON file that describes the activities to process.
* issuee: required TEXT, the address of the account to issue the tokens to.
* keys: FILE, the public key to use when encrypting the IPFS metadata (can give multiple keys).
* verbose: optional TEXT, set to 'true' to have a more verbose response when issuing tokens.
* pretend: optional TEXT, set to 'true' if you do not wish to actually issue tokens but see the whole calculated values for each activity.


