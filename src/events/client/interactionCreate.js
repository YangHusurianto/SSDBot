const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const { commands } = interaction.client;
      const { commandName } = interaction;
      const command = commands.get(commandName);

      if (!command) {
        console.error(`Command ${interaction.commandName} not found`);
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'There was an error while executing this command!',
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
        return;
      }
    }

    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`AutoComplete ${interaction.commandName} not found`);
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.log(error);
      }
    }
  }
}