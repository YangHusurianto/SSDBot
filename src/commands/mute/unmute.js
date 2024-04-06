import { findGuild, getReplacedReason } from '../../queries/guildQueries.js';
import { findAndCreateUser } from '../../queries/userQueries.js';
import { logMessage } from '../../utils/logMessage.js';
import { botSelfCheck, roleHeirarchyCheck } from '../../utils/checks.js';

import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';
import mongoose from 'mongoose';

import ms from 'ms';
import prettyMilliseconds from 'pretty-ms';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user for a reason')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to umute')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var reason = options.getString('reason');

    if (await botSelfCheck(interaction, target, client, 'warn')) return;
    if (await roleHeirarchyCheck(interaction, guild, target, member, 'warn'))
      return;
    if (await unmutedCheck(interaction, guild, target)) return;

    try {
      unmuteUser(interaction, guild, target, member, reason);
    } catch (err) {
      console.error(err);
    }
  },
};

const unmuteUser = async (interaction, guild, target, member, reason) => {
  const guildDoc = await findGuild(guild);

  reason = await getReplacedReason(guild, reason);

  // create the warning first so we can insert regardless of whether the user exists
  const mute = {
    _id: new mongoose.Types.ObjectId(),
    guildId: guild.id,
    targetUserId: target.id,
    type: 'UNMUTE',
    number: guildDoc.caseNumber,
    reason: reason,
    date: new Date(),
    duration: 0,
    moderatorUserId: member.user.id,
    moderatorNotes: '',
  };

  let userDoc = await findAndCreateUser(guild.id, target.id, true);
  userDoc.infractions.push(mute);

  guildDoc.caseNumber++;
  await guildDoc.save().catch(async (err) => {
    await interaction.reply(':x: Failed to update case number.');
    console.error(err);
  });

  await userDoc.save().catch(async (err) => {
    console.error(err);
    return await interaction.reply(':x: Failed to save mute.');
  });

  const targetMember = await guild.members.fetch(target.id);
  targetMember.roles.set(userDoc.roles);

  await interaction.reply(
    `<:check:1196693134067896370> ${target} has been unmuted.`
  );

  //log to channel
  await logMessage(
    guild,
    `**UNMUTE** | Case #${guildDoc.caseNumber - 1}\n` +
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

const unmutedCheck = async (interaction, guild, target) => {
  const targetMember = await guild.members.fetch(target.id);
  // check if user is already muted
  if (targetMember.roles.cache.some((role) => role.name === 'MUTE')) {
    return false;
  }

  await interaction.reply({
    content: `${target} is already unmuted.`,
    ephemeral: true,
  });
  return true;
}