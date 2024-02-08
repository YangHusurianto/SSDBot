const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify a user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to verify')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');

    try {
      const guildDoc = await findGuild(guild);

      let userDoc = guildDoc.users.find((user) => user.userId === target.id);

      if (!userDoc) {
        userDoc = {
          _id: new mongoose.Types.ObjectId(),
          userId: target.id,
          verified: true,
          verifiedBy: member.user.id,
          notes: [],
          warns: [],
        };

        guildDoc.users.push(userDoc);
      } else if (userDoc.verified) {
        return await interaction.reply(
          `:x: ${target} is already verified!`
        );
      } else {
        userDoc.verified = true;
        userDoc.verifiedBy = member.user.id;
      }

      let verifyData =
        `**VERIFY**\n` +
        `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
          code: true,
        })})\n` +
        `**Moderator:** ${escapeMarkdown(
          `${member.user.username} (${member.user.id}`,
          { code: true }
        )})`;

      target.roles.add("926253317284323389");

      let verifyConfirmation = `<:check:1196693134067896370> ${target} has been verified!`;

      await guildDoc.save().catch(console.error);

      await interaction.reply(verifyConfirmation);

      //log to channel
      if (guildDoc.loggingChannel) {
        const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
        if (!logChannel) return;

        await logChannel.send(verifyData);
      }
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
