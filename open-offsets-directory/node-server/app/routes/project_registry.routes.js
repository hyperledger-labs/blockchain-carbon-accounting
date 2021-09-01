module.exports = (app) => {
  const registries = require("../controllers/project_registry.controller.js");

  var router = require("express").Router();

  // Retrieve all registries
  router.get("/", registries.findAll);

  // Retrieve a single registry with id
  router.get("/:id", registries.findOne);

  app.use("/api/registries", router);
};
