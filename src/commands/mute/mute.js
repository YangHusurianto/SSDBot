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
    .setName('mute')
    .setDescription('Mute a user for a specified amount of time and reason')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to mute')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription('The amount of time to mute the user for')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDMPermission(false),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const guild = await findGuild(interaction.guild);
    let tags = guild.autoTags;

    const filtered = Array.from(tags).filter(([key, _value]) =>
      key.startsWith(focusedValue)
    );

    if (!filtered.length && focusedValue.length === 0) {
      return await interaction.respond(
        Array.from(tags).map(([key, _value]) => ({ name: key, value: key }))
      );
    }

    return await interaction.respond(
      filtered.map(([key, _value]) => ({ name: key, value: key }))
    );
  },

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var time = options.getString('time');
    var reason = options.getString('reason');

    if (await botSelfCheck(interaction, target, client, 'warn')) return;
    if (await roleHeirarchyCheck(interaction, guild, target, member, 'warn'))
      return;
    if (await mutedCheck(interaction, guild, target)) return;

    if (time !== '0') {
      time = ms(time);
      if (!time) {
        return await interaction.reply({
          content: 'Invalid time format, please try again.',
          ephemeral: true,
        });
      }
    }

    try {
      muteUser(interaction, guild, client, target, member, time, reason);
    } catch (err) {
      console.error(err);
    }
  },
};

const muteUser = async (
  interaction,
  guild,
  client,
  target,
  member,
  time,
  reason
) => {
  const guildDoc = await findGuild(guild);

  reason = await getReplacedReason(guild, reason);

  // create the warning first so we can insert regardless of whether the user exists
  const mute = {
    _id: new mongoose.Types.ObjectId(),
    guildId: guild.id,
    targetUserId: target.id,
    type: 'MUTE',
    number: guildDoc.caseNumber,
    reason: reason,
    date: new Date(),
    duration: time,
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

  const targetMember = await guild.members.fetch(target.id);
  const savedRolesMap = targetMember.roles.valueOf();
  let savedRoles = [];
  for (const role of savedRolesMap) {
    savedRoles.push(role[0]);
  }
  userDoc.roles = savedRoles;
  userDoc.muted = true;

  await userDoc.save().catch(async (err) => {
    console.error(err);
    return await interaction.reply(':x: Failed to save mute.');
  });

  const role = guild.roles.cache.find((role) => role.name === 'MUTE');
  targetMember.roles.set([role.id]);

  let formattedTime = time;
  if (time === '0') formattedTime = 'Indefinite';
  else formattedTime = prettyMilliseconds(time, { verbose: true });
  await interaction.reply(
    `<:check:1196693134067896370> ${target} has been muted for ${formattedTime}.`
  );

  client.users
    .send(
      target.id,
      `You have been muted in ${guild.name}.\n` +
        `**Duration:** ${formattedTime}\n` +
        `**Reason:** ${reason}\n\n` +
        'If you feel this mute was not fair or made in error,' +
        'please create a ticket in the server at <#852694135927865406>'
    )
    .catch((err) => {
      console.log('Failed to dm user about mute.');
      console.error(err);
    });

  //log to channel
  await logMessage(
    guild,
    `**MUTE** | Case #${guildDoc.caseNumber - 1}\n` +
      `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
        code: true,
      })})\n` +
      `**Moderator:** ${escapeMarkdown(
        `${member.user.username} (${member.user.id}`,
        { code: true }
      )})\n` +
      `**Duration:** ${formattedTime}\n` +
      `**Reason:** ${reason}\n`
  );
};

const mutedCheck = async (interaction, guild, target) => {
  let check = false;
  const targetMember = await guild.members.fetch(target.id);
  // check if user is already muted
  if (targetMember.roles.cache.some((role) => role.name === 'MUTE')) {
    check = await interaction.reply({
      content: `${target} is already muted.`,
      ephemeral: true,
    });
  }

  return check;
};
