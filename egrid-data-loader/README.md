# egrid-data-loader

This project imports the Data from https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip into a local CouchDB.


Requirements
============

You must have a CouchDB running locally and know the username and passord setup in local.ini

Install the dependencies with `npm`::

    $ npm install


Running the Code
================

Initialize the database::  

    $ node index.js initdb -u <couchdb_username> -p <couchdb_password>

Downalod and extract the data from https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip, for example::

    $ wget https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip
    $ unzip egrid2018_all_files.zip

Load data from the XLSX files, for now only this one is supported::

    $ node index.js load eGRID2018_Data_v2.xlsx NRL18 -u <couchdb_username> -p <couchdb_password>

See the data that was loaded in CouchDB::

    $ node index.js list -u <couchdb_username> -p <couchdb_password>

