_list:
	@just --list

# list the available updates for all the npm dependencies
ncu: ncu-data ncu-supply-chain ncu-net ncu-net-interface ncu-api-server

# apply the available updates for all the npm dependencies, changing the package.json files
ncu-update: (ncu-data "-u") (ncu-supply-chain "-u") (ncu-net "-u") (ncu-net-interface "-u") (ncu-api-server "-u")

ncu-net update='':
	@echo "\n** Checking dependencies updates for net-emissions-token-network"
	@echo "------------------------------------------------------------------"
	ncu --packageFile 'net-emissions-token-network/package.json' -x ipfsd-ctl {{update}}

ncu-api-server update='':
	@echo "\n** Checking dependencies updates for api-server in net-emissions-token-network/api-server/"
	@echo "--------------------------------------------------------------------------------------------"
	ncu --packageFile 'net-emissions-token-network/api-server/package.json' {{update}}

ncu-net-interface update='':
	@echo "\n** Checking dependencies updates for react dapp in net-emissions-token-network/interface/"
	@echo "-------------------------------------------------------------------------------------------"
	ncu --packageFile 'net-emissions-token-network/interface/**/package.json' -x @project/contracts {{update}}

ncu-supply-chain update='':
	@echo "\n** Checking dependencies updates for supply-chain"
	@echo "---------------------------------------------------"
	ncu --packageFile 'supply-chain/**/package.json' -x supply-chain-lib {{update}}

ncu-data update='':
	@echo "\n** Checking dependencies updates for data"
	@echo "-------------------------------------------"
	ncu --packageFile 'data/**/package.json' {{update}}


# run npm install for all the modules
npm: npm-data npm-supply-chain npm-net npm-net-interface npm-api-server

npm-net:
	@echo "\n** Installing dependencies updates for net-emissions-token-network"
	@echo "------------------------------------------------------------------"
	npm --prefix 'net-emissions-token-network' install

npm-api-server:
	@echo "\n** Installing dependencies updates for api-server in net-emissions-token-network/api-server/"
	@echo "--------------------------------------------------------------------------------------------"
	npm --prefix 'net-emissions-token-network/api-server' install

npm-net-interface:
	@echo "\n** Installing dependencies updates for react dapp in net-emissions-token-network/interface/"
	@echo "-------------------------------------------------------------------------------------------"
	npm --prefix 'net-emissions-token-network/interface' install

npm-supply-chain:
	@echo "\n** Installing dependencies updates for supply-chain"
	@echo "---------------------------------------------------"
	npm --prefix 'supply-chain' install

npm-data:
	@echo "\n** Installing dependencies updates for data"
	@echo "-------------------------------------------"
	npm --prefix 'data' install

# Process pending audit requests
process-requests:
	npm --prefix supply-chain run cli -- -processrequests

# Run the app update and deploy script
update-deploy:
	./net-emissions-token-network/scripts/update_emissions_tokens_apps.sh

# Run hardhat tests
hardhat-test *TESTS:
	# check if ipfs is running with pgrep then kill it
	@if pgrep ipfs; then \
		pkill ipfs; \
	fi
	# check if hardhat is running with pgrep then kill it
	@if pgrep hardhat; then \
		pkill hardhat; \
	fi
	# run hardhat tests
	cd net-emissions-token-network && npx hardhat test {{TESTS}}

