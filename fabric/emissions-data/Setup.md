# Setup Guide For Utility Emissions

- [Setup Guide For Utility Emissions](#setup-guide-for-utility-emissions)
  - [Introduction](#introduction)
  - [Fabric Network](#fabric-network)
  - [API Server](#api-server)
    - [API Server Configurations](#api-server-configurations)
  - [Vault Setup](#vault-setup)
  - [API endpoints](#api-endpoints)
    - [When Using Vault Signing](#when-using-vault-signing)

## Introduction

This is a deployment guide for a auditor organizations, wanting to participate in utility emissions channel. Organizations will have to setup blockchain network (HL fabric) and api server which connects with blockchain network and exposes endpoints for clients to execute transitions.

## Fabric Network

Refer `multi-cloud-deployment` folder deployment of fabric network on cloud using Kubernetes.

## API Server

### API Server Configurations

API server has multiple configurations parameters which need be configured before starting the server

- Application : basic configuration about the server
  - APP_PORT : port number on which server will be running
  - APP_LOG_LEVEL : log level for the applications, supports DEBUG | INFO | ERROR
  - LEDGER_LOG_LEVEL : log level for the blockchain transitions, supports DEBUG | INFO | ERROR
- Vault KV : require for storing client's certificates and secret (like ethereum private key)
  - VAULT_ENDPOINT : vault api endpoint
  - VAULT_TOKEN : vault token having minimal capability to manage client's certificates stored vault as key value.
  - VAULT_KV_MOUNT_PATH : key value storage path
- Ethereum
  - LEDGER_ETH_JSON_RPC_URL : rpc url of a ethereum node
  - LEDGER_ETH_NETWORK : name of the ethereum network, options
    - hardhat : for local hardhat ethereum node
    - goerli : for goerli test network
    - ropsten : for ropsten test network
  - LEDGER_ETH_TX_SIGNER : define eth tx signing method to be used
    - plain : client has to send their ethereum private key inside header of the request
    - kv : client stores their ethereum private key inside vault as key-value pair and server fetches when request is made by the client. [NOTE : In terms of security both the options are equally un-secure.]
- Data storage : off chain data storage for storing data related to an emission record.
  - AWS_ACCESS_KEY_ID : access id for the aws.
  - AWS_SECRET_ACCESS_KEY : aws secret
  - BUCKET_NAME : s3 bucket name
- HL Fabric : for connecting with the fabric network
  - LEDGER_FABRIC_AS_LOCALHOST : should be false, for the production environment
  - LEDGER_FABRIC_CCP : path to org's connection profile
  - LEDGER_FABRIC_ORG_CA : name of the org's ca.
  - LEDGER_FABRIC_ORG_MSP : org's msp id
  - LEDGER_FABRIC_TX_SIGNER_TYPES : defines fabric tx signing method to be used, provide list of options separated with space
    - vault : sign fabric tx with key stored as transit in vault server.
      - LEDGER_FABRIC_TX_SIGNER_VAULT_MOUNT : transit key path inside vault server, required in case of vault signing support

Sample API configuration can be found as env file : `fabric/emissions-data/typescript_app/.env`

## Vault Setup

vault server is essentially for string api server, even if `vault` fabric tx signing method is disabled. As client's certificate are stored inside vault server.

Vault Server Deployment approaches

- for development and testing [NOTE : DO NOT USE THIS IN PRODUCTION] : `docker run --rm --name vault -d --cap-add=IPC_LOCK -p 8200:8200 -e 'VAULT_DEV_ROOT_TOKEN_ID=tokenId' -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' vault`
- Kubernetes Deployment : `fabric/emissions-data/minikube-setup/README.md`

Configuration for API Server

- Log in into vault ui with root token (generated during Initialization of vault server)
- Mount key-value secret engine at `VAULT_KV_MOUNT_PATH`.
- if `LEDGER_FABRIC_TX_SIGNER_TYPES` contains `vault`, mount transit secret engine at `LEDGER_FABRIC_TX_SIGNER_VAULT_MOUNT`

## API endpoints

### When Using Vault Signing

1. Create transit key for org's registrar under the path `LEDGER_FABRIC_TX_SIGNER_VAULT_MOUNT` with label register username. [USE Vault-UI or Custom Identity Application]
2. Using vault Token, execute `POST api/v1/emissions-data/registerEnroll/enroll`.
3. Using vault Token, execute `POST api/v1/emissions-data/registerEnroll/register?userId=admin`, for registering a new client.
