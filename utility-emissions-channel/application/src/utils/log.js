
const chalk = require("chalk");

function log(level, msg) {
    switch (level) {
      case "info":
        console.log(chalk.white.bgMagentaBright.bold(msg));
        break;
      case "okay":
        console.log(chalk.white.bgGreen.bold(msg));
        break;
      case "error":
        console.log(chalk.white.bgRedBright.bold(msg));
        break;
      default:
        console.log(msg);
    }
  }

module.exports = { log, };
  