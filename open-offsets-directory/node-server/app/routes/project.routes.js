const recaptchaVerify = require("../middlewares/recaptcha.js");

module.exports = (app) => {
  const projects = require("../controllers/project.controller.js");

  var router = require("express").Router();

  // Create a new project (not needed for now)
  //router.post("/", projects.create);

  // Retrieve all projects, require a recaptcha if configured
  router.get("/", recaptchaVerify, projects.findAll);

  // Retrieve a single project with id
  router.get("/:id", projects.findOne);

  // Update a project with id (not needed for now)
  //router.put("/:id", projects.update);

  // Delete a project with id (not needed for now)
  //router.delete("/:id", projects.delete);

  app.use("/api/projects", router);
};
