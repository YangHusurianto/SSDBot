const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkverify')
    .setDescription('Check if a user is verified')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to check')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');

    try {
      const guildDoc = await Guild.findOne(
        {
          guildId: guild.id,
          'users.userId': target.id,
        },
        { 'users.$': 1 }
      );

      if (!guildDoc || !guildDoc.users[0].verified)
        return await interaction.reply(
          `:x: User is not verified in this server.`
        );

      return await interaction.reply(
        `<:check:1196693134067896370> ${target} is verified!`
      );
    } catch (err) {
      console.error(err);
    }
  },
};

const findGuild = async (guild) => {
  return await Guild.findOneAndUpdate(
    { guildId: guild.id },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.iconURL(),
        caseNumber: 0,
        loggingChannel: '',
        users: [],
        autoTags: new Map(),
      },
    },
    { upsert: true, new: true }
  );
};
