module.exports = (app) => {
  const ratings = require("../controllers/project_rating.controller.js");

  var router = require("express").Router();

  // Retrieve all ratings
  router.get("/", ratings.findAll);

  // Retrieve a single rating with id
  router.get("/:id", ratings.findOne);

  app.use("/api/ratings", router);
};
