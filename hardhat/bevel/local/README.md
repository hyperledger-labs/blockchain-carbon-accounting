# Besu Network deployment using bevel locally

## Prerequsites
1. Docker
2. hashicorp vault 
3. Kind 

## Setting up cluster locally
Creating a kubernetes cluster using kind
```
kind create cluster --image=kindest/node:v1.22.15 --config=kind.yaml
```
Export kubeconfig
```
kind get kubeconfig > config
```

## Deploying besu network
1. Fork and clone the bevel repository 
```
git clone https://github.com/username/bevel.git
```
2. Create build folder in the root of cloned bevel repository
3. Place the network.yaml and config file inside the build folder
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
7. Delete the network - (This will destory the deployed network)
```
./reset.sh
```

## Network Endpoint
the proxy type for local setup need to be set to `none` then besu network can be reached via port-forwarding one of the validator node

## Port forwarding the validator node
In a new terminal window run the below command to port-forward the validator node to your local machine
```
kubectl port-forward -n supplychain-bes svc/validator1-0 8545
```

## Connecting metamask
1. Add a new network in the metamask
2. Pass the `http://localhost:8545` as RPC URL
3. ChainID = 2018
