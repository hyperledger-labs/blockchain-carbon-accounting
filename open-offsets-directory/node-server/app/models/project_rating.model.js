module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "project_rating",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: Sequelize.STRING,
      rated_by: Sequelize.STRING,
      rating_documents: Sequelize.STRING,
      rating_type: Sequelize.STRING,
    },
    {
      timestamps: false,
      tableName: "project_rating",
    }
  );
};
