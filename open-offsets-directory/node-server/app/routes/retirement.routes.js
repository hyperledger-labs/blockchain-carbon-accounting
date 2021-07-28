module.exports = (app) => {
  const retirements = require("../controllers/retirement.controller.js");

  var router = require("express").Router();

  // Retrieve all retirements
  router.get("/", retirements.findAll);

  // Retrieve a single retirement with id
  router.get("/:id", retirements.findOne);

  app.use("/api/retirements", router);
};
