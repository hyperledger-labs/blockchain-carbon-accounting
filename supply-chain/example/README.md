# Tokenize Shipping Emissions Example

The scripts here implement two examples of tokenizing shipments' emissions.  

In the first example, we integrate with an ERP system which has the shipping records for orders.  It is designed to work with the [opentaps Open Source ERP + CRM](https://github.com/opentaps/opentaps-1) and should also work with [Apache OFBiz](https://ofbiz.apache.org/).  It will get all the shipments in a Facility (a warehouse)'s `shipment_route_segment` table and submit either the UPS tracking numbers or the shipment origin, destination, weight, and service information to be tokenized.  It will record the token ID or any error messages.

In the second example, we integrate with records from [UPS Quantum View](https://www.ups.com/co/en/tracking/quantum-view.page).  Quantum View provides details about UPS shipments in several tables.  We are using the `Delivery` table to get tracking numbers to be tokenized.

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

Set your OFBiz/opentaps or Quantum View database credentials in `config.py`.

Create a new table using sql/create_table.sql

### Run all required applications

Make sure all of the following are running:
- The emissions tokens contracts must be running on a network which is configured in your `supply-chain/.env` file.  The issuer must have the role of Emissions Auditor.
- You have generated a public/private key based on the instructions in [`supply-chain/README.md`](../README.md)
- IPFS daemon must be running
- The `supply-chain/interface` REST API must be running 

Then you can tokenize the shipments in OFBiz/opentaps database using:
```
python tokenize-ofbiz.py --from_date "2022-01-01 00:00:01" \
--thru_date "2022-01-02 23:59:59" \
--facility_id "<ofbiz-facility-id>" \
--pubkey ../user1-public.pem \
--issuee "0x<issuee-wallet-address>"
```

Or for Quantum View records:
```
python tokenize-upsqv.py --from_date "2022-01-29 00:00:01" \
--thru_date "2022-01-29 23:59:59" \
--pubkey ../user1-public.pem \
--issuee "0x<issuee-wallet-address>"
```
