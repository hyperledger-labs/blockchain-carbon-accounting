# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) use case.

Loading the Data
================

You will need to use Amazon DynamoDB to load the utility emissions factor data.  Set up an Amazon AWS account with DynamoDB access.  Then follow the 
steps in ``egrid-data-loader/README.md``

Running the Code
================

Create a file in `chaincode/node/lib/aws-config.js` and paste your credentials there::
    exports.AWS_ACCESS_KEY_ID = 'your_access_key';
    exports.AWS_SECRET_ACCESS_KEY = 'your_secret_key';

Follow the steps in ``docker-compose-setup/README.md``
 
 
