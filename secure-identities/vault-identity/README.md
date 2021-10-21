# Vault Identity Management

Server exposing endpoint for clients to manage their vault identity. Each client is represented a identity inside vault with certain policy rule placed on them. Using this server two type identity can be created.

- Client : Has access to managing one transit key.
- Manager : Identity responsible for create `client's` identity.

- [Vault Identity Management](#vault-identity-management)
  - [Setup](#setup)
    - [For Development](#for-development)
  - [Server](#server)
  - [Working With Endpoints](#working-with-endpoints)

## Setup


Steps required before running the server.

- Create Policy for `client` and `manager` identity.
- policy file can be found in `hcl` folder.

### For Development

A quick setup for development purpose:

- Start vault server : `npm run vault`
- Setup : `npm run test:setup`

## Server

Start Server

- `npm run build`
- `npm run start`


Swagger UI : <http://localhost:9090/api-docs/>

## Working With Endpoints

1. Create a Manager Identity : use `POST api/v1/identity`

Set Authorizations token as : `tokenId`

Input :

```json
{
  "username": "admin",
  "identity_type": "MANAGER"
}
```

Output :

```json
{
  "username": "admin",
  "password": "0a7ee66709d7c9c445dfcb008ca87b99"
}
```

2. Generate Token From user/pass : use `POST api/v1/token`

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