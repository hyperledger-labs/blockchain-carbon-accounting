const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.projects = require("./project.model.js")(sequelize, Sequelize);
db.project_registries = require("./project_registry.model.js")(sequelize, Sequelize);
db.project_ratings = require("./project_rating.model.js")(sequelize, Sequelize);
db.issuances = require("./issuance.model.js")(sequelize, Sequelize);
db.retirements = require("./retirement.model.js")(sequelize, Sequelize);

db.project_ratings.belongsTo(db.projects, {
  foreignKey: "project_id",
});
db.project_ratings.belongsTo(db.projects, {
  as: "verifier",
  foreignKey: "project_id",
});
db.project_ratings.belongsTo(db.projects, {
  as: "standards_organization",
  foreignKey: "project_id",
});

db.projects.hasMany(db.project_ratings, {
  foreignKey: "project_id",
});
db.projects.hasMany(db.project_ratings, {
  as: "verifier",
  foreignKey: "project_id",
});
db.projects.hasMany(db.project_ratings, {
  as: "standards_organization",
  foreignKey: "project_id",
});

db.project_registries.belongsTo(db.projects, {
  foreignKey: "project_id",
});
db.projects.hasMany(db.project_registries, {
  foreignKey: "project_id",
});

db.issuances.belongsTo(db.projects, {
  foreignKey: "project_id",
});
db.issuances.belongsTo(db.project_registries, {
  foreignKey: "project_id",
});
db.projects.hasMany(db.issuances, {
  foreignKey: "project_id",
});
db.project_registries.hasMany(db.issuances, {
  foreignKey: "project_id",
});

db.retirements.belongsTo(db.projects, {
  foreignKey: "project_id",
});
db.retirements.belongsTo(db.project_registries, {
  foreignKey: "project_id",
});
db.projects.hasMany(db.retirements, {
  foreignKey: "project_id",
});
db.project_registries.hasMany(db.retirements, {
  foreignKey: "project_id",
});

module.exports = db;
