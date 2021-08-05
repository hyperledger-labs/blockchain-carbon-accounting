module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "project",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_name: Sequelize.STRING,
      scope: Sequelize.STRING,
      type: Sequelize.STRING,
      project_site_region: Sequelize.STRING,
      project_site_country: Sequelize.STRING,
      project_site_state: Sequelize.STRING,
      project_site_location: Sequelize.STRING,
      developer: Sequelize.STRING,
      total_issued: Sequelize.BIGINT,
      total_retired: Sequelize.BIGINT,
      total_outstanding: Sequelize.BIGINT,
      first_project_year: Sequelize.INTEGER,
      total_issued_future_years: Sequelize.BIGINT,
      total_retired_unknown_years: Sequelize.BIGINT,
      project_owner: Sequelize.STRING,
      offset_project_operator: Sequelize.STRING,
      authorized_project_designee: Sequelize.STRING,
      voluntary_status: Sequelize.STRING,
      project_website: Sequelize.STRING,
      notes: Sequelize.STRING,
      date_added: Sequelize.INTEGER,
      source: Sequelize.STRING,
      by_user: Sequelize.STRING,
    },
    {
      timestamps: false,
      tableName: "project",
    }
  );
};
