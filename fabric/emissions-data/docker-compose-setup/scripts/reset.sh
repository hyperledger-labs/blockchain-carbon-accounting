./network.sh down
./network.sh resetAllData
echo "Pruning volumes..."
yes "y" | docker volume prune
echo "Removing build under typescript_app/dist..."
rm -R ../typescript_app/dist
rm chaincode*_log.txt
