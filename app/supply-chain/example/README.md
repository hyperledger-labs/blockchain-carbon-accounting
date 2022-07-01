# Tokenize Shipping Emissions Example

The scripts here implement two examples of tokenizing shipments' emissions.  

In the first example, we integrate with an ERP system which has the shipping records for orders.  It is designed to work with the [opentaps Open Source ERP + CRM](https://github.com/opentaps/opentaps-1) and should also work with [Apache OFBiz](https://ofbiz.apache.org/).  It will get all the shipments in a Facility (a warehouse)'s `shipment_route_segment` table and submit either the UPS tracking numbers or the shipment origin, destination, weight, and service information to be tokenized.  It will record the token ID or any error messages.

In the second example, we integrate with records from [UPS Quantum View](https://www.ups.com/co/en/tracking/quantum-view.page).  Quantum View provides details about UPS shipments in several tables.  We are using the `Delivery` table to get tracking numbers to be tokenized.  

In both cases, we have the shipping data in the same PostgreSQL database, but they do not have to be.  Quantum View is a UPS service and not related to OFBiz or opentaps.  It could be a separate subscription that is stored in a different database than your main ERP system.  If that is the case, then configure the database to the one where your Quantum View data is stored.

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

Make sure all the following are running:
- All required applications should be running, see [Getting Started](../../../Getting_Started.md).
- The `supply-chain/api` REST API must be running 

Then you can tokenize the shipments in OFBiz/opentaps database using:
```
python tokenize-ofbiz.py issue --from_date "2022-01-01 00:00:01" \
--thru_date "2022-01-02 23:59:59" \
--facility_id "<ofbiz-facility-id>" \
--issued_to "0x<issuee-wallet-address>"
```

Or for Quantum View records:
```
python tokenize-upsqv.py issue --from_date "2022-01-29 00:00:01" \
--thru_date "2022-01-29 23:59:59" \
--issued_to "0x<issuee-wallet-address>"
```
