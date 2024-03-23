const { findGuild } = require('../../queries/guildQueries');
const { findAndCreateUser } = require('../../queries/userQueries');
const Guild = require('../../schemas/guild');
const { logMessage } = require('../../utils/logMessage');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

const DAILY_BAN_LIMIT = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user by sending them a private message')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for banning')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var reason = options.getString('reason');
    const date = new Date();

    await interaction.deferReply();

    if (await selfBanCheck(interaction, client, target)) return;
    if (await roleHeirarchyCheck(interaction, guild, target, member)) return;

    const modMember = interaction.guild.members.cache.find(
      (member) => member.id === target.id
    );

    if (modMember.roles.cache.has('942541250647695371')) {
      if (await antiSpamBanCheck(interaction, guild, member)) return;
    }

    try {
      banUser(interaction, client, guild, target, member, reason);
    } catch (err) {
      console.error(err);
    }
  },
};

const selfBanCheck = async (interaction, client, target) => {
  if (target.id === client.user.id) {
    await interaction.editReply({
      content: 'I cannot ban myself!',
      ephemeral: true,
    });

    return true;
  }

  if (target.id === interaction.member.id) {
    await interaction.editReply({
      content: 'You cannot ban yourself!',
      ephemeral: true,
    });

    return true;
  }

  return false;
};

const roleHeirarchyCheck = async (interaction, guild, target, member) => {
  // get the guild member for the target
  await guild.members
    .fetch(target.id)
    .then(async (targetMember) => {
      if (
        member.roles.highest.comparePositionTo(targetMember.roles.highest) < 1
      ) {
        await interaction.editReply({
          content:
            'You cannot ban a member with a higher or equal role than you!',
          ephemeral: true,
        });

        return true;
      }
    })
    .catch(async (err) => {
      await interaction.editReply({
        content:
          'Failed to fetch member for ban check. Attempting to ban anyway.',
        ephemeral: true,
      });
    });

  return false;
};

const antiSpamBanCheck = async (interaction, guild, member) => {
  const recentBans = await getRecentBans(guild.id, member.user.id);
  if (recentBans >= DAILY_BAN_LIMIT) {
    await interaction.editReply({
      content:
        'You have banned too many users recently. Please try again later.',
      ephemeral: true,
    });

    return true;
  }

  return false;
};

const banUser = async (interaction, client, guild, target, member, reason) => {
  const guildDoc = await findGuild(guild);
  // pull the tags list and convert to value
  let tags = guildDoc.autoTags;
  reason = tags.get(reason) ?? reason;

  // create the ban first so we can insert regardless of whether the user exists
  const ban = {
    _id: new mongoose.Types.ObjectId(),
    guildId: guild.id,
    targetUserId: target.id,
    type: 'BAN',
    number: guildDoc.caseNumber,
    reason: reason,
    date: new Date(),
    moderatorUserId: member.user.id,
    moderatorNotes: '',
  };

  let userDoc = await findAndCreateUser(guild.id, target.id);
  userDoc.infractions.push(ban);

  await client.users
    .send(
      target.id,
      `You have been banned from ${guild.name}.\n` +
        `**Reason:** ${reason}\n\n` +
        `If you feel this ban was not fair or made in error,` +
        `please create a ticket in the unban server at https://discord.gg/Hwtt2V8CKp.`
    )
    .catch((err) => {
      console.log('Failed to dm user about ban.');
      console.error(err);
    });

  await guild.members.ban(target.id, { reason: reason }).catch(console.error);

  guildDoc.caseNumber++;
  await guildDoc.save().catch(console.error);
  await userDoc.save().catch(console.error);

  let banConfirmation = `<:check:1196693134067896370> ${target} has been banned.`;

  if (interaction.replied) await interaction.editReply(banConfirmation);
  else await interaction.reply(banConfirmation);

  //log to channel
  logMessage(guild, `**BAN** | Case #${guildDoc.caseNumber}\n` +
  `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
    code: true,
  })})\n` +
  `**Moderator:** ${escapeMarkdown(
    `${member.user.username} (${member.user.id}`,
    { code: true }
  )})\n` +
  `**Reason:** ${reason}\n`)
};

const getRecentBans = async (guildId, userId) => {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - 1);

  const infractionsAfterDate = await Guild.aggregate([
    { $match: { guildId: guildId } },
    { $unwind: '$users' },
    { $unwind: '$users.infractions' },
    { $match: { 'users.infractions.date': { $gte: afterDate } } },
    { $match: { 'users.infractions.type': 'BAN'} }, 
    { $match: { 'users.infractions.moderatorUserId': userId } },
    { $project: { _id: 0, infractions: '$users.infractions' } },
  ]);

  return infractionsAfterDate.length;
};
