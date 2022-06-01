_list:
	@just --list

# list the available updates for all the npm dependencies
ncu *ARGS:
  just ncu-data {{ARGS}}
  just ncu-supply-chain {{ARGS}}
  just ncu-net {{ARGS}}
  just ncu-net-interface {{ARGS}}
  just ncu-api-server {{ARGS}}

# apply the available updates for all the npm dependencies, changing the package.json files
ncu-update *ARGS:
  just ncu-data "-u" {{ARGS}}
  just ncu-supply-chain "-u" {{ARGS}}
  just ncu-net "-u" {{ARGS}}
  just ncu-net-interface "-u" {{ARGS}}
  just ncu-api-server "-u" {{ARGS}}

ncu-net *ARGS:
	@echo "\n** Checking dependencies updates for net-emissions-token-network"
	@echo "------------------------------------------------------------------"
	ncu --packageFile 'net-emissions-token-network/package.json' -x ipfsd-ctl,ipfs-http-client {{ARGS}}

ncu-api-server *ARGS:
	@echo "\n** Checking dependencies updates for api-server in net-emissions-token-network/api-server/"
	@echo "--------------------------------------------------------------------------------------------"
	ncu --packageFile 'net-emissions-token-network/api-server/package.json' {{ARGS}}

ncu-net-interface *ARGS:
	@echo "\n** Checking dependencies updates for react dapp in net-emissions-token-network/interface/"
	@echo "-------------------------------------------------------------------------------------------"
	ncu --packageFile 'net-emissions-token-network/interface/**/package.json' -x ipfs-http-client {{update}}

ncu-supply-chain *ARGS:
	@echo "\n** Checking dependencies updates for supply-chain"
	@echo "---------------------------------------------------"
	ncu --packageFile 'supply-chain/**/package.json' -x ipfs-http-client {{ARGS}}

ncu-data *ARGS:
	@echo "\n** Checking dependencies updates for data"
	@echo "-------------------------------------------"
	ncu --packageFile 'data/**/package.json' {{ARGS}}


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

