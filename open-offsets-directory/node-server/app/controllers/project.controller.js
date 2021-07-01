const db = require("../models");
const Project = db.projects;
const Sequelize = db.Sequelize;
const Op = db.Sequelize.Op;

const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;

  console.log(
    `getPagination page = ${page} size = ${size} -> limit = ${limit} offset = ${offset}`
  );

  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: projects } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, projects, totalPages, currentPage };
};

exports.create = (req, res) => {
  // Validate request
  if (!req.body.project_id) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a Project
  const project = {
    project_id: req.body.project_id,
    project_name: req.body.project_name,
  };

  // Save Project in the database
  Project.create(project)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Project.",
      });
    });
};

const _makeCaseInsensitiveCond = (fieldType, field, op, value) => {
  if ("STRING" === fieldType) {
    return Sequelize.where(Sequelize.fn("lower", Sequelize.col(field)), {
      [op]: `${value.toLowerCase()}`,
    });
  }
  return Sequelize.where(Sequelize.col(field), { [op]: `${value}` });
};

const _makeCondition = (field, op, value) => {
  if (!field || !value) {
    console.log("_makeCondition missing field or value: ", field, value);
    return null;
  }
  if (!op) {
    // check if we parsed the field yet
    let idx = field.indexOf("__");
    if (idx > 0) {
      op = field.substring(idx + 2);
      field = field.substring(0, idx);
      return _makeCondition(field, op, value);
    }
    // else default to contains
    return _makeCondition(field, "contains", value);
  }

  // field must be in the model
  let modelField = Project.rawAttributes[field];
  if (!modelField) {
    console.log("_makeCondition ignoring unknown field: ", field);
    return null;
  }
  let fieldType = modelField.type.key;

  console.log("_makeCondition found field type", field, fieldType);

  if (op === "contains") {
    return Sequelize.where(Sequelize.fn("lower", Sequelize.col(field)), {
      [Op.like]: `%${value.toLowerCase()}%`,
    });
  } else if (op == "eq") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.eq, value);
  } else if (op == "neq") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.ne, value);
  } else if (op == "gte") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.gte, value);
  } else if (op == "gt") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.gt, value);
  } else if (op == "lte") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.lte, value);
  } else if (op == "lt") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.lt, value);
  } else {
    console.log("_makeCondition ignoring unknown operator: ", op);
    return null;
  }
};

// Retrieve all projects from the database.
// Applies the filters as given in the request
exports.findAll = (req, res) => {
  const { page, size } = req.query;

  let conditions = [];
  for (let k in req.query) {
    let cond = _makeCondition(k, null, req.query[k]);
    if (cond) {
      conditions.push(cond);
    }
  }

  const { limit, offset } = getPagination(page, size);

  Project.findAndCountAll({
    where: conditions ? conditions : null,
    limit,
    offset,
  })
    .then((data) => {
      console.log(`findAll -> findAndCountAll = ${data}`);
      const response = getPagingData(data, page, limit);
      res.send(response);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving projects.",
      });
    });
};

// Find a single Project with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Project.findByPk(id)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Project with id=" + id,
      });
    });
};

// Update a Project by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Project.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Project was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Project with id=${id}. Maybe Project was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Project with id=" + id,
      });
    });
};

// Delete a Project with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Project.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Project was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Project with id=${id}. Maybe Project was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Project with id=" + id,
      });
    });
};
