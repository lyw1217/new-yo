#!/bin/bash
NAMESPACE=test

export PORT=30100

# create service
kubectl create -f ./services/newyo-service.yaml --namespace=${NAMESPACE}


# apply deployment
kubectl apply -f ./deployments/newyo-deployment.yaml --namespace=${NAMESPACE}
