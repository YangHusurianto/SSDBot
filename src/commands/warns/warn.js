import { findGuild, getReplacedReason } from '../../queries/guildQueries.js';
import { findAndCreateUser } from '../../queries/userQueries.js';
import { logAction } from '../../utils/logs.js';
import { botSelfCheck, roleHeirarchyCheck } from '../../utils/checks.js';

import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';
import mongoose from 'mongoose';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user by sending them a private message')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to warn')
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
    var reason = options.getString('reason');

    if (await botSelfCheck(interaction, target, client, 'warn')) return;
    if (await roleHeirarchyCheck(interaction, guild, target, member, 'warn'))
      return;

    try {
      warnUser(interaction, client, guild, target, member, reason);
    } catch (err) {
      console.error(err);
    }
  },
};

const warnUser = async (interaction, client, guild, target, member, reason) => {
  if (target.id == '145959145319694336') {
    return await interaction.reply({
      content: 'L + Bozo. Puff is too princess to be warned!',
      ephemeral: true,
    });
  }

  const guildDoc = await findGuild(guild);

  reason = await getReplacedReason(guild, reason);

  // create the warning first so we can insert regardless of whether the user exists
  const warning = {
    _id: new mongoose.Types.ObjectId(),
    guildId: guild.id,
    targetUserId: target.id,
    type: 'WARN',
    number: guildDoc.caseNumber,
    reason: reason,
    date: new Date(),
    duration: 'null',
    moderatorUserId: member.user.id,
  };

  let userDoc = await findAndCreateUser(guild.id, target.id, true);
  userDoc.infractions.push(warning);

  guildDoc.caseNumber++;
  await guildDoc.save().catch(async (err) => {
    await interaction.reply(`:x: Failed to update case number.`);
    console.error(err);
  });

  await userDoc.save().catch(async (err) => {
    await interaction.reply(`:x: Failed to save warning.`);
    console.error(err);
  });

  await interaction.reply(
    `<:check:1196693134067896370> ${target} has been warned.\n` + 
    `Reason: ${reason}`
  );

  client.users
    .send(
      target.id,
      `You have been warned in ${guild.name}, ` +
        'these warnings are to inform you that a rule ' +
        'may have been broken and for us to keep track ' +
        'of your history on the server. Warnings are not ' +
        'serious, unless you keep repeating what we warned you for.\n' +
        'If you believe this warn was made in error, please make a ticket here: <#1245144267199086623>.\n\n' +
        `Warning: ${reason}`
    )
    .catch((err) => {
      console.log('Failed to dm user about warn.');
    });

  //log to channel
  return await logAction(
    guild,
    `**WARN** | Case #${guildDoc.caseNumber - 1}\n` +
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
