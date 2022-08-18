#!/bin/bash
kubectl apply -f dashboard-adminuser.yaml

echo ""
echo "token :"

kubectl -n kubernetes-dashboard create token admin-user

echo ""
echo "now you can access dashboard at http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"