module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "issuance",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: Sequelize.UUID,
      project_registry_id: Sequelize.UUID,
      vintage_year: Sequelize.INTEGER,
      issuance_date: Sequelize.DATE,
      quantity_issued: Sequelize.BIGINT,
      serial_number: Sequelize.STRING,
    },
    {
      timestamps: false,
      tableName: "issuance",
    }
  );
};
