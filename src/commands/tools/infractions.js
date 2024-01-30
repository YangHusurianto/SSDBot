const Guild = require('../../schemas/guild');

const mongoose = require('mongoose');

const {
  SlashCommandBuilder,
  EmbedBuilder,
  escapeMarkdown,
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
} = require('discord.js');

require('dotenv').config();

const dateOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
  timeZoneName: 'short',
  timeZone: 'UTC',
};

const INFRACTIONS_PER_PAGE = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('List   all infractions of a user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to all infractions of')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('page')
        .setDescription('The page of infractions to display')
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDMPermission(false),

  async execute(interaction, _client) {
    const { options, guild } = interaction;
    const target = options.getUser('user');
    var warnPage = options.getInteger('page') ?? 1;

    try {
      const targetDoc = await Guild.findOneAndUpdate(
        { guildId: guild.id, 'users.userId': target.id },
        { 'users.$': 1 },
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

      const warnings = targetDoc.users[0].warns;
      const maxWarnPages = Math.ceil(warnings.length / INFRACTIONS_PER_PAGE);

      const notes = targetDoc.users[0].notes;
      const maxNotesPages = Math.ceil(notes.length / INFRACTIONS_PER_PAGE);
      var notesPage = 1;

      if (warnPage > maxWarnPages) warnPage = maxWarnPages;

      if (!targetDoc || (!warnings?.length && !notes?.length)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${target.username} (${target.id})`,
                iconURL: target.avatarURL(),
              })
              .addFields({
                name: 'No Infractions or Notes',
                value: '🎉',
              }),
          ],
        });
      }

      const recents = [
        { name: '1 Day', value: await getRecentWarns(guild.id, target.id, 1) },
        { name: '7 Days', value: await getRecentWarns(guild.id, target.id, 7) },
        {
          name: '30 Days',
          value: await getRecentWarns(guild.id, target.id, 30),
        },
      ];

      const embed = logsEmbed(target, warnPage, warnings, recents, notes);

      const previousWarnPage = new ButtonBuilder()
        .setCustomId('previousWarn')
        .setLabel('◀')
        .setStyle('Primary');

      const nextWarnPage = new ButtonBuilder()
        .setCustomId('nextWarn')
        .setLabel('▶')
        .setStyle('Primary');

      const notesButton = new ButtonBuilder()
        .setCustomId('notes')
        .setLabel('Notes')
        .setStyle('Secondary');

      const previousNotesPage = new ButtonBuilder()
        .setCustomId('previousNotes')
        .setLabel('◀')
        .setStyle('Primary');

      const nextNotesPage = new ButtonBuilder()
        .setCustomId('nextNotes')
        .setLabel('▶')
        .setStyle('Primary');

      const returnButton = new ButtonBuilder()
        .setCustomId('return')
        .setLabel('Return')
        .setStyle('Primary');

      if (warnPage == 1) previousWarnPage.setDisabled(true);
      if (warnPage == maxWarnPages) nextWarnPage.setDisabled(true);
      if (!notes.length) notesButton.setDisabled(true);

      if (notesPage == 1) previousNotesPage.setDisabled(true);
      if (notesPage == maxNotesPages) nextNotesPage.setDisabled(true);

      const warnPageControls = new ActionRowBuilder().addComponents(
        previousWarnPage,
        nextWarnPage,
        notesButton
      );

      const notesPageControls = new ActionRowBuilder().addComponents(
        previousNotesPage,
        nextNotesPage,
        returnButton
      );

      const response = await interaction.reply({
        embeds: [embed],
        components: [warnPageControls],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 600_000,
      });

      collector.on('collect', async (i) => {
        switch (i.customId) {
          case 'previousWarn':
            nextWarnPage.setDisabled(false);
            if (warnPage - 1 == 1) previousWarnPage.setDisabled(true);
            await i.update({
              embeds: [logsEmbed(target, --warnPage, warnings, recents, notes)],
              components: [warnPageControls],
            });
            break;
          case 'nextWarn':
            previousWarnPage.setDisabled(false);
            if (warnPage + 1 == maxWarnPages) nextWarnPage.setDisabled(true);
            await i.update({
              embeds: [logsEmbed(target, ++warnPage, warnings, recents, notes)],
              components: [warnPageControls],
            });
            break;
          case 'notes':
            await i.update({
              embeds: [notesEmbed(target, notesPage, notes)],
              components: [notesPageControls],
            });
            break;
          case 'previousNotes':
            nextNotesPage.setDisabled(false);
            if (notesPage - 1 == 1) previousNotesPage.setDisabled(true);
            await i.update({
              embeds: [notesEmbed(target, --notesPage, notes)],
              components: [notesPageControls],
            });
            break;
          case 'nextNotes':
            previousNotesPage.setDisabled(false);
            if (notesPage + 1 == maxNotesPages)
              nextNotesPage.setDisabled(true);
            await i.update({
              embeds: [notesEmbed(target, ++notesPage, notes)],
              components: [notesPageControls],
            });
            break;
          case 'return':
            await i.update({
              embeds: [logsEmbed(target, warnPage, warnings, recents, notes)],
              components: [warnPageControls],
            });
            break;
        }
      });
    } catch (err) {
      console.error(err);
    }
  },
};

const getRecentWarns = async (guildId, userId, timeLimit) => {
  // const afterDate = new Date(Date.now() - timeLimit);
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - timeLimit);

  const warningsAfterDate = await Guild.aggregate([
    { $match: { guildId: guildId } },
    { $unwind: '$users' },
    { $match: { 'users.userId': userId } },
    { $unwind: '$users.warns' },
    { $match: { 'users.warns.warnDate': { $gte: afterDate } } },
    { $project: { _id: 0, warns: '$users.warns' } },
  ]);

  return warningsAfterDate.length;
};

// logs embed builder function
const logsEmbed = (target, page, warnings, recents, notes) => {
  const embed = new EmbedBuilder().setAuthor({
    name: `${target.username} (${target.id})`,
    iconURL: target.avatarURL(),
  });

  if (warnings.length > 5) {
    embed.setFooter({
      text: `Page ${page}/${Math.ceil(warnings.length / 5)}`,
    });
  }

  embed.addFields({
    name: `**Total Infractions:** ${warnings.length} | **Total Notes:** ${notes.length}`,
    value:
      `Infractions within the last 24 hours: ${recents[0].value}\n` +
      `Infractions within the last 7 days: ${recents[1].value}\n` +
      `Infractions within the last 30 days: ${recents[2].value}`,
  });

  if (warnings.length === 0) return embed;

  const startWarnIndex = (page - 1) * 5;
  const endWarnIndex =
    startWarnIndex + 5 > warnings.length ? warnings.length : startWarnIndex + 5;

  for (const warning of warnings.slice(startWarnIndex, endWarnIndex)) {
    const warnDate = new Intl.DateTimeFormat('en-US', dateOptions).format(
      warning.warnDate
    );
    const moderator = warning.moderatorUserId;

    const notes = warning.moderatorNotes
      ? `**Notes:** ${warning.moderatorNotes}\n`
      : '';

    embed.addFields({
      name: `WARN | Case #${warning.warnNumber}`,
      value:
        `**Reason:** ${warning.warnReason}\n` +
        notes +
        `**Moderator:** <@${moderator}> ${escapeMarkdown(`(${moderator})`, {
          code: true,
        })}\n` +
        `**Date:** ${warnDate}`,
    });
  }

  return embed;
};

const notesEmbed = (target, notesPage, notes) => {
  const embed = new EmbedBuilder().setAuthor({
    name: `${target.username} (${target.id})`,
    iconURL: target.avatarURL(),
  });

  if (notes.length > 5) {
    embed.setFooter({
      text: `Page ${notesPage}/${Math.ceil(notes.length / 5)}`,
    });
  }

  const startNoteIndex = (notesPage - 1) * 5;
  const endNoteIndex =
    startNoteIndex + 5 > notes.length ? notes.length : startNoteIndex + 5;

  for (const note of notes.slice(startNoteIndex, endNoteIndex)) {
    const noteDate = new Intl.DateTimeFormat('en-US', dateOptions).format(
      note.noteDate
    );
    const moderator = note.moderatorUserId;

    embed.addFields({
      name: `**Notes** | Case #${note.noteNumber}`,
      value:
        `**Note:** ${note.note}\n` +
        `**Moderator:** <@${moderator}> ${escapeMarkdown(`(${moderator})`, {
          code: true,
        })}\n` +
        `**Date:** ${noteDate}`,
    });
  }

  return embed;
};
