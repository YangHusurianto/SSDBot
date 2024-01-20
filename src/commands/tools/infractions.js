const Guild = require('../../schemas/guild');

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
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
const logsEmbed = (target, page, warnings, recents) => {
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
    name: `**Total Infractions:** ${warnings.length}\n`,
    value:
      `Infractions within the last 24 hours: ${recents[0].value}\n` +
      `Infractions within the last 7 days: ${recents[1].value}\n` +
      `Infractions within the last 30 days: ${recents[2].value}`,
  });

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
    // .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    let page = options.getInteger('page') ?? 1;

    try {
      const targetDoc = await Guild.findOne(
        { guildId: guild.id, 'users.userId': target.id },
        { 'users.$': 1 }
      );
      const warnings = targetDoc.users[0].warns;
      console.log(warnings);
      const maxPages = Math.ceil(warnings.length / INFRACTIONS_PER_PAGE);

      if (!targetDoc || !warnings?.length) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${target.username} (${target.id})`,
                iconURL: target.avatarURL(),
              })
              .addFields({
                'This user has no infractions': '🎉',
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

      const embed = logsEmbed(target, page, warnings, recents);

      const previousButton = new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('◀')
        .setStyle('Primary');

      const nextButton = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('▶')
        .setStyle('Primary');

      if (page == 1) previousButton.setDisabled(true);
      if (page == maxPages) nextButton.setDisabled(true);

      const pageControls = new ActionRowBuilder().addComponents(
        previousButton,
        nextButton
      );

      const response = await interaction.reply({
        embeds: [embed],
        components: [pageControls],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 600_000,
      });

      collector.on('collect', async (i) => {
        switch (i.customId) {
          case 'previous':
            nextButton.setDisabled(false);
            if (page - 1 == 1) previousButton.setDisabled(true);
            await i.update({
              embeds: [logsEmbed(target, --page, warnings)],
              components: [pageControls],
            });
            break;
          case 'next':
            previousButton.setDisabled(false);
            if (page + 1 == maxPages) nextButton.setDisabled(true);
            await i.update({
              embeds: [logsEmbed(target, ++page, warnings)],
              components: [pageControls],
            });
            break;
        }
      });
    } catch (err) {
      console.error(err);
    }
  },
};
