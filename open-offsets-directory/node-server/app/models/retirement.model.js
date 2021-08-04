module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "retirement",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: Sequelize.UUID,
      project_registry_id: Sequelize.UUID,
      vintage_year: Sequelize.INTEGER,
      retirement_date: Sequelize.DATE,
      quantity_retired: Sequelize.BIGINT,
      retirement_beneficiary: Sequelize.STRING,
      retirement_reason: Sequelize.STRING,
      retirement_detail: Sequelize.STRING,
      serial_number: Sequelize.STRING,
    },
    {
      timestamps: false,
      tableName: "retirement",
    }
  );
};
