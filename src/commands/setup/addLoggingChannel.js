const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('logchannel')
    .setDescription('Set the logging channel')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to set as the logging channel')
        .setRequired(true)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, _client) {
    const { options, guild } = interaction;
    let channel = options.getChannel('channel').id;

    try {
      const guildDoc = await Guild.findOneAndUpdate({
        guildId: guild.id,
      }, {
        $set: {
          logChannel: channel,
        },
      }, {
        new: true,
      });

      if (!guildDoc) {
        await interaction.reply(`:x: Failed to set logging channel.`);
        return;
      }

      await interaction.reply(`:white_check_mark: Logging channel set to <#${channel}>.`);
    } catch (err) {
      console.error(err);
    }
  },
};
