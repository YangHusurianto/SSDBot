const fs = require('node:fs');
const path = require('node:path');

const { REST, Routes } = require('discord.js');

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandFolderPath = path.join('./src', 'commands');
    const commandFolders = fs.readdirSync(commandFolderPath);

    for (const folder of commandFolders) {
      const commandPath = path.join(commandFolderPath, folder);
      const commandFiles = fs
        .readdirSync(commandPath)
        .filter((file) => file.endsWith('.js'));

      const { commands, commandArray } = client;
      for (const file of commandFiles) {
        const command = require(`../../commands/${folder}/${file}`);

        if (process.env.NODE_ENV === 'test' && folder !== 'dev') continue;
        if (process.env.NODE_ENV === 'production' && folder === 'dev') continue;

        commands.set(command.data.name, command);
        commandArray.push(command.data.toJSON());
      }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    // // delete all guild-based commands
    // rest
    //   .put(
    //     Routes.applicationGuildCommands(
    //       process.env.CLIENT_ID,
    //       process.env.DEV_GUILD_ID
    //     ),
    //     { body: [] }
    //   )
    //   .then(() => console.log('Successfully deleted all guild commands.'))
    //   .catch(console.error);

    // // delete all global commands
    // rest
    //   .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
    //   .then(() => console.log('Successfully deleted all application commands.'))
    //   .catch(console.error);

    const REFRESH_COMMANDS = true;
    if (!REFRESH_COMMANDS) return;

    console.log(
      `Started refreshing ${client.commandArray.length} application (/) commands.`
    );

    if (process.env.NODE_ENV === 'production') {
      try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
          body: client.commandArray,
        });
      } catch (error) {
        return console.error(error);
      }
    }

    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      try {
        await rest.put(
          Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.DEV_GUILD_ID
          ),
          { body: client.commandArray }
        );
      } catch (error) {
        return console.error(error);
      }
    }

    console.log(
      `Successfully reloaded ${client.commandArray.length} application (/) commands.`
    );

    return;
  };
};
