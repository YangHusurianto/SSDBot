// import { SlashCommandBuilder } from 'discord.js';
// import util from 'node:util';
// const exec = util.promisify(await import('node:child_process').exec);

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName('reload')
//     .setDescription('Reloads a command.')
//     .addStringOption((option) =>
//       option
//         .setName('command')
//         .setDescription('The command to reload.')
//         .setRequired(true)
//     )
//     .addStringOption((option) =>
//       option
//         .setName('type')
//         .setDescription('The type of reload.')
//         .setRequired(true)
//         .addChoices(
//           { name: 'Github', value: 'git' },
//           { name: 'Local', value: 'local' }
//         )
//     ),

//   async execute(interaction, client) {
//     if (interaction.member.id !== '147869832275034112') return;

//     const commandName = interaction.options
//       .getString('command', true)
//       .toLowerCase();
//     const command = interaction.client.commands.get(commandName);

//     if (!command) {
//       return interaction.reply(
//         `There is no command with name \`${commandName}\`!`
//       );
//     }

//     const commandPath = client.commandFilePaths.get(commandName);
//     delete require.cache[require.resolve(commandPath)];

//     if (interaction.options.getString('type', true) === 'git') {
//       try {
//         await execCommand('git reset --hard');
//         await execCommand('git fetch');
//         await execCommand('git pull');
//       } catch (error) {
//         console.error(error);
//         return await interaction.reply(
//           `There was a git error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``
//         );
//       }
//     }

//     try {
//       interaction.client.commands.delete(command.data.name);
//       const newCommand = require(commandPath);
//       interaction.client.commands.set(newCommand.data.name, newCommand);
//       await interaction.reply(
//         `Command \`${newCommand.data.name}\` was reloaded!`
//       );
//     } catch (error) {
//       console.error(error);
//       await interaction.reply(
//         `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``
//       );
//     }
//   },
// };

// async function execCommand(command) {
//   const { stdout, stderr } = await exec(command);
//   if (stdout) console.log('stdout:', stdout);
//   if (stderr) console.log('stderr:', stderr);
// }
