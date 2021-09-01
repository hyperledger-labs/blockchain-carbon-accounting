module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "project_registry",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: Sequelize.STRING,
      registry_project_id: Sequelize.STRING,
      arb_project: Sequelize.STRING,
      arb_id: Sequelize.STRING,
      registry_and_arb: Sequelize.STRING,
      project_type: Sequelize.STRING,
      methodology_protocol: Sequelize.STRING,
      project_listed: Sequelize.STRING,
      project_registered: Sequelize.STRING,
      active_ccb_status: Sequelize.STRING,
      registry_documents: Sequelize.STRING,
    },
    {
      timestamps: false,
      tableName: "project_registry",
    }
  );
};
