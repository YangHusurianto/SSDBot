const { SlashCommandBuilder } = require('discord.js');
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads a command.')
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('The command to reload.')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (interaction.member.id !== '147869832275034112') return;

    const commandName = interaction.options
      .getString('command', true)
      .toLowerCase();
    const command = interaction.client.commands.get(commandName);

    if (!command) {
      return interaction.reply(
        `There is no command with name \`${commandName}\`!`
      );
    }

    delete require.cache[require.resolve(`./commands/tools/${command.data.name}.js`)];

    try {
      await execCommand('git fetch');
      await execCommand('git pull');
    } catch (error) {
      console.error(error);
      return await interaction.reply(
        `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``
      );
    }

    try {
      interaction.client.commands.delete(command.data.name);
      const newCommand = require(`./commands/tools/${command.data.name}.js`);
      interaction.client.commands.set(newCommand.data.name, newCommand);
      await interaction.reply(
        `Command \`${newCommand.data.name}\` was reloaded!`
      );
    } catch (error) {
      console.error(error);
      await interaction.reply(
        `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``
      );
    }
  },
};

async function execCommand(command) {
  const { stdout, stderr } = await exec(command);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}