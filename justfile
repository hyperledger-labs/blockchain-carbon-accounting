_list:
	@just --list

# list the available updates for all the npm dependencies
ncu *ARGS:
  just ncu-ood {{ARGS}}
  just ncu-data-loader {{ARGS}}
  just ncu-supply-chain {{ARGS}}
  just ncu-net {{ARGS}}
  just ncu-frontend {{ARGS}}
  just ncu-api-server {{ARGS}}

# apply the available updates for all the npm dependencies, changing the package.json files
ncu-update *ARGS:
  just ncu-ood "-u" {{ARGS}}
  just ncu-data-loader "-u" {{ARGS}}
  just ncu-supply-chain "-u" {{ARGS}}
  just ncu-net "-u" {{ARGS}}
  just ncu-frontend "-u" {{ARGS}}
  just ncu-api-server "-u" {{ARGS}}

ncu-net *ARGS:
	@echo "\n** Checking dependencies updates for hardhat"
	@echo "------------------------------------------------------------------"
	ncu --packageFile 'hardhat/package.json' -x ipfsd-ctl,ipfs-http-client {{ARGS}}

ncu-api-server *ARGS:
	@echo "\n** Checking dependencies updates for api-server in app/api-server/"
	@echo "--------------------------------------------------------------------------------------------"
	ncu --packageFile 'app/api-server/package.json' {{ARGS}}

ncu-frontend *ARGS:
	@echo "\n** Checking dependencies updates for react dapp in app/frontend/"
	@echo "-------------------------------------------------------------------------------------------"
	ncu --packageFile 'app/frontend/**/package.json' -x ipfs-http-client {{ARGS}}

ncu-supply-chain *ARGS:
	@echo "\n** Checking dependencies updates for supply-chain"
	@echo "---------------------------------------------------"
	ncu --packageFile 'app/supply-chain*/package.json' -x ipfs-http-client {{ARGS}}

ncu-data-loader *ARGS:
	@echo "\n** Checking dependencies updates for data-loader"
	@echo "--------------------------------------------------"
	ncu --packageFile 'data/package.json' {{ARGS}}

ncu-ood *ARGS:
	@echo "\n** Checking dependencies updates for open-offsets-directory"
	@echo "--------------------------------------------------"
	ncu --packageFile 'open-offsets-directory/*/package.json' {{ARGS}}

# Start the supply-chain api server
supply-chain-api:
	npm run supply-chain:api

# Start the api-server
api-server:
	npm run api-server 

# Start the react-app frontend
frontend:
	npm run frontend-https

frontend-build:
	cd app/frontend/react-app && npm run build

# Start the ipfs daemon
ipfs:
	ipfs daemon


# run npm install for all the modules
npm:
	npm install

# Process pending audit requests
process-requests:
	npm run supply-chain:cli:processrequests

# Run the app update and deploy script
update-deploy:
	./app/scripts/update_emissions_tokens_apps.sh

# Start the hardhat backend
hardhat:
	cd hardhat && npx hardhat node

# Setup roles and example token transfers for hardhat demo accounts
hardhat-setup:
	npm run hardhat-setup

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
	cd hardhat && npx hardhat test {{TESTS}}

