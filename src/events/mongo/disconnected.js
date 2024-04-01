import chalk from 'chalk';

export default {
  name: 'disconnected',
  async execute(client) {
    console.log(chalk.red('[Database Status]: Disonnected!!! :c'));
  },
};
