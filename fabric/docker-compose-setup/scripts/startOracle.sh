if docker container ls -n 1 | grep 'oracle'; then
echo "=== [tests/setup-oracle] Remove existing oracle container. Temporary fix for testing."
#RED='\033[0;31m'
#bold=$(tput bold)
#NC='\033[0m' # No Color
#normal=$(tput sgr0)
#echo "${bold}${RED}After testing run sh ./scripts/startOracle carbonAccouting '.oracle.env' to restart container connected to local postgres DB instance ${NC} ${normal} "
echo "=== [tests/setup-oracle] stopping ..." & docker kill oracle
echo "=== [tests/setup-oracle] removing ... " & docker rm oracle
fi

echo "=== [scripts/startOracle] starting oracle container"  
docker run -p 3002:3002 --name oracle -d --env-file $2 $3 ghcr.io/net-zero-project/blockchain-carbon-accounting/oracle-api:latest
docker network connect $1 oracle