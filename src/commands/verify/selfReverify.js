const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('selfreverify')
    .setDescription('Check if you have been verified')
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;

    try {
      const guildDoc = await Guild.findOne(
        {
          guildId: guild.id,
          'users.userId': member.id,
        },
        { 'users.$': 1 }
      );

      if (!guildDoc || !guildDoc.users[0].verified) {
        return await interaction.reply({
          content: `:x: You are not verified in this server.`,
          ephemeral: true,
        });
      }

      // give the verified role to the user and ephemeral reply
      await member.roles.add(926253317284323389).then(() => {
        return interaction.reply({
          content: `<:check:1196693134067896370> You have been reverified!`,
          ephemeral: true,
        });
      }).catch((err) => {
        console.error(err);
        return interaction.reply({
          content: `:x: There was an error re-verifying you.`,
          ephemeral: true,
        });
      });
    } catch (err) {
      console.error(err);
    }
  },
};
