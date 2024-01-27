const chalk = require('chalk');
const mongoose = require('mongoose');

module.exports = {
  name: "disconnected",
  async execute(client) {
    console.log(chalk.red("[Database Status]: Disonnected!!! :c"))

    console.log(chalk.cyan("[Database Status]: Reconnecting..."))
    mongoose.connect(process.env.MONGO_CONNECTION, {
      server: { auto_reconnect: true },
    }).catch(console.error);
  },
};