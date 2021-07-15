module.exports = (app) => {
  const issuances = require("../controllers/issuance.controller.js");

  var router = require("express").Router();

  // Retrieve all issuances
  router.get("/", issuances.findAll);

  // Retrieve a single issuance with id
  router.get("/:id", issuances.findOne);

  app.use("/api/issuances", router);
};
