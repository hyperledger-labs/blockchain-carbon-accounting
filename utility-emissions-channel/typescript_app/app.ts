import express from "express";
import bodyParser from "body-parser";
import chalk from "chalk";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import { router as emissions_router } from "./src/routers/utilityEmissionsChannel/ivokeEmissionscontract.v0";
import { router as register_enroll_router } from "./src/routers/utilityEmissionsChannel/registerEnroll.v0.js";
import multer from "multer";

// require('dotenv').config();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 9000;

// parse application/json, allow forms and uploads
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.single("emissionsDoc"));
app.use(express.static("public"));

// Swagger Document
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * HTTP CONNECTION
 */
app.listen(PORT, function() {
  console.clear();
  console.log(`++++++++++++++++ Hyperledger CA2 SIG /// Carbon Accouncting API ++++++++++++++++`);
  console.log(`++ REST API PORT : ${chalk.cyanBright(PORT)}`);
  console.log(`++ ACCESS SWAGGER : ${chalk.cyanBright("http://localhost:9000/api-docs/")}`);
  console.log(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
});

// Something to test connection?? e.g. Query current block number?

/**
 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * R E S T  A P I - V 1.0 ---> ROUTERS
 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

app.use(register_enroll_router);
app.use(emissions_router);
