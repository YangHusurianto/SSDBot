import fs from 'fs';
import path from 'path';

import { REST, Routes } from 'discord.js';

export default async function handleCommands(client) {
  client.handleCommands = async () => {
    const commandFolderPath = path.join('./src', 'commands');
    const commandFolders = fs.readdirSync(commandFolderPath);

    for (const folder of commandFolders) {
      if (folder === 'dev') continue; // skip dev commands while i figure out how to remake the reload command

      const commandPath = path.join(commandFolderPath, folder);
      const commandFiles = fs
        .readdirSync(commandPath)
        .filter((file) => file.endsWith('.js'));

      const { commands, commandArray } = client;
      for (const file of commandFiles) {
        const filePath = `../../commands/${folder}/${file}`;

        const command = (await import(filePath)).default;

        commands.set(command.data.name, command);
        if (folder === 'dev') {
          client.guildCommandArray.push(command.data.toJSON());
          continue;
        }

        commandArray.push(command.data.toJSON());
      }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    // delete all guild-based commands
    if (false) {
      rest
        .put(
          Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.DEV_GUILD_ID
          ),
          { body: [] }
        )
        .then(() => console.log('Successfully deleted all guild commands.'))
        .catch(console.error);
    }

    // delete all global commands
    if (false) {
      rest
        .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
        .then(() =>
          console.log('Successfully deleted all application commands.')
        )
        .catch(console.error);
    }

    // delete specific global command
    if (false) {
      rest
        .delete(Routes.applicationCommand(process.env.CLIENT_ID, ''))
        .then(() => console.log('Successfully deleted application command'))
        .catch(console.error);
    }

    const REFRESH_COMMANDS = process.env.REFRESH_COMMANDS === 'true';
    if (!REFRESH_COMMANDS) return;

    console.log(
      `Started refreshing ${client.commandArray.length} application (/) commands.`
    );

    try {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: client.commandArray,
      });
    } catch (error) {
      return console.error(error);
    }

    console.log(
      `Successfully reloaded ${client.commandArray.length} application (/) commands.`
    );

    console.log(
      `Started refreshing ${client.guildCommandArray.length} guild application (/) commands.`
    );

    try {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.DEV_GUILD_ID
        ),
        { body: client.guildCommandArray }
      );
    } catch (error) {
      return console.error(error);
    }

    console.log(
      `Successfully reloaded ${client.guildCommandArray.length} guild application (/) commands.`
    );

    return;
  };
}
