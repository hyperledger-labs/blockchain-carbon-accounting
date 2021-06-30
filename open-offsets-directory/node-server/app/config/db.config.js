module.exports = {
  HOST: "localhost",
  USER: "",
  PASSWORD: "",
  PORT: 5432,
  DB: "open-offsets-directory",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
