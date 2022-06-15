#!/bin/bash

echo "Deleting deployments ..."
kubectl delete -f ./fabric-peer-deployment.yaml -n fabric-production
kubectl delete -f ./fabric-orderer-deployment.yaml -n fabric-production
kubectl delete -f ./fabric-ca-deployment.yaml -n fabric-production
kubectl delete cm --all -n fabric-production
kubectl delete secrets --all -n fabric-production