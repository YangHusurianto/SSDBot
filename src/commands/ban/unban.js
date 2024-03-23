const { findGuild } = require('../../queries/guildQueries');
const { findUser } = require('../../queries/userQueries');
const { logMessage } = require('../../utils/logMessage');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

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

  async execute(interaction) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var reason = options.getString('reason');

    try {
      unbanUser(interaction, guild, target, member, reason);
    } catch (err) {
      console.error(err);
    }
  },
};

const unbanUser = async (interaction, guild, target, member, reason) => {
  const guildDoc = await findGuild(guild);

  // create the unban first so we can insert regardless of whether the user exists
  const unban = {
    _id: new mongoose.Types.ObjectId(),
    guildId: guild.id,
    targetUserId: target.id,
    type: 'UNBAN',
    number: guildDoc.caseNumber,
    reason: reason,
    date: new Date(),
    moderatorUserId: member.user.id,
    moderatorNotes: '',
  };

  let userDoc = await findUser(guild.id, target.id);
  console.log(userDoc)
  if (!userDoc) {
    return await interaction.reply(`:x: ${target} is not banned.`);
  }

  userDoc.infractions.push(unban);

  await guild.members.unban(target.id, reason).catch(async (err) => {
    await interaction.reply(`:x: ${target} is not banned.`);
  });
  guildDoc.caseNumber++;
  await guildDoc.save().catch(console.error);
  await userDoc.save().catch(console.error);

  await interaction.reply(
    `<:check:1196693134067896370> ${target} has been unbanned.`
  );

  //log to channel
  logMessage(
    guild,
    `**UNBAN** | Case #${guildDoc.caseNumber}\n` +
      `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
        code: true,
      })})\n` +
      `**Moderator:** ${escapeMarkdown(
        `${member.user.username} (${member.user.id}`,
        { code: true }
      )})\n` +
      `**Reason:** ${reason}\n`
  );
};
