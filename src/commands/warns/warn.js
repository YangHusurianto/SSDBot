const { findGuild } = require('../../queries/guildQueries');
const { findAndCreateUser } = require('../../queries/userQueries');
const { logMessage } = require('../../utils/logMessage');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');


module.exports = {
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

    if (await selfWarnCheck(interaction, target, client)) return;
    if (await roleHeirarchyCheck(interaction, guild, target, member)) return;

    try {
      warnUser(interaction, client, guild, target, member, reason);
    } catch (err) {
      console.error(err);
    }
  },
};

const selfWarnCheck = async (interaction, target, client) => {
  if (target.id === client.user.id) {
    await interaction.reply({
      content: 'I cannot warn myself!',
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
        await interaction.reply({
          content:
            'You cannot warn a member with a higher or equal role than you!',
          ephemeral: true,
        });

        return true;
      }
    })
    .catch(async (err) => {
      console.error(err);
      await interaction.reply({
        content:
          'Failed to fetch member for warn check.',
        ephemeral: true,
      });

      return true;
    });

  return false;
};

const warnUser = async (interaction, client, guild, target, member, reason) => {
  if (target.id == '145959145319694336') {
    return await interaction.reply({
      content: 'L + Bozo. Puff is too princess to be warned!',
      ephemeral: true,
    });
  }

  const guildDoc = await findGuild(guild);

  // pull the tags list and convert to value
  let tags = guildDoc.autoTags;
  finalReason = tags.get(reason);

  if (!finalReason) {
    // if no tag is found, then look for a channel tag
    const channelTags = guildDoc.channelTags;
    const tagPattern = new RegExp(
      Object.keys(channelTags.toJSON()).join('|'),
      'g'
    );

    finalReason = reason.replace(
      tagPattern,
      (matched) => `<#${channelTags.get(matched)}>`
    );
  }

  // create the warning first so we can insert regardless of whether the user exists
  const warning = {
    _id: new mongoose.Types.ObjectId(),
    guildId: guild.id,
    targetUserId: target.id,
    type: 'WARN',
    number: guildDoc.caseNumber,
    reason: finalReason,
    date: new Date(),
    moderatorUserId: member.user.id,
    moderatorNotes: '',
  };

  let userDoc = await findAndCreateUser(guild.id, target.id, true);
  userDoc.infractions.push(warning);

  guildDoc.caseNumber++;
  await guildDoc.save().catch(async (err) => {
    await interaction.editReply(`:x: Failed to update case number.`);
    console.error(err);
  });

  await userDoc.save().catch(async (err) => {
    await interaction.editReply(`:x: Failed to save warning.`);
    console.error(err);
  });

  await interaction.reply(
    `<:check:1196693134067896370> ${target} has been warned.`
  );

  client.users
    .send(
      target.id,
      'You have been warned in Sweet Sugar Dreams, ' +
        'these warnings are to inform you that a rule ' +
        'may have been broken and for us to keep track ' +
        'of your history on the server. Warnings are not ' +
        'serious, unless you keep repeating what we warned you for.\n' +
        'If you believe this warn was made in error, please make a <#852694135927865406>.\n\n' +
        `Warning: ${finalReason}`
    )
    .catch((err) => {
      console.log('Failed to dm user about warn.');
      console.err('Failed to dm user about warn.');
    });

  //log to channel
  return await logMessage(
    guild,
    `**WARN** | Case #${guildDoc.caseNumber - 1}\n` +
      `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
        code: true,
      })})\n` +
      `**Moderator:** ${escapeMarkdown(
        `${member.user.username} (${member.user.id}`,
        { code: true }
      )})\n` +
      `**Reason:** ${finalReason}\n`
  );
};
