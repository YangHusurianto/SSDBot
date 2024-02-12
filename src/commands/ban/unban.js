const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to unban')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for unbanning')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var reason = options.getString('reason');
    const date = new Date();

    try {
      const guildDoc = await findGuild(guild);

      // pull the tags list and convert to value
      let tags = guildDoc.autoTags;
      reason = tags.get(reason) ?? reason;

      // create the unban first so we can insert regardless of whether the user exists
      const unban = {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        targetUserId: target.id,
        type: 'UNBAN',
        number: guildDoc.caseNumber,
        reason: reason,
        date: date,
        moderatorUserId: member.user.id,
        moderatorNotes: '',
      };

      let userDoc = guildDoc.users.find((user) => user.userId === target.id);
      if (!userDoc) {
        userDoc = {
          _id: new mongoose.Types.ObjectId(),
          userId: target.id,
          verified: false,
          verifiedBy: '',
          notes: [],
          infractions: [unban],
        };

        guildDoc.users.push(userDoc);
      } else userDoc.infractions.push(unban);

      await guild.members
        .unban(target.id, reason)
        .catch(await interaction.reply(`:x: ${target} is not banned.`));
      guildDoc.caseNumber++;
      await guildDoc.save().catch(console.error);

      let unbanConfirmation = `<:check:1196693134067896370> ${target} has been unbanned.`;
      await interaction.reply(unbanConfirmation);

      //log to channel
      let unbanData =
        `**UNBAN** | Case #${guildDoc.caseNumber}\n` +
        `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
          code: true,
        })})\n` +
        `**Moderator:** ${escapeMarkdown(
          `${member.user.username} (${member.user.id}`,
          { code: true }
        )})\n` +
        `**Reason:** ${reason}\n`;

      if (guildDoc.loggingChannel) {
        const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
        if (!logChannel) return;

        await logChannel.send(unbanData);
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
