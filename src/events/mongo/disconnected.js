const chalk = require('chalk');

module.exports = {
  name: "disconnected",
  async execute(client) {
    console.log(chalk.red("[Database Status]: Disonnected!!! :c"))
    await client.destroy();
  },
};