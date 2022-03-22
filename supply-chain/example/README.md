# Tokenize Shipping Emissions Example

This script implements an example of integrating the supply-chain application with an ERP system which has the shipping records for orders.  It is designed to work wih the [opentaps Open Source ERP + CRM](https://github.com/opentaps/opentaps-1) and should also work with [Apache OFBiz](https://ofbiz.apache.org/).  It will get all the shipments in a Facility (a warehouse) with UPS tracking numbers, tokenize them, and record the token ID or any error messages.

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

Set your OFBiz/opentaps database credentials in `config.py`.

Create a new table using sql/create_table.sql

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
--facility_id "<your-facility-id>" \
--pubkey ../user1-public.pem \
--issuee "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
```
