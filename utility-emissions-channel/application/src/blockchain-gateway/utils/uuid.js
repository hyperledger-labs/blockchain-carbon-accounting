const { v4: uuidv4 } = require("uuid");

exports.getNewUuid = () => {
  let uuid = uuidv4();
  return uuid;
};
