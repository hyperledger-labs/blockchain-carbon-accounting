const db = require("../models");
const Issuance = db.issuances;
const Sequelize = db.Sequelize;
const Op = db.Sequelize.Op;

const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: issuances } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, issuances, totalPages, currentPage };
};

// Retrieve all issuances from the database.
// Applies the filters as given in the request
exports.findAll = (req, res) => {
  const { page, size } = req.query;

  let conditions = [];
  // only filter by project_id
  if (req.query["project_id"]) {
    conditions.push(
      Sequelize.where(Sequelize.col("project_id"), {
        [Op.eq]: `${req.query["project_id"]}`,
      })
    );
  }

  const { limit, offset } = getPagination(page, size);

  Issuance.findAndCountAll({
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
          err.message || "Some error occurred while retrieving issuances.",
      });
    });
};

// Find a single Issuance with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Issuance.findByPk(id)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Issuance with id=" + id,
      });
    });
};
