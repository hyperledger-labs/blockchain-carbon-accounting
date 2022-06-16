# Vault Identity Management

Server exposing endpoint for clients to manage their vault identity. Each client is represented a identity inside vault with certain policy rule placed on them. Using this server two type identity can be created.

- Client : Has access to managing one transit key.
- Manager : Identity responsible for create `client's` identity.

- [Vault Identity Management](#vault-identity-management)
  - [Setup](#setup)
    - [For Development](#for-development)
  - [Using Vault](#using-vault)
  - [Using the Vault API](#using-the-vault-api)
    - [Start Server](#start-server)
    - [Accessing the Vault REST API](#accessing-the-vault-rest-api)
    - [API Endpoints](#api-endpoints)

## Setup


Steps required before running the server.

- Create Policy for `client` and `manager` identity.
- policy file can be found in `hcl` folder.

### For Development

A quick setup for development purpose:

- Install: `npm install`
- Start vault server - This is usually already started by `startApi.sh` in `fabric/docker-compose-setup/scripts/`, but if you don't see a vault docker container running, then : `npm run vault`
- Setup : `npm run test:setup`

## Using Vault

Vault is accessed through a REST API for Vault.  The process is to use Vault to generate a token and a Transit engine public key for a user, and then use that token in the Fabric application.  The Fabric application's typescript REST API will check Vault for the Transit engine public key to match against the token.  If successful, it will allow the user to access operations in Fabric.

## Using the Vault API

### Start Server

- `npm run build`
- `npm run start`

### Accessing the Vault REST API

Go to <http://localhost:9090/api-docs/>

Click on the "Authorize" button

Set the admin user's authorization token, which by default is set by `npm run test:setup` to `tokenId`, to get started the first time.  Then later, when you have a token for another user, you can use it to authorize Vault.

### API Endpoints

1. Create a Manager Identity: use `POST api/v1/identity`

Input :

```json
{
  "username": "admin",
  "identity_type": "MANAGER"
}
```

Sample output :

```json
{
  "username": "admin",
  "password": "0a7ee66709d7c9c445dfcb008ca87b99"
}
```

2. Generate Token from the user/password above: use `POST api/v1/token`

Input :

- `username` : of the client
- `password` : of the client

Output :

```json
{
  "token": "s.umh6gwaN1n7XN1rMVFkYaSM0"
}
```

3. Update Password : use : `PATCH api/v1/identity`

Input :

- `new_password`

4. Create a Client

Only Manager can create a client

use Endpoint : `POST api/v1/identity`


Input :

```json
{
  "username": "client1",
  "identity_type": "CLIENT"
}
```

Output :

```json
{
  "username": "client1",
  "password": "acf7716e327947a9da503c5c02d20451"
}
```

5. Create a New Transit Key : use `POST api/v1/key`

Input :

- kty : key type, two options
  - ecdsa-p256
  - ecdsa-p384

After you create a Transit key, it will be available for use.  You don't have to write down the key yourself to pass around to Fabric later.

6. Get Transit Key Details : use `GET api/v1/key`

Output :

```json
{
  "version": 1,
  "ktyp": "P-384",
  "pub_key": "-----BEGIN PUBLIC KEY-----\nMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEZIkOzWxOWaJk8eTxlabiFXhv63TJPDcu\nxw2yz4LhoRM78yt8OLC/DzmchdFGNCAlvxD+Wa28syo0bE7/bsd73bqYNtu6GIwV\n7A9Y7HOReFtpLm+yIUCZhz0QzgkvtxEy\n-----END PUBLIC KEY-----\n",
  "creation_time": "2021-10-20T18:41:06.649564329Z"
}
```

7. Rotate transit key : use `PATCH api/v1/key`

This endpoint will rotate private key and will use generated private key

8. Put Ethereum Key as secret kv : use `POST /api/v1/secrets/eth`

Curl :

```bash
curl -X 'POST' \
  'http://localhost:9090/api/v1/secrets/eth' \
  -H 'accept: */*' \
  -H 'address: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' \
  -H 'private: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' \
  -H 'Authorization: Bearer s.dmbytRRkVpAuHYJopa5dl0bw' \
  -d ''
```

9. Get Ethereum Key : use `GET /api/v1/secrets/eth`
10. Delete Ethereum Key : use `DELETE /api/v1/secrets/eth`
