#!/bin/bash
NAMESPACE=test

export PORT=30100

# create service
kubectl delete -f ./services/newyo-service.yaml --namespace=${NAMESPACE}


# apply deployment
kubectl delete -f ./deployments/newyo-deployment.yaml --namespace=${NAMESPACE}
