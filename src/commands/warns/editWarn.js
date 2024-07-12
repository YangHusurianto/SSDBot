import {
  findInfraction,
  updateInfraction,
} from '../../queries/infractionQueries.js';

import { logAction } from '../../utils/logs.js';

import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('editwarn')
    .setDescription('Edit an infraction.')
    .addIntegerOption((option) =>
      option
        .setName('infraction_number')
        .setDescription('The case number to edit')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The new reason').required(true)
    )
    .setDMPermission(false),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const infractionNumber = options.getInteger('infraction_number');
    let reason = options.getString('reason') ?? null;

    if (!reason) {
      return await interaction.reply(
        `:x: You must provide a reason to edit an infraction.`
      );
    }

    try {
      let loggedMessage = await logUpdates(
        guild,
        member,
        infractionNumber,
        reason
      );
      if (!loggedMessage) {
        return await interaction.reply(
          `:x: Infraction #${infractionNumber} not found.`
        );
      }

      return await updateInfraction(guild.id, infractionNumber, reason)
        .then(async (value) => {
          if (value) {
            await logAction(guild, loggedMessage);

            return await await interaction.reply(
              `<:check:1196693134067896370> Infraction #${infractionNumber} edited.`
            );
          }

          return await interaction.reply(
            `:x: Infraction #${infractionNumber} not found.`
          );
        })
        .catch(async (err) => {
          console.error(err);
          return await interaction.reply(
            `:x: Failed to edit infraction #${infractionNumber}.`
          );
        });
    } catch (err) {
      console.error(err);
    }
  },
};

const logUpdates = async (guild, member, infractionNumber, reason) => {
  const userDoc = await findInfraction(guild.id, infractionNumber);
  if (!userDoc) {
    return null;
  }

  const infraction = userDoc.infractions.find(
    (infraction) => infraction.number === infractionNumber
  );

  const target = await guild.members.fetch(infraction.targetUserId);

  let updates =
    `**EDIT WARN** | Case #${infractionNumber}\n` +
    `**Target:** ${escapeMarkdown(`${target.user.username} (${target.id}`, {
      code: true,
    })})\n` +
    `**Moderator:** ${escapeMarkdown(
      `${member.user.username} (${member.user.id}`,
      { code: true }
    )})\n`;

  if (reason) {
    updates += `**Old Reason**: ${infraction.reason}\n`;
    updates += `**New Reason**: ${reason}\n`;
  }

  return updates;
};
