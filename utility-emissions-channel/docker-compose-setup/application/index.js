const express = require("express");
const bodyParser = require('body-parser')
const chalk = require("chalk");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
require('dotenv').config();
const { log } = require("./src/utils/log");
const { registerUser } = require("./src/blockchain-gateway/utilityEmissionsChannel/registerEnroll");

const app = express();

const PORT = process.env.PORT || 9000;

// parse application/json
app.use(bodyParser.json());
// Swagger Document
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


/**
 * HTTP CONNECTION
 */
app.listen(PORT, function () {
    console.clear();
    console.log(
        `++++++++++++++++ Hyperledger CA2 SIG /// Carbon Accouncting API ++++++++++++++++`
    );
    console.log(`++ REST API PORT : ${chalk.cyanBright(PORT)}`);
    console.log(`++ ACCESS SWAGGER : ${chalk.cyanBright("http://localhost:9000/api-docs/")}`)
    console.log(
        `++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`
    );
});

// Something to test connection?? e.g. Query current block number?

/**
 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * R E S T  A P I - V 1.0 ---> ROUTERS
 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

app.use(require('./src/routers/utilityEmissionsChannel/ivokeEmissionscontract.v0.js'));
app.use(require('./src/routers/utilityEmissionsChannel/registerEnroll.v0.js'))