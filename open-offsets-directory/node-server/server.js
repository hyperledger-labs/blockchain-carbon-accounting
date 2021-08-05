const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

var corsOptions = {
  origin: "http://localhost:8081",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// to use sequelize to generate the models ? but we already have a schema script
// so disable this for now ..
//const db = require("./app/models");
//db.sequelize.sync();

// simple route
app.get("/api/", (req, res) => {
  res.json({ message: "Voluntary Carbon Offsets Directory." });
});

require("./app/routes/project.routes")(app);
require("./app/routes/project_registry.routes")(app);
require("./app/routes/project_rating.routes")(app);
require("./app/routes/issuance.routes")(app);
require("./app/routes/retirement.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
