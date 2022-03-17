# Tokenize Shipping Emissions Example

### Install Requirements and configure python scripts

Create the virtualenv
```
python3 -m venv venv
source venv/bin/activate
```

Install requirements
```
pip install -r requirements.txt
```

Set database credentials in the config.py.

### Run all required applications

```
cd net-emissions-token-network
npx hardhat node --show-accounts
```

in other terminal
```
cd net-emissions-token-network
npx hardhat setTestAccountRoles --network localhost --contract 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
```

run ipfs service

run rest api
```
cd supply-chain/interface
npm run dev
```

tokenize script parameters example
```
python tokenize-ofbiz.py --from_date "2022-01-01 00:00:01" \
--thru_date "2022-01-02 23:59:59" \
--facility_id "GSWarehouse" \
--pubkey ../user1-public.pem \
--issuee "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
```
