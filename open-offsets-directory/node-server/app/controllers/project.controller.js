const db = require("../models");
const Project = db.projects;
const ProjectRating = db.project_ratings;
const ProjectRegistry = db.project_registries;
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

const _makeCol = (field, alias) => {
  return alias ? Sequelize.col(`${alias}.${field}`) : Sequelize.col(field);
};

const _makeCaseInsensitiveCond = (fieldType, field, op, value, assocAlias) => {
  if ("STRING" === fieldType) {
    return Sequelize.where(Sequelize.fn("lower", _makeCol(field, assocAlias)), {
      [op]: `${value.toLowerCase()}`,
    });
  }
  return Sequelize.where(_makeCol(field, assocAlias), { [op]: `${value}` });
};

const _makeCondition = (field, op, value, alias) => {
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

  // some fields are aliases:
  // - project_rating.verifier queries project_rating.rated_by where project_rating.rating_type = 'Verifier'
  // - project_rating.standards_organization (similar)
  // some fields are on related entities, eg:
  // - project_registry.registry_project_id
  // - project_registry.registry_and_arb
  // - project_registry.project_type
  let fieldType;
  let actualField = field;
  let modelField = null;
  let assocModel = null;
  let extraCond = null;
  if (field.startsWith("project_registry")) {
    actualField = field.substring("project_registry".length + 1);
    assocModel = ProjectRegistry;
    modelField = assocModel.rawAttributes[actualField];
  } else if (field.startsWith("project_rating")) {
    actualField = field.substring("project_rating".length + 1);
    assocModel = ProjectRating;
    // Note: special handling for "fields" verifier / standards_organization
    // which translate to the condition on rated_by AND where rating_type = 'Standards Organization' (for example).
    if (actualField === "verifier") {
      alias = actualField;
      actualField = "rated_by";
      extraCond = _makeCondition(
        "project_rating.rating_type",
        "eq",
        "Verifier",
        alias
      );
    } else if (actualField === "standards_organization") {
      alias = actualField;
      actualField = "rated_by";
      extraCond = _makeCondition(
        "project_rating.rating_type",
        "eq",
        "Standards Organization",
        alias
      );
    }
    modelField = assocModel.rawAttributes[actualField];
  } else {
    // field must be in the model
    modelField = Project.rawAttributes[field];
  }
  if (!modelField) {
    console.log("_makeCondition ignoring unknown field: ", field);
    return null;
  }
  fieldType = modelField.type.key;

  return _makeConditionInternal(
    actualField,
    fieldType,
    op,
    value,
    assocModel,
    alias,
    extraCond
  );
};

const _makeConditionInternal = (
  field,
  fieldType,
  op,
  value,
  assocModel,
  assocAlias,
  extraCond
) => {
  // for assocModel we need to wrap the where condition in an include for that model
  let cond = _makeConditionInternal2(field, fieldType, op, value, assocAlias);
  if (extraCond) {
    if (extraCond.model) {
      cond = [cond, extraCond.cond];
    } else {
      cond = [cond, extraCond];
    }
  }
  if (assocModel) {
    return {
      model: assocModel,
      alias: assocAlias,
      cond,
    };
  }
  return cond;
};

const _makeConditionInternal2 = (field, fieldType, op, value, assocAlias) => {
  if (op === "contains") {
    return Sequelize.where(Sequelize.fn("lower", _makeCol(field, assocAlias)), {
      [Op.like]: `%${value.toLowerCase()}%`,
    });
  } else if (op == "eq") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.eq, value, assocAlias);
  } else if (op == "neq") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.ne, value, assocAlias);
  } else if (op == "gte") {
    return _makeCaseInsensitiveCond(
      fieldType,
      field,
      Op.gte,
      value,
      assocAlias
    );
  } else if (op == "gt") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.gt, value, assocAlias);
  } else if (op == "lte") {
    return _makeCaseInsensitiveCond(
      fieldType,
      field,
      Op.lte,
      value,
      assocAlias
    );
  } else if (op == "lt") {
    return _makeCaseInsensitiveCond(fieldType, field, Op.lt, value, assocAlias);
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
  // Note: use an modelsMap to map from the model name to the model instance
  // since we can only use model Name as a Key
  // but we need the instance later in the query
  let modelsMap = {};
  let assocConditionsMap = {};
  for (let k in req.query) {
    let cond = _makeCondition(k, null, req.query[k]);
    if (cond) {
      if (cond.model) {
        let key = cond.alias ? cond.alias : cond.model.name;
        let assocConditions = assocConditionsMap[key];
        if (!assocConditions) {
          assocConditions = [];
          modelsMap[key] = cond.model;
        }
        console.log("findAll -> adding assocConditions", cond.model, cond.cond);
        assocConditionsMap[key] = assocConditions.concat(cond.cond);
      } else {
        console.log("findAll -> adding conditions", cond);
        conditions = conditions.concat(cond);
      }
    }
  }

  const { limit, offset } = getPagination(page, size);

  let query = {
    limit,
    offset,
  };
  if (conditions) {
    query.where = conditions;
  }
  let includes = [];
  for (let model in assocConditionsMap) {
    let assocConditions = assocConditionsMap[model];
    console.log("findAll -> add include query for ", model, assocConditions);
    let includeCondition = {
      model: modelsMap[model],
      attributes: [],
      where: assocConditions,
      required: true,
    };
    if (modelsMap[model].name !== model) {
      includeCondition.as = model;
    }
    includes.push(includeCondition);
  }
  if (includes.length) {
    query.include = includes;
    query.subQuery = false;
  }
  console.log("findAll -> query", query);

  Project.findAndCountAll(query)
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
