#!/bin/bash

echo "Removing node modules..."
rm -rf ./node_modules

echo "Updating npm..."
npm update

echo "Installing node modules..."
npm install

echo "Installing nodemon..."
npm install -g nodemon

echo "Installing serverless..."
npm install -g serverless

echo "Installing typescript..."
npm install -g typescript

echo "Installing mocha..."
npm install -g mocha

echo "Adding package.json..."
node ./package.json .

echo "Adding tsconfig.json..."
node ./tsconfig.json .

echo "Starting REST API Server ..."
sh start.sh

