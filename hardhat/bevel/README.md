# Besu Network deployment using bevel

## Prerequsites
1. Docker
2. hashicorp vault 

## Deploying besu network
1. Fork and clone the bevel repository 
```
git clone https://github.com/username/bevel.git
```
2. Create build folder in the root of cloned bevel repository
3. Place the network.yaml and kubeconfig file inside the build folder
4. Adjust the properties in the network.yaml like `network.docker.username`, `network.docker.password`, `network.proxy.type`, `network.organizations.cloud_provider`, `network.organizations.k8s`,`network.organizations.vault` , `network.organizations.gitops`, etc

5. Start the bevel client container
```
cd bevel
docker run -it -v $(pwd):/home/bevel/ --network="host" ghcr.io/hyperledger/bevel-build:latest bash
```
6. Deploy the network using run.sh script
```
./run.sh
```
7. Delete the network
```
./reset.sh
```

## Network Endpoint
The network endpoint is the http endpoint to reach the network. If the besu network is deployed with proxy type as `ambassador` in that case we can have the FQDN that can be access from outside the cluster, but if the proxy type is set to `none` then besu network can be reached via port-forwarding one of the validator node

## Connecting metamask
1. Add a new network in the metamask
2. Pass the Network Endpoint as RPC URL
3. ChainID = 2018
