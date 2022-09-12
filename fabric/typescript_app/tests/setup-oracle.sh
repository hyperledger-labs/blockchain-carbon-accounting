echo "=== [tests/setup-oracle] run oracle connected to blockchain-carbon-accounting-test pg db in docker container"
sh ../docker-compose-setup/scripts/startOracle.sh "carbonAccounting" "./tests/.oracle.env" "-e DB_HOST=postgres"
