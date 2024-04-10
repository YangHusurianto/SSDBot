import { findGuild } from '../../queries/guildQueries.js';
import {
  findAndCreateUser,
  getRecentByModerator,
} from '../../queries/userQueries.js';
import { logAction } from '../../utils/logs.js';
import { botSelfCheck, roleHeirarchyCheck } from '../../utils/checks.js';

import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';
import mongoose from 'mongoose';

const DAILY_BAN_LIMIT = 5;

export default {
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

    if (await botSelfCheck(interaction, target, client, 'ban')) return;
    let test = await roleHeirarchyCheck(
      interaction,
      guild,
      target,
      member,
      'ban'
    );
    console.log(test);
    if (test) return;

    if (member.roles.cache.has('942541250647695371')) {
      if (await antiSpamBanCheck(interaction, guild, member)) return;
    }

    try {
      banUser(interaction, client, guild, target, member, reason);
    } catch (err) {
      console.error(err);
    }
  },
};

const antiSpamBanCheck = async (interaction, guild, member) => {
  const recentBans = await getRecentByModerator(
    guild.id,
    member.user.id,
    'BAN',
    1
  );
  if (recentBans >= DAILY_BAN_LIMIT) {
    let banLimit = {
      content:
        'You have banned too many users recently. Please try again later.',
      ephemeral: true,
    };

    if (interaction.replied) await interaction.editReply(banLimit);
    else await interaction.reply(banLimit);

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
    duration: '0',
    moderatorUserId: member.user.id,
    moderatorNotes: '',
  };

  let userDoc = await findAndCreateUser(guild.id, target.id);
  userDoc.infractions.push(ban);

  client.users
    .send(
      target.id,
      `You have been banned from ${guild.name}.\n` +
        `**Reason:** ${reason}\n\n` +
        'If you feel this ban was not fair or made in error,' +
        'please create a ticket in the unban server at https://discord.gg/Hwtt2V8CKp'
    )
    .catch((err) => {
      console.log('Failed to dm user about ban.');
      console.error(err);
    });

  await guild.members
    .ban(target.id, { reason: reason })
    .then(async () => {
      let banConfirmation = `<:check:1196693134067896370> ${target} has been banned.`;

      if (interaction.replied) await interaction.editReply(banConfirmation);
      else await interaction.reply(banConfirmation);
    })
    .catch(console.error);

  guildDoc.caseNumber++;
  await guildDoc.save().catch(console.error);
  await userDoc.save().catch(console.error);

  //log to channel
  logAction(
    guild,
    `**BAN** | Case #${guildDoc.caseNumber}\n` +
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
