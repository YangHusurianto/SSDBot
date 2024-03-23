const Guild = require('../../schemas/guild');
const { findUser } = require('../../queries/userQueries');

const {
  SlashCommandBuilder,
  EmbedBuilder,
  escapeMarkdown,
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
} = require('discord.js');
const { find } = require('../../schemas/user_test');


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
    const user = options.getUser('user');
    var infractionPage = options.getInteger('page') ?? 1;

    try {
      const userDoc = await findUser(guild.id, user.id);

      if (!userDoc) {
        return interaction.reply({
          content: 'User not found',
          ephemeral: true,
        });
      }

      const infractions = userDoc.infractions;
      const maxInfractionPages = Math.ceil(infractions.length / INFRACTIONS_PER_PAGE);

      const notes = userDoc.notes;
      const maxNotesPages = Math.ceil(notes.length / INFRACTIONS_PER_PAGE);
      var notesPage = 1;

      if (infractionPage > maxInfractionPages) infractionPage = maxInfractionPages;

      if (!userDoc || (!infractions?.length && !notes?.length)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${user.username} (${user.id})`,
                iconURL: user.avatarURL(),
              })
              .addFields({
                name: 'No Infractions or Notes',
                value: '🎉',
              }),
          ],
        });
      }

      const recents = [
        { name: '1 Day', value: await getRecentInfractions(guild.id, user.id, 1) },
        { name: '7 Days', value: await getRecentInfractions(guild.id, user.id, 7) },
        {
          name: '30 Days',
          value: await getRecentInfractions(guild.id, user.id, 30),
        },
      ];

      const embed = logsEmbed(user, infractionPage, infractions, recents, notes);

      const previousInfractionPage = new ButtonBuilder()
        .setCustomId('previousInfraction')
        .setLabel('◀')
        .setStyle('Primary');

      const nextInfractionPage = new ButtonBuilder()
        .setCustomId('nextInfraction')
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

      if (infractionPage == 1) previousInfractionPage.setDisabled(true);
      if (infractionPage == maxInfractionPages) nextInfractionPage.setDisabled(true);
      if (!notes.length) notesButton.setDisabled(true);

      if (notesPage == 1) previousNotesPage.setDisabled(true);
      if (notesPage == maxNotesPages) nextNotesPage.setDisabled(true);

      const infractionsPageControls = new ActionRowBuilder().addComponents(
        previousInfractionPage,
        nextInfractionPage,
        notesButton
      );

      const notesPageControls = new ActionRowBuilder().addComponents(
        previousNotesPage,
        nextNotesPage,
        returnButton
      );

      const response = await interaction.reply({
        embeds: [embed],
        components: [infractionsPageControls],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 600_000,
      });

      collector.on('collect', async (i) => {
        switch (i.customId) {
          case 'previousInfraction':
            nextInfractionPage.setDisabled(false);
            if (infractionPage - 1 == 1) previousInfractionPage.setDisabled(true);
            await i.update({
              embeds: [logsEmbed(user, --infractionPage, infractions, recents, notes)],
              components: [infractionsPageControls],
            });
            break;
          case 'nextInfraction':
            previousInfractionPage.setDisabled(false);
            if (infractionPage + 1 == maxInfractionPages) nextInfractionPage.setDisabled(true);
            await i.update({
              embeds: [logsEmbed(user, ++infractionPage, infractions, recents, notes)],
              components: [infractionsPageControls],
            });
            break;
          case 'notes':
            await i.update({
              embeds: [notesEmbed(user, notesPage, notes)],
              components: [notesPageControls],
            });
            break;
          case 'previousNotes':
            nextNotesPage.setDisabled(false);
            if (notesPage - 1 == 1) previousNotesPage.setDisabled(true);
            await i.update({
              embeds: [notesEmbed(user, --notesPage, notes)],
              components: [notesPageControls],
            });
            break;
          case 'nextNotes':
            previousNotesPage.setDisabled(false);
            if (notesPage + 1 == maxNotesPages) nextNotesPage.setDisabled(true);
            await i.update({
              embeds: [notesEmbed(user, ++notesPage, notes)],
              components: [notesPageControls],
            });
            break;
          case 'return':
            await i.update({
              embeds: [logsEmbed(user, infractionPage, infractions, recents, notes)],
              components: [infractionsPageControls],
            });
            break;
        }
      });
    } catch (err) {
      console.error(err);
    }
  },
};

const getRecentInfractions = async (guildId, userId, timeLimit) => {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - timeLimit);

  const infractionsAfterDate = await Guild.aggregate([
    { $match: { guildId: guildId } },
    { $unwind: '$users' },
    { $match: { 'users.userId': userId } },
    { $unwind: '$users.infractions' },
    { $match: { 'users.infractions.date': { $gte: afterDate } } },
    { $project: { _id: 0, infractions: '$users.infractions' } },
  ]);

  return infractionsAfterDate.length;
};

// logs embed builder function
const logsEmbed = (target, page, infractions, recents, notes) => {
  const embed = new EmbedBuilder().setAuthor({
    name: `${target.username} (${target.id})`,
    iconURL: target.avatarURL(),
  });

  if (infractions.length > 5) {
    embed.setFooter({
      text: `Page ${page}/${Math.ceil(infractions.length / 5)}`,
    });
  }

  embed.addFields({
    name: `**Total Infractions:** ${infractions.length} | **Total Notes:** ${notes.length}`,
    value:
      `Infractions within the last 24 hours: ${recents[0].value}\n` +
      `Infractions within the last 7 days: ${recents[1].value}\n` +
      `Infractions within the last 30 days: ${recents[2].value}`,
  });

  if (infractions.length === 0) return embed;

  const startIndex = (page - 1) * 5;
  const endIndex =
    startIndex + 5 > infractions.length
      ? infractions.length
      : startIndex + 5;

  for (const infraction of infractions.slice(startIndex, endIndex)) {
    const infractionDate = new Intl.DateTimeFormat('en-US', dateOptions).format(
      infraction.date
    );
    const moderator = infraction.moderatorUserId;

    const notes = infraction.moderatorNotes
      ? `**Notes:** ${infraction.moderatorNotes}\n`
      : '';

    embed.addFields({
      name: `${infraction.type} | Case #${infraction.number}`,
      value:
        `**Reason:** ${infraction.reason}\n` +
        notes +
        `**Moderator:** <@${moderator}> ${escapeMarkdown(`(${moderator})`, {
          code: true,
        })}\n` +
        `**Date:** ${infractionDate}`,
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
