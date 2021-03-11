# aws-kubernetes

Deploy utility-emissions-channel app to aws kubernetes

## Create typescript_app Docker image

Run build from utility-emissions-channel directory

    $ docker build -t krybalko/utilityemissions-api:0.0.1 -f aws-kubernetes/Dockerfile .
    $ docker image push krybalko/utilityemissions-api:0.0.1

## Deploy api application Docker image to kubernetes cluster

Create connection config json

    $ cd utility-emissions-channel/aws-kubernetes/ccp-generate
    $ ./ccp-generate.sh

Create ConfigMap from connection config json

    $ cd utility-emissions-channel/aws-kubernetes
    $ kubectl create configmap utilityemissions-api-config --from-file=connection-opentaps.json -n fabric-production

Deploy api application

    $ kubectl apply -f ./utilityemissions-api-deployment.yaml -n fabric-production
    $ kubectl apply -f ./ingress-app.yaml -n fabric-production

